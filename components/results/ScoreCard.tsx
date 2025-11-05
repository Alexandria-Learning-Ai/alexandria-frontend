import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Performance, QuizMetadata, ThemeStyles } from '../../types';

// Helper function to get motivational message based on score percentage
const getMotivationalMessage = (percentage: number): string => {
  if (percentage < 40) {
    return "Don't worry, practice makes perfect 💪";
  } else if (percentage >= 40 && percentage < 70) {
    return "Good progress! Keep at it 🚀";
  } else {
    return "Great work! You're mastering this topic 🎉";
  }
};

// Helper function to get gradient colors for progress bar
const getProgressGradientColors = (percentage: number) => {
  if (percentage >= 80) {
    return ['#22c55e', '#16a34a', '#15803d'] as const; // Excellent: Rich green
  } else if (percentage >= 60) {
    return ['#84cc16', '#eab308', '#f59e0b'] as const; // Good: Green to yellow
  } else if (percentage >= 40) {
    return ['#f59e0b', '#f97316', '#ea580c'] as const; // Fair: Yellow to orange
  } else {
    return ['#f97316', '#ef4444', '#dc2626'] as const; // Poor: Orange to red
  }
};

interface ScoreCardProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  animatedPercentageValue: string | number;
  performance: Performance;
  correctCount: number;
  incorrectCount: number;
  metadata?: QuizMetadata;
  currentThemeStyles: ThemeStyles;
  isDarkMode: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = React.memo(({
  score,
  totalQuestions,
  percentage,
  animatedPercentageValue,
  performance,
  correctCount,
  incorrectCount,
  metadata = {},
  currentThemeStyles,
  isDarkMode,
}) => {
  // ✨ Performance: Memoize expensive computations
  const gradientColors = useMemo(
    () => getProgressGradientColors(percentage),
    [percentage]
  );

  const motivationalMessage = useMemo(
    () => getMotivationalMessage(percentage),
    [percentage]
  );

  return (
    <Animatable.View
      animation="bounceIn"
      delay={600}
      style={[styles.scoreCard, currentThemeStyles.scoreCard]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Quiz results: ${percentage}% score. ${score} out of ${totalQuestions} correct. Performance level: ${performance.level}`}
    >
      {/* Performance Badge */}
      <View
        style={[styles.performanceBadge, { backgroundColor: '#D4AF37' }]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Performance: ${performance.level}`}
      >
        <Text style={styles.performanceText}>{performance.level}</Text>
      </View>

      {/* Main Score Display */}
      <View style={styles.scoreDisplay}>
        <Text
          style={[styles.scoreNumberLarge, currentThemeStyles.scoreNumber]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Score: ${percentage} percent`}
        >
          {animatedPercentageValue}%
        </Text>
        <Text
          style={[styles.scoreLabelLarge, currentThemeStyles.scoreLabel]}
          accessible={true}
          accessibilityRole="text"
        >
          {score} out of {totalQuestions} correct
        </Text>

        {/* Progress Bar */}
        <View
          style={styles.progressBarContainer}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percentage }}
          accessibilityLabel={`Progress: ${percentage}% complete`}
        >
          <View
            style={[
              styles.progressBarBackground,
              { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                { width: `${percentage}%` }
              ]}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressBarGradient}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Inline Stats */}
      <View
        style={styles.inlineStatsRow}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={`Statistics: ${correctCount} correct answers, ${incorrectCount} incorrect answers`}
      >
        <View style={styles.inlineStatItem}>
          <View style={styles.statIconContainer}>
            <Text style={[styles.statIcon, { color: '#014421' }]}>✓</Text>
          </View>
          <Text style={[styles.inlineStatText, { color: '#014421' }]}>
            {correctCount} Correct
          </Text>
        </View>

        <View style={styles.inlineStatItem}>
          <View style={styles.statIconContainer}>
            <Text style={[styles.statIcon, { color: '#800020' }]}>✗</Text>
          </View>
          <Text style={[styles.inlineStatText, { color: '#800020' }]}>
            {incorrectCount} Incorrect
          </Text>
        </View>
      </View>

      {/* Motivational Message */}
      <Text style={[styles.motivationalMessageLarge, { color: currentThemeStyles.subtitle?.color || '#666' }]}>
        {motivationalMessage}
      </Text>

      {/* Enhanced Analytics Summary */}
      {metadata.updatedStats && (
        <View style={styles.analyticsStatsRowCompact}>
          <Text style={[styles.analyticsCompactText, { color: currentThemeStyles.subtitle?.color }]}>
            Overall Accuracy: {Math.round((metadata.updatedStats.overall_accuracy || 0) * 100)}% •
            Total Quizzes: {metadata.updatedStats.total_quizzes || 0}
          </Text>
        </View>
      )}
    </Animatable.View>
  );
});

// ✨ Performance: Display name for debugging
ScoreCard.displayName = 'ScoreCard';

interface Styles {
  scoreCard: ViewStyle;
  performanceBadge: ViewStyle;
  performanceText: TextStyle;
  scoreDisplay: ViewStyle;
  scoreNumberLarge: TextStyle;
  scoreLabelLarge: TextStyle;
  progressBarContainer: ViewStyle;
  progressBarBackground: ViewStyle;
  progressBarFill: ViewStyle;
  progressBarGradient: ViewStyle;
  inlineStatsRow: ViewStyle;
  inlineStatItem: ViewStyle;
  statIconContainer: ViewStyle;
  statIcon: TextStyle;
  inlineStatText: TextStyle;
  motivationalMessageLarge: TextStyle;
  analyticsStatsRowCompact: ViewStyle;
  analyticsCompactText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  performanceBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  performanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreDisplay: {
    alignItems: 'center',
    width: '100%',
  },
  scoreNumberLarge: {
    fontSize: 72,
    fontWeight: '800',
    color: '#1A2C5B',
    marginBottom: 4,
  },
  scoreLabelLarge: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontWeight: '500',
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 12,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressBarGradient: {
    flex: 1,
  },
  inlineStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
  },
  inlineStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inlineStatText: {
    fontSize: 15,
    fontWeight: '600',
  },
  motivationalMessageLarge: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  analyticsStatsRowCompact: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  analyticsCompactText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ScoreCard;
