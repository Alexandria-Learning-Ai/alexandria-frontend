import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

// Helper function to get motivational message based on score percentage
const getMotivationalMessage = (percentage) => {
  if (percentage < 40) {
    return "Don't worry, practice makes perfect 💪";
  } else if (percentage >= 40 && percentage < 70) {
    return "Good progress! Keep at it 🚀";
  } else {
    return "Great work! You're mastering this topic 🎉";
  }
};

// Helper function to get gradient colors for progress bar
const getProgressGradientColors = (percentage) => {
  if (percentage >= 80) {
    return ['#22c55e', '#16a34a', '#15803d']; // Excellent: Rich green
  } else if (percentage >= 60) {
    return ['#84cc16', '#eab308', '#f59e0b']; // Good: Green to yellow
  } else if (percentage >= 40) {
    return ['#f59e0b', '#f97316', '#ea580c']; // Fair: Yellow to orange
  } else {
    return ['#f97316', '#ef4444', '#dc2626']; // Poor: Orange to red
  }
};

const ScoreCard = ({
  score,
  totalQuestions,
  percentage,
  animatedPercentageValue,
  performance,
  correctCount,
  incorrectCount,
  metadata,
  currentThemeStyles,
  isDarkMode,
}) => {
  return (
    <Animatable.View
      animation="bounceIn"
      delay={600}
      style={[styles.scoreCard, currentThemeStyles.scoreCard]}
    >
      {/* Performance Badge */}
      <View style={[styles.performanceBadge, { backgroundColor: '#D4AF37' }]}>
        <Text style={styles.performanceText}>{performance.level}</Text>
      </View>

      {/* Main Score Display */}
      <View style={styles.scoreDisplay}>
        <Text style={[styles.scoreNumberLarge, currentThemeStyles.scoreNumber]}>
          {animatedPercentageValue}%
        </Text>
        <Text style={[styles.scoreLabelLarge, currentThemeStyles.scoreLabel]}>
          {score} out of {totalQuestions} correct
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
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
                colors={getProgressGradientColors(percentage)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressBarGradient}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Inline Stats */}
      <View style={styles.inlineStatsRow}>
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
        {getMotivationalMessage(percentage)}
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
};

ScoreCard.propTypes = {
  score: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  percentage: PropTypes.number.isRequired,
  animatedPercentageValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  performance: PropTypes.shape({
    level: PropTypes.string.isRequired,
    emoji: PropTypes.string,
    color: PropTypes.string,
  }).isRequired,
  correctCount: PropTypes.number.isRequired,
  incorrectCount: PropTypes.number.isRequired,
  metadata: PropTypes.shape({
    updatedStats: PropTypes.shape({
      overall_accuracy: PropTypes.number,
      total_quizzes: PropTypes.number,
    }),
  }),
  currentThemeStyles: PropTypes.object.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

ScoreCard.defaultProps = {
  metadata: {},
};

const styles = StyleSheet.create({
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
