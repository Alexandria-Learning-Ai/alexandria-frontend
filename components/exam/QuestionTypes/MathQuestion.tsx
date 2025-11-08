/**
 * MathQuestion Component
 *
 * Renders mathematical expression input questions with operator palette
 *
 * Features:
 * - Custom math operator keyboard
 * - Text input with operator buttons
 * - Live expression preview
 * - Support for common math symbols
 * - Take/review modes
 * - Mobile-friendly button sizes (44x44 touch targets)
 * - Alexandria theme styling
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';
import logger from '../../../utils/logger';
import MathRenderer from '../../shared/MathRenderer';
import GraphDisplay from '../GraphDisplay';

interface MathQuestionMetadata {
  requires_latex?: boolean;
  graph_expression?: string | null;
  graph_image?: string | null;
  expression_type?: string;
  variables?: string[];
  answer_format?: string;
}

interface MathQuestionData {
  question_number: number;
  question_text: string;
  question_type: 'math';
  correct_answer: string;
  section: string;
  metadata?: MathQuestionMetadata;
}

interface MathQuestionProps {
  question: MathQuestionData;
  userAnswer?: string;
  onAnswer: (answer: string) => void;
  mode: ExamMode;
}

/**
 * Math Question Component
 *
 * Provides custom math input interface with operator buttons
 *
 * @param question - Question data with math metadata
 * @param userAnswer - Current expression string
 * @param onAnswer - Callback when expression changes
 * @param mode - 'take' (interactive) or 'review' (show correct answer)
 */
export default function MathQuestion({
  question,
  userAnswer = '',
  onAnswer,
  mode
}: MathQuestionProps) {
  const [expression, setExpression] = useState(userAnswer);
  const [cursorPosition, setCursorPosition] = useState(userAnswer.length);
  const isReview = mode === 'review';

  const variables = question.metadata?.variables || [];

  // Sync with prop changes
  useEffect(() => {
    setExpression(userAnswer);
  }, [userAnswer]);

  const handleExpressionChange = (newExpression: string) => {
    setExpression(newExpression);
    onAnswer(newExpression);
    logger.debug('Math expression updated', { expression: newExpression });
  };

  const insertSymbol = (symbol: string) => {
    const before = expression.slice(0, cursorPosition);
    const after = expression.slice(cursorPosition);
    const newExpression = before + symbol + after;
    const newCursorPos = cursorPosition + symbol.length;

    setExpression(newExpression);
    setCursorPosition(newCursorPos);
    onAnswer(newExpression);
  };

  const handleClear = () => {
    setExpression('');
    setCursorPosition(0);
    onAnswer('');
  };

  const handleBackspace = () => {
    if (cursorPosition === 0) return;

    const before = expression.slice(0, cursorPosition - 1);
    const after = expression.slice(cursorPosition);
    const newExpression = before + after;

    setExpression(newExpression);
    setCursorPosition(cursorPosition - 1);
    onAnswer(newExpression);
  };

  // Define operator buttons
  const operators = [
    { symbol: '+', label: '+' },
    { symbol: '-', label: '-' },
    { symbol: '*', label: '×' },
    { symbol: '/', label: '÷' },
    { symbol: '^', label: 'xⁿ' },
    { symbol: '(', label: '(' },
    { symbol: ')', label: ')' },
    { symbol: '=', label: '=' },
    { symbol: '<', label: '<' },
    { symbol: '>', label: '>' },
    { symbol: 'sqrt(', label: '√' },
    { symbol: 'pi', label: 'π' },
  ];

  // Add variable buttons if specified in metadata
  const variableButtons = variables.map(v => ({
    symbol: v,
    label: v,
  }));

  const allButtons = [...operators, ...variableButtons];

  // Helper function to detect if text contains LaTeX (starts with backslash or contains common LaTeX symbols)
  const containsLatex = (text: string): boolean => {
    return /\\[a-zA-Z]+|[\^_{}]|\$\$?/.test(text);
  };

  const renderQuestionText = () => {
    const questionText = question.question_text;

    // Check if LaTeX rendering is needed (metadata flag or detected LaTeX syntax)
    const needsLatex = question.metadata?.requires_latex || containsLatex(questionText);

    // If question contains LaTeX, render with MathRenderer
    if (needsLatex) {
      // Remove $ delimiters if present (KaTeX handles raw LaTeX)
      const cleanedFormula = questionText
        .replace(/^\$\$/, '')
        .replace(/\$\$$/, '')
        .replace(/^\$/, '')
        .replace(/\$$/, '');

      return (
        <MathRenderer
          formula={cleanedFormula}
          fontSize={18}
          color={colors.text}
        />
      );
    }

    // Otherwise, render as plain text
    return <Text style={styles.questionText}>{questionText}</Text>;
  };

  return (
    <View style={styles.container}>
      {renderQuestionText()}

      {/* Graph Display (if available) */}
      {question.metadata?.graph_image && (
        <View style={styles.graphContainer}>
          <GraphDisplay
            imageBase64={question.metadata.graph_image.replace('data:image/png;base64,', '')}
            title={question.metadata.graph_expression
              ? `Graph of f(x) = ${question.metadata.graph_expression}`
              : undefined
            }
            width={Dimensions.get('window').width - 40}
          />
        </View>
      )}

      {!isReview ? (
        <>
          {/* Expression Input */}
          <TextInput
            style={styles.expressionInput}
            value={expression}
            onChangeText={handleExpressionChange}
            onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
            placeholder="Enter mathematical expression..."
            placeholderTextColor={colors.textMute}
            multiline={false}
            editable={!isReview}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Live Preview */}
          {expression.length > 0 && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Expression:</Text>
              <Text style={styles.previewText}>{expression}</Text>
            </View>
          )}

          {/* Operator Palette */}
          <View style={styles.paletteContainer}>
            <Text style={styles.paletteLabel}>Math Operators:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.paletteScrollView}
            >
              <View style={styles.paletteGrid}>
                {allButtons.map((btn, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.operatorButton}
                    onPress={() => insertSymbol(btn.symbol)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.operatorButtonText}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.backspaceButton}
              onPress={handleBackspace}
              activeOpacity={0.7}
            >
              <Text style={styles.backspaceButtonText}>⌫ Backspace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {question.metadata?.answer_format && (
            <Text style={styles.hintText}>
              Expected format: {question.metadata.answer_format}
            </Text>
          )}
        </>
      ) : (
        <>
          <View style={styles.reviewAnswerContainer}>
            <Text style={styles.reviewLabel}>Your Answer:</Text>
            {expression ? (
              containsLatex(expression) ? (
                <MathRenderer
                  formula={expression.replace(/^\$\$?/, '').replace(/\$\$?$/, '')}
                  fontSize={16}
                  color={colors.text}
                />
              ) : (
                <Text style={styles.reviewAnswerText}>{expression}</Text>
              )
            ) : (
              <Text style={styles.reviewAnswerText}>(No answer provided)</Text>
            )}
          </View>

          {question.correct_answer && (
            <View style={styles.correctAnswerContainer}>
              <Text style={styles.correctLabel}>Expected Answer:</Text>
              {containsLatex(question.correct_answer) ? (
                <MathRenderer
                  formula={question.correct_answer.replace(/^\$\$?/, '').replace(/\$\$?$/, '')}
                  fontSize={16}
                  color={colors.text}
                />
              ) : (
                <Text style={styles.correctAnswerText}>{question.correct_answer}</Text>
              )}
            </View>
          )}

          {question.metadata?.expression_type && (
            <Text style={styles.metadataText}>
              Expression Type: {question.metadata.expression_type}
            </Text>
          )}
        </>
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
  graphContainer: {
    marginVertical: spacing[16],
    alignItems: 'center',
  },
  expressionInput: {
    minHeight: 56,
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 18,
    fontFamily: 'monospace',
  },
  previewContainer: {
    marginTop: spacing[12],
    padding: spacing[12],
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: spacing[4],
  },
  previewText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'monospace',
  },
  paletteContainer: {
    marginTop: spacing[16],
  },
  paletteLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  paletteScrollView: {
    maxHeight: 120,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  operatorButton: {
    width: 52,
    height: 52,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    // Minimum 44x44 touch target met
  },
  operatorButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gold,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: spacing[12],
    marginTop: spacing[16],
  },
  backspaceButton: {
    flex: 1,
    paddingVertical: spacing[12],
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  backspaceButtonText: {
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
    justifyContent: 'center',
    minHeight: 48,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hintText: {
    fontSize: 13,
    color: colors.textMute,
    fontStyle: 'italic',
    marginTop: spacing[12],
    textAlign: 'center',
  },
  reviewAnswerContainer: {
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    marginBottom: spacing[12],
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  reviewAnswerText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    fontFamily: 'monospace',
  },
  correctAnswerContainer: {
    padding: spacing[16],
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: radius.md,
    marginBottom: spacing[12],
  },
  correctLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing[8],
  },
  correctAnswerText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    fontFamily: 'monospace',
  },
  metadataText: {
    fontSize: 13,
    color: colors.textMute,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
