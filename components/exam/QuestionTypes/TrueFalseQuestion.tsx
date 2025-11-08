/**
 * TrueFalseQuestion Component
 *
 * Renders True/False questions with visual feedback
 *
 * Features:
 * - Side-by-side True/False buttons
 * - Visual indication of selection
 * - Review mode shows correct answer
 * - Disabled state in review mode
 * - Alexandria theme styling
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrueFalseQuestion as TFQuestion, ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';

interface TrueFalseQuestionProps {
  question: TFQuestion;
  userAnswer?: 'TRUE' | 'FALSE';
  onAnswer: (answer: 'TRUE' | 'FALSE') => void;
  mode: ExamMode;
}

/**
 * True/False Question Component
 *
 * Renders binary choice question with visual feedback
 *
 * @param question - Question data
 * @param userAnswer - Current selected answer
 * @param onAnswer - Callback when user selects answer
 * @param mode - 'take' (interactive) or 'review' (show correct)
 */
export default function TrueFalseQuestion({
  question,
  userAnswer,
  onAnswer,
  mode
}: TrueFalseQuestionProps) {
  const isReview = mode === 'review';
  const correctAnswer = question.correct_answer;

  const renderOption = (option: 'TRUE' | 'FALSE') => {
    const isSelected = userAnswer === option;
    const isCorrect = option === correctAnswer;
    const showCorrect = isReview && isCorrect;
    const showIncorrect = isReview && isSelected && !isCorrect;

    return (
      <TouchableOpacity
        key={option}
        style={[
          styles.optionButton,
          isSelected && styles.selectedButton,
          showCorrect && styles.correctButton,
          showIncorrect && styles.incorrectButton,
        ]}
        onPress={() => !isReview && onAnswer(option)}
        disabled={isReview}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text
            style={[
              styles.optionText,
              isSelected && styles.selectedText,
              showCorrect && styles.correctText,
              showIncorrect && styles.incorrectText,
            ]}
          >
            {option}
          </Text>
          {showCorrect && (
            <Text style={styles.checkmark}>✓</Text>
          )}
          {showIncorrect && (
            <Text style={styles.xmark}>✗</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>
      <View style={styles.optionsContainer}>
        {renderOption('TRUE')}
        {renderOption('FALSE')}
      </View>
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[12],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  selectedButton: {
    borderColor: colors.gold,
    backgroundColor: colors.bg2,
  },
  correctButton: {
    borderColor: colors.success,
    backgroundColor: '#014421', // Darker green for correct
  },
  incorrectButton: {
    borderColor: colors.danger,
    backgroundColor: '#331111', // Dark red for incorrect
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  selectedText: {
    color: colors.gold,
  },
  correctText: {
    color: colors.success,
  },
  incorrectText: {
    color: colors.danger,
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
