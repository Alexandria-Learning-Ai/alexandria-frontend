/**
 * ExamFooter - Footer component for exam navigation
 *
 * Displays:
 * - Previous button
 * - Question indicator (Q5 / 20)
 * - Next button
 * - Submit button (on last question)
 *
 * Features:
 * - Disabled states based on position
 * - Visual feedback for navigation
 * - Confirmation dialog for submission
 * - Alexandria theme styling
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useExamContext, useExamProgress } from './context/ExamContext';
import { colors, spacing, radius as borderRadius } from '../../theme/tokens';

// Typography tokens (not exported from theme)
const typography = {
  sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24 },
  weights: { medium: '500', semibold: '600', bold: '700' }
};

export interface ExamFooterProps {
  onSubmit?: () => void;
  showQuestionNumber?: boolean;
}

const ExamFooter: React.FC<ExamFooterProps> = ({
  onSubmit,
  showQuestionNumber = true,
}) => {
  const {
    sections,
    currentSectionIndex,
    currentQuestionIndex,
    goToNextQuestion,
    goToPreviousQuestion,
    submitExam,
    isSubmitting,
    questions,
  } = useExamContext();

  const { answered, total, unanswered } = useExamProgress();
  const [submittingLocal, setSubmittingLocal] = useState(false);

  const currentSection = sections[currentSectionIndex];
  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;
  const isLastQuestionInSection =
    currentQuestionIndex === currentSection.questionIndices.length - 1;
  const isLastQuestion = isLastSection && isLastQuestionInSection;

  // Get current global question number
  let globalQuestionNumber = 1;
  for (let i = 0; i < currentSectionIndex; i++) {
    globalQuestionNumber += sections[i].questionCount;
  }
  globalQuestionNumber += currentQuestionIndex + 1;

  /**
   * Handle submit button press
   */
  const handleSubmit = () => {
    // Show confirmation dialog with unanswered questions
    const unansweredCount = unanswered.length;

    if (unansweredCount > 0) {
      Alert.alert(
        'Submit Exam?',
        `You have ${unansweredCount} unanswered question${
          unansweredCount === 1 ? '' : 's'
        }. Are you sure you want to submit?`,
        [
          {
            text: 'Review',
            style: 'cancel',
          },
          {
            text: 'Submit Anyway',
            style: 'destructive',
            onPress: () => performSubmit(),
          },
        ]
      );
    } else {
      // All questions answered
      Alert.alert(
        'Submit Exam?',
        'Are you sure you want to submit your exam? You cannot make changes after submission.',
        [
          {
            text: 'Review',
            style: 'cancel',
          },
          {
            text: 'Submit',
            style: 'default',
            onPress: () => performSubmit(),
          },
        ]
      );
    }
  };

  /**
   * Perform exam submission
   */
  const performSubmit = async () => {
    setSubmittingLocal(true);
    try {
      await submitExam();
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      Alert.alert('Submission Failed', 'Failed to submit exam. Please try again.');
    } finally {
      setSubmittingLocal(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Previous Button */}
      <TouchableOpacity
        style={[styles.navButton, isFirstQuestion && styles.navButtonDisabled]}
        onPress={goToPreviousQuestion}
        disabled={isFirstQuestion}
      >
        <FontAwesome5
          name="chevron-left"
          size={18}
          color={isFirstQuestion ? colors.textDim : colors.gold}
        />
        <Text
          style={[styles.navButtonText, isFirstQuestion && styles.navButtonTextDisabled]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      {/* Question Counter */}
      {showQuestionNumber && (
        <View style={styles.questionCounter}>
          <Text style={styles.questionNumber}>{globalQuestionNumber}</Text>
          <Text style={styles.questionSeparator}>/</Text>
          <Text style={styles.questionTotal}>{total}</Text>
        </View>
      )}

      {/* Next / Submit Button */}
      {!isLastQuestion ? (
        <TouchableOpacity style={styles.navButton} onPress={goToNextQuestion}>
          <Text style={styles.navButtonText}>Next</Text>
          <FontAwesome5 name="chevron-right" size={18} color={colors.gold} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || submittingLocal) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || submittingLocal}
        >
          {isSubmitting || submittingLocal ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <>
              <FontAwesome5 name="check-circle" size={18} color={colors.bg} />
              <Text style={styles.submitButtonText}>Submit Exam</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    backgroundColor: colors.bg2,
    borderTopWidth: 2,
    borderTopColor: colors.gold,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.gold,
    minWidth: 110,
  },
  navButtonDisabled: {
    opacity: 0.4,
    borderColor: colors.textDim,
  },
  navButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gold,
  },
  navButtonTextDisabled: {
    color: colors.textDim,
  },
  questionCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[4],
  },
  questionNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.gold,
  },
  questionSeparator: {
    fontSize: typography.sizes.lg,
    color: colors.textDim,
  },
  questionTotal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium as any,
    color: colors.textDim,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[14],
    borderRadius: borderRadius.md,
    backgroundColor: colors.success,
    minWidth: 140,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    backgroundColor: colors.textDim,
  },
  submitButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.bg,
  },
});

export default ExamFooter;
