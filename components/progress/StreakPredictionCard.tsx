import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface StreakPrediction {
  likelihood: number;
  streakForecast: {
    nextWeek: number;
  };
  recommendation: string;
  factors?: {
    consistency: number;
    averageGap: number;
    performanceTrend: number;
  };
}

interface StreakPredictionCardProps {
  streakPrediction: StreakPrediction | null;
  styles: any;
  currentTheme: any;
}

/**
 * StreakPredictionCard - AI-powered streak prediction
 *
 * Features:
 * - Streak continuation likelihood percentage
 * - 7-day streak forecast
 * - Personalized recommendations
 * - Key factors analysis (consistency, gaps, trends)
 * - Color-coded likelihood indicator
 */
const StreakPredictionCard: React.FC<StreakPredictionCardProps> = ({
  streakPrediction,
  styles,
  currentTheme
}) => {
  if (!streakPrediction) return null;

  const getLikelihoodColor = (likelihood: number) => {
    if (likelihood > 70) return '#28a745';
    if (likelihood > 40) return '#ffc107';
    return '#dc3545';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '→';
  };

  return (
    <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🔥 Streak Prediction</Text>

      <View style={styles.predictionContainer}>
        <View style={styles.predictionStat}>
          <Text style={[styles.predictionValue, { color: getLikelihoodColor(streakPrediction.likelihood) }]}>
            {streakPrediction.likelihood}%
          </Text>
          <Text style={[styles.predictionLabel, currentTheme.categoryCount]}>Continuation Likelihood</Text>
        </View>

        <View style={styles.predictionStat}>
          <Text style={[styles.predictionValue, currentTheme.statNumber]}>
            {streakPrediction.streakForecast.nextWeek}
          </Text>
          <Text style={[styles.predictionLabel, currentTheme.categoryCount]}>Predicted 7-day streak</Text>
        </View>
      </View>

      <Text style={[styles.recommendationText, currentTheme.categoryName]}>
        💡 {streakPrediction.recommendation}
      </Text>

      <View style={styles.factorsContainer}>
        <Text style={[styles.factorsTitle, currentTheme.categoryName]}>Key Factors:</Text>
        <Text style={[styles.factorText, currentTheme.categoryCount]}>
          • Consistency: {streakPrediction.factors?.consistency || 0}%
        </Text>
        <Text style={[styles.factorText, currentTheme.categoryCount]}>
          • Avg gap: {streakPrediction.factors?.averageGap || 0} days
        </Text>
        <Text style={[styles.factorText, currentTheme.categoryCount]}>
          • Performance trend: {getTrendIcon(streakPrediction.factors?.performanceTrend || 0)} {Math.abs(streakPrediction.factors?.performanceTrend || 0)}%
        </Text>
      </View>
    </Animatable.View>
  );
};

export default StreakPredictionCard;
