import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

type TrendType = 'rapidly_improving' | 'improving' | 'stable' | 'declining' | 'rapidly_declining';

interface LearningVelocity {
  velocity: number;
  trend: TrendType;
  analysis: string;
  dataPoints: number;
  timeWindow: number;
}

interface LearningVelocityCardProps {
  learningVelocity: LearningVelocity | null;
  styles: any;
  currentTheme: any;
}

/**
 * LearningVelocityCard - Learning speed and trend analysis
 *
 * Features:
 * - Velocity percentage (per day improvement)
 * - Trend visualization with icons and colors
 * - AI-generated analysis text
 * - Data points and time window info
 * - Color-coded trend indicators
 */
const LearningVelocityCard: React.FC<LearningVelocityCardProps> = ({
  learningVelocity,
  styles,
  currentTheme
}) => {
  if (!learningVelocity) return null;

  const getTrendIcon = (trend: TrendType): string => {
    switch(trend) {
      case 'rapidly_improving': return '🚀';
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      case 'rapidly_declining': return '⚠️';
      default: return '❓';
    }
  };

  const getTrendColor = (trend: TrendType): string => {
    switch(trend) {
      case 'rapidly_improving': return '#28a745';
      case 'improving': return '#28a745';
      case 'stable': return '#ffc107';
      case 'declining': return '#dc3545';
      case 'rapidly_declining': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <Animatable.View animation="fadeInUp" delay={900} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>⚡ Learning Velocity</Text>

      <View style={styles.velocityStats}>
        <View style={styles.velocityStat}>
          <Text style={[styles.velocityValue, { color: getTrendColor(learningVelocity.trend) }]}>
            {learningVelocity.velocity > 0 ? '+' : ''}{learningVelocity.velocity}%
          </Text>
          <Text style={[styles.velocityLabel, currentTheme.categoryCount]}>Per Day</Text>
        </View>

        <View style={styles.velocityStat}>
          <Text style={[styles.velocityTrend, { color: getTrendColor(learningVelocity.trend) }]}>
            {getTrendIcon(learningVelocity.trend)} {learningVelocity.trend.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={[styles.velocityAnalysis, currentTheme.categoryName]}>
        {learningVelocity.analysis}
      </Text>

      <Text style={[styles.velocityDetails, currentTheme.categoryCount]}>
        Based on {learningVelocity.dataPoints} data points over {learningVelocity.timeWindow} days
      </Text>
    </Animatable.View>
  );
};

export default LearningVelocityCard;
