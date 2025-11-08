/**
 * ExamHeader - Header component for exam screen
 *
 * Displays:
 * - Exam title / topic
 * - Timer (countdown with visual warning)
 * - Progress indicator (Q5 of 20, 75%)
 * - Pause/Resume button (optional)
 *
 * Features:
 * - Timer changes color based on time remaining (green → yellow → red)
 * - Progress bar with percentage
 * - Section indicator
 * - Compact design for mobile
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useExamContext, formatTimeRemaining, useExamProgress } from './context/ExamContext';
import { colors, spacing, radius as borderRadius } from '../../theme/tokens';

// Typography tokens (not exported from theme)
const typography = {
  sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24 },
  weights: { medium: '500', semibold: '600', bold: '700' }
};

export interface ExamHeaderProps {
  title?: string;
  showTimer?: boolean;
  showProgress?: boolean;
  showPauseButton?: boolean;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  title,
  showTimer = true,
  showProgress = true,
  showPauseButton = false,
}) => {
  const { timer, pauseTimer, resumeTimer, sections, currentSectionIndex } = useExamContext();
  const { answered, total, percentage } = useExamProgress();

  const currentSection = sections[currentSectionIndex];

  /**
   * Get timer color based on time remaining
   */
  const getTimerColor = (): string => {
    if (timer.timeRemaining <= 0) return colors.danger; // Red
    if (timer.timeRemaining <= 300) return colors.danger; // Red (< 5 min)
    if (timer.timeRemaining <= 600) return colors.warning; // Yellow (< 10 min)
    return colors.success; // Green
  };

  /**
   * Get timer warning icon
   */
  const getTimerIcon = (): string => {
    if (timer.timeRemaining <= 300) return 'exclamation-triangle';
    return 'clock';
  };

  return (
    <View style={styles.container}>
      {/* Top Row: Title + Timer */}
      <View style={styles.topRow}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Exam'}
          </Text>
          <Text style={styles.sectionLabel} numberOfLines={1}>
            {currentSection?.title || 'Section I'}
          </Text>
        </View>

        {/* Timer (if enabled and duration set) */}
        {showTimer && timer.duration > 0 && (
          <View style={styles.timerContainer}>
            <View style={[styles.timerBadge, { backgroundColor: getTimerColor() }]}>
              <FontAwesome5
                name={getTimerIcon()}
                size={14}
                color={colors.bg}
                style={styles.timerIcon}
              />
              <Text style={styles.timerText}>{formatTimeRemaining(timer.timeRemaining)}</Text>
            </View>

            {/* Pause/Resume Button */}
            {showPauseButton && !timer.isExpired && (
              <TouchableOpacity
                onPress={timer.isPaused ? resumeTimer : pauseTimer}
                style={styles.pauseButton}
              >
                <FontAwesome5
                  name={timer.isPaused ? 'play' : 'pause'}
                  size={14}
                  color={colors.gold}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Bottom Row: Progress Bar + Stats */}
      {showProgress && (
        <View style={styles.progressContainer}>
          {/* Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: percentage === 100 ? colors.success : colors.gold,
                },
              ]}
            />
          </View>

          {/* Progress Text */}
          <View style={styles.progressStats}>
            <Text style={styles.progressText}>
              {answered} of {total} answered
            </Text>
            <Text style={[styles.progressText, { color: colors.gold }]}>{percentage}%</Text>
          </View>
        </View>
      )}

      {/* Timer Expired Warning */}
      {timer.isExpired && (
        <View style={styles.expiredBanner}>
          <FontAwesome5 name="exclamation-circle" size={16} color={colors.bg} />
          <Text style={styles.expiredText}>Time Expired - Exam will auto-submit</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg2,
    paddingTop: spacing[16],
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[12],
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[12],
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing[12],
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textDim,
    fontWeight: typography.weights.medium as any,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: borderRadius.md,
    gap: spacing[6],
  },
  timerIcon: {
    marginRight: spacing[4],
  },
  timerText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.bg,
  },
  pauseButton: {
    padding: spacing[8],
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  progressContainer: {
    marginTop: spacing[8],
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing[8],
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.sizes.sm,
    color: colors.textDim,
    fontWeight: typography.weights.medium as any,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: colors.danger,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: borderRadius.sm,
    marginTop: spacing[12],
  },
  expiredText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: colors.bg,
  },
});

export default ExamHeader;
