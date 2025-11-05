/**
 * ProgressSection - Displays overall material progress
 *
 * Features:
 * - Overall material progress display
 * - Progress bar showing percentage complete
 * - Text: "X of Y chapters completed"
 * - Continue Reading button (primary CTA)
 * - Last read timestamp (e.g., "Last read 2 hours ago")
 * - Alexandria theme styling
 * - Disabled state when all chapters complete
 *
 * @param completedChapters - Number of completed chapters
 * @param totalChapters - Total number of chapters
 * @param overallPercentage - Overall progress percentage (0.0 to 1.0)
 * @param lastOpenedChapterId - ID of last opened chapter (null if none)
 * @param lastOpenedTime - ISO timestamp of last read (null if none)
 * @param onContinueReading - Callback to continue reading
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import ProgressBar from '../shared/ProgressBar';

interface ProgressSectionProps {
  completedChapters: number;
  totalChapters: number;
  overallPercentage: number;
  lastOpenedChapterId: string | null;
  lastOpenedTime: string | null;
  onContinueReading: () => void;
}

const ProgressSection: React.FC<ProgressSectionProps> = ({
  completedChapters,
  totalChapters,
  overallPercentage,
  lastOpenedChapterId,
  lastOpenedTime,
  onContinueReading,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accent,
      accentLight: Colors.accentLight,
      primary: Colors.primary,
      border: Colors.border,
      success: Colors.success,
    }),
    []
  );

  const isComplete = completedChapters === totalChapters && totalChapters > 0;
  const hasStarted = lastOpenedChapterId !== null || completedChapters > 0;

  // Format relative time (e.g., "2 hours ago", "3 days ago")
  const formatRelativeTime = (isoString: string | null): string | null => {
    if (!isoString) return null;

    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      }
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } catch (error) {
      return null;
    }
  };

  const relativeTime = formatRelativeTime(lastOpenedTime);

  const getButtonText = (): string => {
    if (isComplete) return 'Completed';
    if (!hasStarted) return 'Start Reading';
    return 'Continue Reading';
  };

  const getButtonIcon = (): string => {
    if (isComplete) return 'check-circle';
    return 'book-reader';
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.contentContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <ProgressBar
            progress={overallPercentage}
            height={10}
            color={isComplete ? themeColors.success : themeColors.accent}
            backgroundColor={Colors.gray200}
            animated
          />
        </View>

        {/* Progress Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.progressText, { color: themeColors.text }]}>
            {completedChapters} of {totalChapters} {totalChapters === 1 ? 'chapter' : 'chapters'}{' '}
            completed
          </Text>
          <Text style={[styles.percentageText, { color: themeColors.accent }]}>
            {Math.round(overallPercentage * 100)}%
          </Text>
        </View>

        {/* Continue Reading Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: isComplete ? themeColors.success : themeColors.primary,
              opacity: isComplete ? 0.7 : 1,
            },
          ]}
          onPress={onContinueReading}
          disabled={isComplete}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name={getButtonIcon()}
            size={18}
            color={Colors.white}
            style={styles.buttonIcon}
            solid={isComplete}
          />
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        </TouchableOpacity>

        {/* Last Read Timestamp */}
        {relativeTime && (
          <View style={styles.timestampContainer}>
            <FontAwesome5
              name="clock"
              size={12}
              color={themeColors.textMuted}
              style={styles.timestampIcon}
            />
            <Text style={[styles.timestampText, { color: themeColors.textMuted }]}>
              Last read {relativeTime}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '700',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 52,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  timestampIcon: {
    marginRight: 6,
  },
  timestampText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ProgressSection;
