/**
 * DragDropQuestion Component
 *
 * Renders drag-and-drop matching questions with touch-based interaction
 *
 * Features:
 * - Touch-based drag and drop (mobile-optimized)
 * - Visual feedback during interactions
 * - Shows current pairings clearly
 * - Review mode shows correct vs incorrect pairs
 * - Clear all functionality
 * - Alexandria theme styling
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';
import logger from '../../../utils/logger';

interface DragDropQuestionMetadata {
  items: string[];
  targets: string[];
  correct_pairs: Array<[string, string]>;
}

interface DragDropQuestionData {
  question_number: number;
  question_text: string;
  question_type: 'drag_drop';
  correct_answer: string;
  section: string;
  metadata: DragDropQuestionMetadata;
}

interface DragDropQuestionProps {
  question: DragDropQuestionData;
  userAnswer?: Array<[string, string]>;
  onAnswer: (answer: Array<[string, string]>) => void;
  mode: ExamMode;
}

/**
 * DragDrop Question Component
 *
 * Simplified touch-based matching interface for mobile
 * Uses tap-to-select paradigm instead of complex drag gestures
 *
 * @param question - Question data with items, targets, and correct pairs
 * @param userAnswer - Current array of [item, target] pairs
 * @param onAnswer - Callback when pairings change
 * @param mode - 'take' (interactive) or 'review' (show correct/incorrect)
 */
export default function DragDropQuestion({
  question,
  userAnswer = [],
  onAnswer,
  mode
}: DragDropQuestionProps) {
  const [pairings, setPairings] = useState<Map<string, string>>(new Map());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const isReview = mode === 'review';

  const items = question.metadata?.items || [];
  const targets = question.metadata?.targets || [];
  const correctPairs = question.metadata?.correct_pairs || [];

  // Initialize pairings from userAnswer
  useEffect(() => {
    const newPairings = new Map<string, string>();
    userAnswer.forEach(([item, target]) => {
      newPairings.set(item, target);
    });
    setPairings(newPairings);
  }, [userAnswer]);

  const handleItemPress = (item: string) => {
    if (isReview) return;

    if (selectedItem === item) {
      // Deselect if already selected
      setSelectedItem(null);
    } else {
      // Select this item
      setSelectedItem(item);
      logger.debug('Item selected for pairing', { item });
    }
  };

  const handleTargetPress = (target: string) => {
    if (isReview || !selectedItem) return;

    // Create new pairing
    const newPairings = new Map(pairings);
    newPairings.set(selectedItem, target);
    setPairings(newPairings);
    setSelectedItem(null);

    // Convert to array and notify parent
    const pairsArray = Array.from(newPairings.entries());
    onAnswer(pairsArray);

    logger.debug('Item paired with target', { item: selectedItem, target });
  };

  const handleClearPairing = (item: string) => {
    if (isReview) return;

    const newPairings = new Map(pairings);
    newPairings.delete(item);
    setPairings(newPairings);

    const pairsArray = Array.from(newPairings.entries());
    onAnswer(pairsArray);

    logger.debug('Pairing cleared', { item });
  };

  const handleClearAll = () => {
    if (isReview) return;

    setPairings(new Map());
    setSelectedItem(null);
    onAnswer([]);
    logger.debug('All pairings cleared');
  };

  const isPairingCorrect = (item: string, target: string): boolean => {
    return correctPairs.some(([correctItem, correctTarget]) =>
      correctItem === item && correctTarget === target
    );
  };

  const getTargetForItem = (item: string): string | undefined => {
    return pairings.get(item);
  };

  const isTargetUsed = (target: string): boolean => {
    return Array.from(pairings.values()).includes(target);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>

      {!isReview && (
        <Text style={styles.instructionText}>
          Tap an item below, then tap a target to create a pairing
        </Text>
      )}

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Items Section */}
        <Text style={styles.sectionLabel}>Items:</Text>
        <View style={styles.itemsContainer}>
          {items.map((item, index) => {
            const pairedTarget = getTargetForItem(item);
            const isSelected = selectedItem === item;
            const isPaired = !!pairedTarget;
            const isCorrectPair = isReview && pairedTarget && isPairingCorrect(item, pairedTarget);
            const isIncorrectPair = isReview && pairedTarget && !isPairingCorrect(item, pairedTarget);

            return (
              <View key={index} style={styles.itemRow}>
                <TouchableOpacity
                  style={[
                    styles.itemButton,
                    isSelected && styles.itemSelected,
                    isPaired && styles.itemPaired,
                    isCorrectPair && styles.itemCorrect,
                    isIncorrectPair && styles.itemIncorrect,
                  ]}
                  onPress={() => handleItemPress(item)}
                  disabled={isReview}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.itemText,
                      isSelected && styles.itemTextSelected,
                      isPaired && styles.itemTextPaired,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>

                {isPaired && (
                  <View style={styles.pairingInfo}>
                    <Text style={styles.arrow}>→</Text>
                    <View
                      style={[
                        styles.pairedTargetBadge,
                        isCorrectPair && styles.pairedTargetCorrect,
                        isIncorrectPair && styles.pairedTargetIncorrect,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pairedTargetText,
                          isCorrectPair && styles.pairedTargetTextCorrect,
                          isIncorrectPair && styles.pairedTargetTextIncorrect,
                        ]}
                      >
                        {pairedTarget}
                      </Text>
                    </View>
                    {!isReview && (
                      <TouchableOpacity
                        onPress={() => handleClearPairing(item)}
                        style={styles.clearButton}
                      >
                        <Text style={styles.clearButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                    {isReview && (
                      <Text style={isCorrectPair ? styles.checkmark : styles.xmark}>
                        {isCorrectPair ? '✓' : '✗'}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Targets Section */}
        <Text style={[styles.sectionLabel, styles.targetsSectionLabel]}>
          {selectedItem ? 'Select a target:' : 'Targets:'}
        </Text>
        <View style={styles.targetsContainer}>
          {targets.map((target, index) => {
            const used = isTargetUsed(target);
            const canSelect = selectedItem && !used;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.targetButton,
                  used && styles.targetUsed,
                  canSelect && styles.targetSelectable,
                ]}
                onPress={() => handleTargetPress(target)}
                disabled={isReview || !canSelect}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.targetText,
                    used && styles.targetTextUsed,
                    canSelect && styles.targetTextSelectable,
                  ]}
                >
                  {target}
                </Text>
                {used && <Text style={styles.usedIndicator}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Clear All Button */}
        {!isReview && pairings.size > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearAllButtonText}>Clear All Pairings</Text>
          </TouchableOpacity>
        )}

        {/* Review Mode: Show Correct Answers */}
        {isReview && (
          <View style={styles.correctAnswersContainer}>
            <Text style={styles.correctAnswersLabel}>Correct Pairings:</Text>
            {correctPairs.map(([item, target], index) => (
              <View key={index} style={styles.correctPairRow}>
                <Text style={styles.correctPairText}>
                  {item} → {target}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    marginBottom: spacing[12],
  },
  instructionText: {
    fontSize: 14,
    color: colors.textDim,
    fontStyle: 'italic',
    marginBottom: spacing[16],
  },
  scrollContainer: {
    maxHeight: 600,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[12],
    marginTop: spacing[8],
  },
  targetsSectionLabel: {
    marginTop: spacing[20],
  },
  itemsContainer: {
    gap: spacing[8],
  },
  itemRow: {
    marginBottom: spacing[8],
  },
  itemButton: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  itemSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.bg2,
  },
  itemPaired: {
    borderColor: colors.blue,
    backgroundColor: colors.bg2,
  },
  itemCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.green,
  },
  itemIncorrect: {
    borderColor: colors.danger,
    backgroundColor: '#331111',
  },
  itemText: {
    fontSize: 15,
    color: colors.text,
  },
  itemTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  itemTextPaired: {
    color: colors.blue,
  },
  pairingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[8],
    paddingLeft: spacing[16],
    gap: spacing[8],
  },
  arrow: {
    fontSize: 18,
    color: colors.textDim,
  },
  pairedTargetBadge: {
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: radius.sm,
  },
  pairedTargetCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.green,
  },
  pairedTargetIncorrect: {
    borderColor: colors.danger,
    backgroundColor: '#331111',
  },
  pairedTargetText: {
    fontSize: 14,
    color: colors.blue,
  },
  pairedTargetTextCorrect: {
    color: colors.success,
  },
  pairedTargetTextIncorrect: {
    color: colors.danger,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  targetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  targetButton: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    minHeight: 48,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  targetUsed: {
    backgroundColor: colors.bg,
    borderColor: colors.textMute,
    opacity: 0.5,
  },
  targetSelectable: {
    borderColor: colors.gold,
    backgroundColor: colors.bg2,
  },
  targetText: {
    fontSize: 14,
    color: colors.text,
  },
  targetTextUsed: {
    color: colors.textMute,
  },
  targetTextSelectable: {
    color: colors.gold,
    fontWeight: '600',
  },
  usedIndicator: {
    fontSize: 14,
    color: colors.textMute,
  },
  clearAllButton: {
    marginTop: spacing[20],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  clearAllButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  correctAnswersContainer: {
    marginTop: spacing[24],
    padding: spacing[16],
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: radius.md,
  },
  correctAnswersLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing[12],
  },
  correctPairRow: {
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    marginBottom: spacing[8],
  },
  correctPairText: {
    fontSize: 14,
    color: colors.text,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
  },
  xmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.danger,
  },
});
