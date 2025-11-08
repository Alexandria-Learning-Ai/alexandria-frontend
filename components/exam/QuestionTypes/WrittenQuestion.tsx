/**
 * WrittenQuestion Component
 *
 * Renders open-ended written response questions
 *
 * Features:
 * - Multi-line text input
 * - Character count display
 * - Auto-save on change
 * - Review mode shows AI grading feedback
 * - Alexandria theme styling
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { WrittenQuestion as WQuestion, ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';

interface WrittenQuestionProps {
  question: WQuestion;
  userAnswer?: string;
  onAnswer: (answer: string) => void;
  mode: ExamMode;
}

/**
 * Written Response Question Component
 *
 * Allows free-form text responses with character tracking
 *
 * @param question - Question data
 * @param userAnswer - Current answer text
 * @param onAnswer - Callback when answer changes
 * @param mode - 'take' (interactive) or 'review' (read-only)
 */
export default function WrittenQuestion({
  question,
  userAnswer = '',
  onAnswer,
  mode
}: WrittenQuestionProps) {
  const [text, setText] = useState(userAnswer);
  const isReview = mode === 'review';

  // Sync local state with prop changes
  useEffect(() => {
    setText(userAnswer);
  }, [userAnswer]);

  const handleChangeText = (newText: string) => {
    setText(newText);
    onAnswer(newText);
  };

  const characterCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>

      {!isReview ? (
        <>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={handleChangeText}
            placeholder="Type your answer here..."
            placeholderTextColor={colors.textMute}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isReview}
          />
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Text>
            <Text style={styles.statsText}>
              {characterCount} {characterCount === 1 ? 'character' : 'characters'}
            </Text>
          </View>
          <Text style={styles.hintText}>
            This answer will be graded by AI after submission
          </Text>
        </>
      ) : (
        <>
          <View style={styles.reviewAnswerContainer}>
            <Text style={styles.reviewLabel}>Your Answer:</Text>
            <Text style={styles.reviewAnswerText}>
              {text || '(No answer provided)'}
            </Text>
          </View>

          {/* Grading result displayed in parent component */}
          {/* ExamResultsScreen will show GradingResult separately */}
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
  textInput: {
    minHeight: 150,
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  statsText: {
    fontSize: 13,
    color: colors.textMute,
  },
  hintText: {
    fontSize: 13,
    color: colors.textMute,
    fontStyle: 'italic',
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  reviewAnswerContainer: {
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  reviewAnswerText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
});
