import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface SessionStats {
  correct: number;
  studied: number;
}

interface ThemeColors {
  cardBackground: string;
  accent: string;
}

interface FlashcardProgressBarProps {
  progressAnimation: Animated.Value;
  sessionStats: SessionStats;
  themeColors: ThemeColors;
}

const FlashcardProgressBar: React.FC<FlashcardProgressBarProps> = ({
  progressAnimation,
  sessionStats,
  themeColors,
}) => {
  const getAccuracyColor = () => {
    if (sessionStats.studied === 0) return '#666';
    const accuracy = sessionStats.correct / sessionStats.studied;
    if (accuracy >= 0.8) return '#10b981';
    if (accuracy >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getAccuracyPercentage = () => {
    if (sessionStats.studied === 0) return 0;
    return Math.round((sessionStats.correct / sessionStats.studied) * 100);
  };

  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { backgroundColor: `${themeColors.cardBackground}40` }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: themeColors.accent,
              width: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {sessionStats.studied > 0 && (
        <View style={styles.accuracyIndicator}>
          <Text style={[styles.accuracyText, { color: getAccuracyColor() }]}>
            {getAccuracyPercentage()}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  accuracyIndicator: {
    minWidth: 48,
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

// Memoized export - only re-renders when progress changes
export default React.memo(FlashcardProgressBar);
