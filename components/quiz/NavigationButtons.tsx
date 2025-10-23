/**
 * NavigationButtons.tsx
 *
 * Quiz navigation buttons (Previous, Next, Submit).
 * Handles quiz navigation and submission with beautiful Alexandria styling.
 *
 * Extracted from QuizScreen.js for better maintainability and testing.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import type { ThemeColors } from '../../types';
import { buttonA11y, disabledA11y } from '../../utils/a11y';

interface NavigationButtonsProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  themeColors: ThemeColors;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isChallenge?: boolean;
  translate?: (key: string) => string;
  hasAnswered?: boolean;
  allQuestionsAnswered?: boolean; // NEW: Check if all questions are answered
}

/**
 * NavigationButtons Component
 *
 * Displays:
 * - Previous button (disabled on first question)
 * - Next button (on all questions except last)
 * - Submit button (on last question)
 */
export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentQuestionIndex,
  totalQuestions,
  themeColors,
  onPrevious,
  onNext,
  onSubmit,
  isChallenge = false,
  translate = (key) => key.split('.').pop() || key,
  hasAnswered = true,
  allQuestionsAnswered = true, // Default to true for backward compatibility
}) => {
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const canSubmit = allQuestionsAnswered; // Only allow submission if all questions answered

  return (
    <LinearGradient
      colors={[themeColors.surface, themeColors.overlay]}
      style={styles.navigationContainer}
    >
      {/* Previous Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          {
            backgroundColor: isFirstQuestion
              ? themeColors.borderSecondary
              : themeColors.surface,
            borderColor: themeColors.border,
            opacity: isFirstQuestion ? 0.5 : 1,
          }
        ]}
        onPress={onPrevious}
        disabled={isFirstQuestion}
        activeOpacity={0.8}
        {...(isFirstQuestion
          ? disabledA11y('Previous question', 'button')
          : buttonA11y('Previous question', 'Go to previous quiz question'))}
      >
        <FontAwesome5
          name="chevron-left"
          size={16}
          color={themeColors.text}
        />
        <Text style={[styles.navButtonText, { color: themeColors.text }]}>
          {translate('quiz.previous') || 'Previous'}
        </Text>
      </TouchableOpacity>

      {/* Next or Submit Button */}
      {isLastQuestion ? (
        /* Submit Button (on last question) */
        <TouchableOpacity
          onPress={canSubmit ? onSubmit : undefined}
          activeOpacity={canSubmit ? 0.8 : 1}
          disabled={!canSubmit}
          {...(canSubmit
            ? buttonA11y(
                isChallenge ? 'Complete trial' : 'Submit quiz',
                'Submits your answers and shows results'
              )
            : disabledA11y(
                isChallenge ? 'Complete trial' : 'Submit quiz',
                'button'
              ))}
        >
          <LinearGradient
            colors={canSubmit
              ? [themeColors.alexandriaGold, themeColors.alexandriaBronze]
              : [themeColors.borderSecondary, themeColors.borderSecondary]
            }
            style={[styles.submitButton, !canSubmit && { opacity: 0.5 }]}
          >
            <FontAwesome5
              name="scroll"
              size={16}
              color={canSubmit ? "#FFFFFF" : themeColors.textSecondary}
            />
            <Text style={[styles.submitButtonText, !canSubmit && { color: themeColors.textSecondary }]}>
              {isChallenge
                ? translate('quiz.completeTrial') || 'Complete Trial'
                : translate('quiz.submitWisdom') || 'Submit Wisdom'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        /* Next Button (on all other questions) */
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: hasAnswered ? themeColors.alexandriaNavy : themeColors.borderSecondary,
              borderColor: hasAnswered ? themeColors.alexandriaNavy : themeColors.border,
              opacity: hasAnswered ? 1 : 0.5,
            }
          ]}
          onPress={onNext}
          disabled={!hasAnswered}
          activeOpacity={0.8}
          {...(hasAnswered
            ? buttonA11y('Next question', 'Moves to next quiz question')
            : disabledA11y('Next question', 'button'))}
        >
          <Text style={[styles.navButtonText, { color: hasAnswered ? '#FFFFFF' : themeColors.textSecondary }]}>
            {translate('quiz.next') || 'Next'}
          </Text>
          <FontAwesome5
            name="chevron-right"
            size={16}
            color={hasAnswered ? '#FFFFFF' : themeColors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

// Memoized export - only re-renders when navigation state changes
export default React.memo(NavigationButtons);
