/**
 * QuickQuizButton - One-tap quiz generation with smart defaults preview
 *
 * Features:
 * - Displays auto-detected quiz settings
 * - Shows estimated completion time
 * - Primary "Quick Quiz" action (one tap to generate)
 * - Secondary "Customize" action (power users)
 * - Low confidence warning when subject detection is uncertain
 *
 * Design:
 * - Alexandria theme colors (gold accents, navy background)
 * - Clear visual hierarchy (preview → actions)
 * - Accessible touch targets (44x44 minimum)
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SmartDefaults } from '../../types/smartDefaults';
import { colors, radius, spacing, shadow } from '../../theme/tokens';

interface QuickQuizButtonProps {
  defaults: SmartDefaults;
  onQuickQuiz: () => void;
  onCustomize: () => void;
  disabled?: boolean;
  analyzing?: boolean;
}

export const QuickQuizButton: React.FC<QuickQuizButtonProps> = ({
  defaults,
  onQuickQuiz,
  onCustomize,
  disabled = false,
  analyzing = false,
}) => {
  // Capitalize difficulty for display
  const displayDifficulty = useMemo(() => {
    return defaults.difficulty.charAt(0).toUpperCase() + defaults.difficulty.slice(1);
  }, [defaults.difficulty]);

  // Get question types summary
  const questionTypesSummary = useMemo(() => {
    const types = defaults.question_types;
    if (types.length === 1) {
      if (types[0] === 'multiple_choice') return 'Multiple Choice';
      if (types[0] === 'true_false') return 'True/False';
      if (types[0] === 'open_ended') return 'Open-Ended';
    }
    return 'Mixed Types';
  }, [defaults.question_types]);

  // Check if subject confidence is low
  const isLowConfidence = defaults.subject.confidence < 0.7;

  return (
    <View style={styles.container}>
      {/* Smart Defaults Preview */}
      <View style={styles.preview}>
        <View style={styles.previewHeader}>
          <FontAwesome5 name="magic" size={16} color={colors.gold} />
          <Text style={styles.previewTitle}>Smart Defaults Applied</Text>
        </View>

        <View style={styles.previewGrid}>
          <View style={styles.previewItem}>
            <FontAwesome5 name="graduation-cap" size={14} color={colors.textDim} />
            <Text style={styles.previewLabel}>Subject</Text>
            <Text style={styles.previewValue}>{defaults.subject.name}</Text>
            {isLowConfidence && (
              <FontAwesome5 name="exclamation-circle" size={12} color={colors.warning} />
            )}
          </View>

          <View style={styles.previewItem}>
            <FontAwesome5 name="chart-line" size={14} color={colors.textDim} />
            <Text style={styles.previewLabel}>Difficulty</Text>
            <Text style={styles.previewValue}>{displayDifficulty}</Text>
          </View>

          <View style={styles.previewItem}>
            <FontAwesome5 name="list-ol" size={14} color={colors.textDim} />
            <Text style={styles.previewLabel}>Questions</Text>
            <Text style={styles.previewValue}>{defaults.num_questions}</Text>
          </View>

          <View style={styles.previewItem}>
            <FontAwesome5 name="clock" size={14} color={colors.textDim} />
            <Text style={styles.previewLabel}>Time</Text>
            <Text style={styles.previewValue}>~{defaults.estimated_time_minutes}m</Text>
          </View>
        </View>

        {/* Question types row */}
        <View style={styles.typesBadge}>
          <FontAwesome5 name="check-circle" size={12} color={colors.gold} />
          <Text style={styles.typesText}>{questionTypesSummary}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.quickButton, disabled && styles.disabled]}
          onPress={onQuickQuiz}
          disabled={disabled || analyzing}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="bolt" size={18} color={colors.bg} style={styles.buttonIcon} />
          <Text style={styles.quickButtonText}>
            {analyzing ? 'Generating...' : 'Quick Quiz'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.customizeButton, disabled && styles.disabled]}
          onPress={onCustomize}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="sliders-h" size={16} color={colors.gold} style={styles.buttonIcon} />
          <Text style={styles.customizeButtonText}>Customize</Text>
        </TouchableOpacity>
      </View>

      {/* Low Confidence Warning */}
      {isLowConfidence && (
        <View style={styles.warningContainer}>
          <FontAwesome5 name="info-circle" size={14} color={colors.warning} />
          <Text style={styles.warningText}>
            Not sure about the subject? Tap "Customize" to manually select
          </Text>
        </View>
      )}

      {/* Confidence indicator (only show if high) */}
      {!isLowConfidence && (
        <View style={styles.confidenceContainer}>
          <FontAwesome5 name="shield-alt" size={12} color={colors.success} />
          <Text style={styles.confidenceText}>
            {Math.round(defaults.subject.confidence * 100)}% confidence
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing[20],
    marginVertical: spacing[16],
    borderWidth: 1,
    borderColor: colors.cardStroke,
    ...shadow.card,
  },
  preview: {
    marginBottom: spacing[16],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[12],
    gap: spacing[8],
  },
  previewTitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[12],
    marginBottom: spacing[12],
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius.sm,
    gap: spacing[4],
    minWidth: '47%',
  },
  previewLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  previewValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: spacing[4],
  },
  typesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    gap: spacing[8],
  },
  typesText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  quickButton: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    ...shadow.glow,
    // Minimum touch target
    minHeight: 52,
  },
  quickButtonText: {
    color: colors.bg,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  customizeButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    // Minimum touch target
    minHeight: 52,
  },
  customizeButtonText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginRight: spacing[4],
  },
  disabled: {
    opacity: 0.5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    marginTop: spacing[12],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    backgroundColor: 'rgba(253, 230, 138, 0.1)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.3)',
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    marginTop: spacing[8],
    alignSelf: 'flex-start',
  },
  confidenceText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default QuickQuizButton;
