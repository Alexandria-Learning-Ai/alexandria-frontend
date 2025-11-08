/**
 * MultipleChoiceQuestion Component
 *
 * Renders multiple choice questions with A/B/C/D options
 *
 * Features:
 * - Radio-style single selection
 * - Visual feedback for selection
 * - Review mode shows correct answer
 * - Supports dynamic option count
 * - Alexandria theme styling
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MultipleChoiceQuestion as MCQuestion, ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';

interface MultipleChoiceQuestionProps {
  question: MCQuestion;
  userAnswer?: string;
  onAnswer: (answer: string) => void;
  mode: ExamMode;
}

/**
 * Multiple Choice Question Component
 *
 * Renders question with lettered options (A, B, C, D, etc.)
 *
 * @param question - Question data with options array
 * @param userAnswer - Current selected letter
 * @param onAnswer - Callback when user selects option
 * @param mode - 'take' (interactive) or 'review' (show correct)
 */
export default function MultipleChoiceQuestion({
  question,
  userAnswer,
  onAnswer,
  mode
}: MultipleChoiceQuestionProps) {
  const isReview = mode === 'review';
  const correctAnswer = question.correct_answer;
  const options = question.options || [];

  const renderOption = (option: string, index: number) => {
    const letter = String.fromCharCode(65 + index); // A, B, C, D...
    const isSelected = userAnswer === letter;
    const isCorrect = letter === correctAnswer;
    const showCorrect = isReview && isCorrect;
    const showIncorrect = isReview && isSelected && !isCorrect;

    return (
      <TouchableOpacity
        key={letter}
        style={[
          styles.optionButton,
          isSelected && styles.selectedButton,
          showCorrect && styles.correctButton,
          showIncorrect && styles.incorrectButton,
        ]}
        onPress={() => !isReview && onAnswer(letter)}
        disabled={isReview}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <View
            style={[
              styles.letterCircle,
              isSelected && styles.letterCircleSelected,
              showCorrect && styles.letterCircleCorrect,
              showIncorrect && styles.letterCircleIncorrect,
            ]}
          >
            <Text
              style={[
                styles.letterText,
                isSelected && styles.letterTextSelected,
                showCorrect && styles.letterTextCorrect,
                showIncorrect && styles.letterTextIncorrect,
              ]}
            >
              {letter}
            </Text>
          </View>
          <Text
            style={[
              styles.optionText,
              isSelected && styles.optionTextSelected,
              showCorrect && styles.optionTextCorrect,
              showIncorrect && styles.optionTextIncorrect,
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
        {options.map((option, index) => renderOption(option, index))}
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
    gap: spacing[12],
  },
  optionButton: {
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    minHeight: 60,
  },
  selectedButton: {
    borderColor: colors.gold,
    backgroundColor: colors.bg2,
  },
  correctButton: {
    borderColor: colors.success,
    backgroundColor: '#014421',
  },
  incorrectButton: {
    borderColor: colors.danger,
    backgroundColor: '#331111',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  letterCircleSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  letterCircleCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  letterCircleIncorrect: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  letterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDim,
  },
  letterTextSelected: {
    color: colors.bg,
  },
  letterTextCorrect: {
    color: '#FFFFFF',
  },
  letterTextIncorrect: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: colors.success,
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: colors.textDim,
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
