/**
 * DiagramQuestion Component
 *
 * Renders diagram drawing questions with touch-based drawing canvas
 *
 * Features:
 * - Touch-based freeform drawing using SVG
 * - Multiple drawing tools (pen, line, shapes)
 * - Color picker with Alexandria theme colors
 * - Stroke width adjustment
 * - Clear canvas functionality
 * - Requirements checklist display
 * - Export to base64 PNG (using viewShot)
 * - Take/review modes
 * - Alexandria theme styling
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import Svg, { Path, Line, Circle, Rect, G } from 'react-native-svg';
import { ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';
import logger from '../../../utils/logger';

interface DiagramQuestionMetadata {
  canvas_type?: string;
  requirements?: string[];
  evaluation_criteria?: string[];
}

export interface DiagramAnswer {
  paths: DrawingPath[];
  timestamp: string;
}

interface DrawingPath {
  type: 'path' | 'line' | 'circle' | 'rect';
  points?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
}

interface DiagramQuestionData {
  question_number: number;
  question_text: string;
  question_type: 'diagram';
  correct_answer: string;
  section: string;
  metadata?: DiagramQuestionMetadata;
}

interface DiagramQuestionProps {
  question: DiagramQuestionData;
  userAnswer?: DiagramAnswer;
  onAnswer: (answer: DiagramAnswer) => void;
  mode: ExamMode;
}

type DrawTool = 'pen' | 'line' | 'circle' | 'rect' | 'eraser';

/**
 * Diagram Question Component
 *
 * Provides touch-based drawing canvas with tools and colors
 *
 * @param question - Question data with diagram metadata
 * @param userAnswer - Current diagram data (paths array)
 * @param onAnswer - Callback when diagram changes
 * @param mode - 'take' (interactive) or 'review' (read-only)
 */
export default function DiagramQuestion({
  question,
  userAnswer,
  onAnswer,
  mode
}: DiagramQuestionProps) {
  const [paths, setPaths] = useState<DrawingPath[]>(userAnswer?.paths || []);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<DrawTool>('pen');
  const [currentColor, setCurrentColor] = useState(colors.gold);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const isReview = mode === 'review';

  const requirements = question.metadata?.requirements || [];
  const canvasType = question.metadata?.canvas_type || 'freeform';

  const screenWidth = Dimensions.get('window').width;
  const canvasWidth = screenWidth - spacing[16] * 2;
  const canvasHeight = 400;

  // Sync with userAnswer prop changes
  useEffect(() => {
    if (userAnswer?.paths) {
      setPaths(userAnswer.paths);
    }
  }, [userAnswer]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isReview,
      onMoveShouldSetPanResponder: () => !isReview,
      onPanResponderGrant: (evt) => {
        if (isReview) return;

        const { locationX, locationY } = evt.nativeEvent;
        setStartPoint({ x: locationX, y: locationY });

        if (currentTool === 'pen') {
          setCurrentPath(`M ${locationX},${locationY}`);
        }
      },
      onPanResponderMove: (evt) => {
        if (isReview) return;

        const { locationX, locationY } = evt.nativeEvent;

        if (currentTool === 'pen') {
          setCurrentPath((prev) => `${prev} L ${locationX},${locationY}`);
        }
        // For shapes, we'll finalize on release
      },
      onPanResponderRelease: (evt) => {
        if (isReview || !startPoint) return;

        const { locationX, locationY } = evt.nativeEvent;
        const newPaths = [...paths];

        if (currentTool === 'pen') {
          newPaths.push({
            type: 'path',
            points: currentPath,
            color: currentColor,
            strokeWidth,
          });
        } else if (currentTool === 'line') {
          newPaths.push({
            type: 'line',
            x1: startPoint.x,
            y1: startPoint.y,
            x2: locationX,
            y2: locationY,
            color: currentColor,
            strokeWidth,
          });
        } else if (currentTool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(locationX - startPoint.x, 2) + Math.pow(locationY - startPoint.y, 2)
          );
          newPaths.push({
            type: 'circle',
            cx: startPoint.x,
            cy: startPoint.y,
            r: radius,
            color: currentColor,
            strokeWidth,
          });
        } else if (currentTool === 'rect') {
          newPaths.push({
            type: 'rect',
            x1: Math.min(startPoint.x, locationX),
            y1: Math.min(startPoint.y, locationY),
            width: Math.abs(locationX - startPoint.x),
            height: Math.abs(locationY - startPoint.y),
            color: currentColor,
            strokeWidth,
          });
        }

        setPaths(newPaths);
        setCurrentPath('');
        setStartPoint(null);

        // Notify parent
        const answer: DiagramAnswer = {
          paths: newPaths,
          timestamp: new Date().toISOString(),
        };
        onAnswer(answer);

        logger.debug('Diagram updated', { pathCount: newPaths.length, tool: currentTool });
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    const answer: DiagramAnswer = {
      paths: [],
      timestamp: new Date().toISOString(),
    };
    onAnswer(answer);
    logger.debug('Canvas cleared');
  };

  const handleUndo = () => {
    if (paths.length === 0) return;
    const newPaths = paths.slice(0, -1);
    setPaths(newPaths);
    const answer: DiagramAnswer = {
      paths: newPaths,
      timestamp: new Date().toISOString(),
    };
    onAnswer(answer);
  };

  const drawingColors = [colors.gold, colors.text, colors.success, colors.danger, colors.blue, colors.purple];
  const strokeWidths = [2, 3, 5, 8];
  const tools: { name: DrawTool; label: string; icon: string }[] = [
    { name: 'pen', label: 'Pen', icon: '✏️' },
    { name: 'line', label: 'Line', icon: '📏' },
    { name: 'circle', label: 'Circle', icon: '⭕' },
    { name: 'rect', label: 'Rect', icon: '⬜' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>

      {/* Requirements Checklist */}
      {requirements.length > 0 && (
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsLabel}>Requirements:</Text>
          {requirements.map((req, index) => (
            <View key={index} style={styles.requirementRow}>
              <Text style={styles.requirementBullet}>•</Text>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Canvas */}
      <View
        style={[styles.canvasContainer, { width: canvasWidth, height: canvasHeight }]}
        {...(isReview ? {} : panResponder.panHandlers)}
      >
        <Svg width={canvasWidth} height={canvasHeight} style={styles.svg}>
          <G>
            {/* Render saved paths */}
            {paths.map((path, index) => {
              if (path.type === 'path') {
                return (
                  <Path
                    key={index}
                    d={path.points}
                    stroke={path.color}
                    strokeWidth={path.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              } else if (path.type === 'line') {
                return (
                  <Line
                    key={index}
                    x1={path.x1}
                    y1={path.y1}
                    x2={path.x2}
                    y2={path.y2}
                    stroke={path.color}
                    strokeWidth={path.strokeWidth}
                    strokeLinecap="round"
                  />
                );
              } else if (path.type === 'circle') {
                return (
                  <Circle
                    key={index}
                    cx={path.cx}
                    cy={path.cy}
                    r={path.r}
                    stroke={path.color}
                    strokeWidth={path.strokeWidth}
                    fill="none"
                  />
                );
              } else if (path.type === 'rect') {
                return (
                  <Rect
                    key={index}
                    x={path.x1}
                    y={path.y1}
                    width={path.width}
                    height={path.height}
                    stroke={path.color}
                    strokeWidth={path.strokeWidth}
                    fill="none"
                  />
                );
              }
              return null;
            })}

            {/* Render current path being drawn */}
            {currentPath && currentTool === 'pen' && (
              <Path
                d={currentPath}
                stroke={currentColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </G>
        </Svg>
      </View>

      {!isReview && (
        <>
          {/* Drawing Tools */}
          <View style={styles.toolsContainer}>
            <Text style={styles.toolsLabel}>Tool:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.toolsRow}>
                {tools.map((tool) => (
                  <TouchableOpacity
                    key={tool.name}
                    style={[
                      styles.toolButton,
                      currentTool === tool.name && styles.toolButtonActive,
                    ]}
                    onPress={() => setCurrentTool(tool.name)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toolIcon}>{tool.icon}</Text>
                    <Text
                      style={[
                        styles.toolLabel,
                        currentTool === tool.name && styles.toolLabelActive,
                      ]}
                    >
                      {tool.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Color Picker */}
          <View style={styles.colorsContainer}>
            <Text style={styles.colorsLabel}>Color:</Text>
            <View style={styles.colorsRow}>
              {drawingColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    currentColor === color && styles.colorButtonActive,
                  ]}
                  onPress={() => setCurrentColor(color)}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </View>

          {/* Stroke Width */}
          <View style={styles.strokeContainer}>
            <Text style={styles.strokeLabel}>Width:</Text>
            <View style={styles.strokeRow}>
              {strokeWidths.map((width) => (
                <TouchableOpacity
                  key={width}
                  style={[
                    styles.strokeButton,
                    strokeWidth === width && styles.strokeButtonActive,
                  ]}
                  onPress={() => setStrokeWidth(width)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.strokePreview,
                      { height: width, backgroundColor: currentColor },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.undoButton}
              onPress={handleUndo}
              disabled={paths.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.undoButtonText}>↶ Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              disabled={paths.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isReview && (
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewInfoText}>
            Drawing submitted with {paths.length} element{paths.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[24],
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing[16],
  },
  requirementsContainer: {
    padding: spacing[12],
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    marginBottom: spacing[16],
  },
  requirementsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  requirementRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  requirementBullet: {
    fontSize: 14,
    color: colors.textDim,
    marginRight: spacing[8],
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDim,
  },
  canvasContainer: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing[16],
  },
  svg: {
    backgroundColor: '#FFFFFF',
  },
  toolsContainer: {
    marginBottom: spacing[12],
  },
  toolsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  toolsRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  toolButton: {
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.sm,
    alignItems: 'center',
    minWidth: 70,
    minHeight: 48,
  },
  toolButtonActive: {
    borderColor: colors.gold,
    backgroundColor: colors.bg2,
  },
  toolIcon: {
    fontSize: 20,
    marginBottom: spacing[4],
  },
  toolLabel: {
    fontSize: 12,
    color: colors.textDim,
  },
  toolLabelActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  colorsContainer: {
    marginBottom: spacing[12],
  },
  colorsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  colorsRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: colors.text,
  },
  strokeContainer: {
    marginBottom: spacing[16],
  },
  strokeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  strokeRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  strokeButton: {
    width: 60,
    height: 44,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeButtonActive: {
    borderColor: colors.gold,
    backgroundColor: colors.bg2,
  },
  strokePreview: {
    width: 40,
    borderRadius: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: spacing[12],
    marginTop: spacing[8],
  },
  undoButton: {
    flex: 1,
    paddingVertical: spacing[12],
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 48,
  },
  undoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDim,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing[12],
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 48,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewInfo: {
    padding: spacing[12],
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  reviewInfoText: {
    fontSize: 14,
    color: colors.textDim,
    fontStyle: 'italic',
  },
});
