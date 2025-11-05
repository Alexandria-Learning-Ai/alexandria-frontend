/**
 * QuizProgress.tsx
 *
 * Displays quiz progress with percentage, question count, and animated progress bar.
 * Shows current question number, total questions, and visual progress indicator.
 *
 * Extracted from QuizScreen.js for better maintainability and testing.
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '../../types';

interface QuizProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  themeColors: ThemeColors;
  progressAnim: Animated.Value;
  translate?: (key: string) => string;
}

interface ProgressData {
  percentage: number;
  width: Animated.AnimatedInterpolation<string | number>;
}

/**
 * Calculate progress percentage and animated width
 */
const calculateProgress = (
  currentIndex: number,
  total: number,
  progressAnim: Animated.Value
): ProgressData => {
  // ✅ FIX: Add null safety and default values
  const safeCurrentIndex = typeof currentIndex === 'number' && !isNaN(currentIndex) ? currentIndex : 0;
  const safeTotal = typeof total === 'number' && !isNaN(total) && total > 0 ? total : 0;

  if (safeTotal === 0) {
    return {
      percentage: 0,
      width: progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '0%'],
      })
    };
  }

  const percentage = Math.round(((safeCurrentIndex + 1) / safeTotal) * 100);
  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return { percentage, width };
};

/**
 * QuizProgress Component
 *
 * Displays:
 * - Current question number and total
 * - Completion percentage
 * - Animated progress bar
 */
export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  themeColors,
  progressAnim,
  translate = (key) => key.split('.').pop() || key,
}) => {
  // ✅ FIX: Add null safety for display values
  const safeCurrentIndex = typeof currentQuestionIndex === 'number' && !isNaN(currentQuestionIndex) ? currentQuestionIndex : 0;
  const safeTotal = typeof totalQuestions === 'number' && !isNaN(totalQuestions) ? totalQuestions : 0;

  const progressData = calculateProgress(
    currentQuestionIndex,
    totalQuestions,
    progressAnim
  );

  return (
    <LinearGradient
      colors={[themeColors.surface, themeColors.surfaceSecondary]}
      style={styles.progressContainer}
    >
      {/* Progress Info Text */}
      <View style={styles.progressInfo}>
        <Text style={[styles.progressText, { color: themeColors.text }]}>
          {translate('quiz.trial')} {safeCurrentIndex + 1}{' '}
          {translate('quiz.of')} {safeTotal}
        </Text>
        <Text
          style={[styles.progressPercent, { color: themeColors.alexandriaGold }]}
        >
          {progressData.percentage}% {translate('quiz.complete') || 'Complete'}
        </Text>
      </View>

      {/* Animated Progress Bar */}
      <View
        style={[
          styles.progressBar,
          { backgroundColor: themeColors.borderSecondary }
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressData.width,
              backgroundColor: themeColors.alexandriaGold,
            }
          ]}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

// Memoized export - only re-renders when progress or theme changes
export default React.memo(QuizProgress);
