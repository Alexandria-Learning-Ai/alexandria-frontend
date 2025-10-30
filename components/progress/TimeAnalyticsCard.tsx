import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface TimeAnalytics {
  averageSessionDuration: number;
  sessionsThisWeek: number;
  optimalStudyTime: string;
  totalStudyTime: number;
  recommendations: string[];
}

interface TimeAnalyticsCardProps {
  timeAnalytics: TimeAnalytics | null;
  styles: any;
  currentTheme: any;
}

/**
 * TimeAnalyticsCard - Study time analysis and optimization
 *
 * Features:
 * - Average session duration
 * - Sessions this week counter
 * - Peak performance time detection
 * - Total study hours
 * - Time optimization recommendations
 */
const TimeAnalyticsCard: React.FC<TimeAnalyticsCardProps> = ({
  timeAnalytics,
  styles,
  currentTheme
}) => {
  if (!timeAnalytics) return null;

  return (
    <Animatable.View animation="fadeInUp" delay={1100} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>⏰ Study Time Analytics</Text>

      <View style={styles.timeStatsGrid}>
        <View style={styles.timeStat}>
          <Text style={[styles.timeValue, currentTheme.statNumber]}>
            {Math.round(timeAnalytics.averageSessionDuration)}
          </Text>
          <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Avg Session (min)</Text>
        </View>

        <View style={styles.timeStat}>
          <Text style={[styles.timeValue, currentTheme.statNumber]}>
            {timeAnalytics.sessionsThisWeek}
          </Text>
          <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Sessions This Week</Text>
        </View>

        <View style={styles.timeStat}>
          <Text style={[styles.timeValue, { color: '#28a745' }]}>
            {timeAnalytics.optimalStudyTime}
          </Text>
          <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Peak Performance</Text>
        </View>

        <View style={styles.timeStat}>
          <Text style={[styles.timeValue, currentTheme.statNumber]}>
            {Math.round(timeAnalytics.totalStudyTime / 60) || 0}
          </Text>
          <Text style={[styles.timeLabel, currentTheme.categoryCount]}>Total Hours</Text>
        </View>
      </View>

      <View style={styles.timeRecommendations}>
        <Text style={[styles.recommendationsTitle, currentTheme.categoryName]}>💡 Time Optimization:</Text>
        {timeAnalytics.recommendations.map((rec, index) => (
          <Text key={index} style={[styles.recommendationItem, currentTheme.categoryCount]}>
            • {rec}
          </Text>
        ))}
      </View>
    </Animatable.View>
  );
};

export default TimeAnalyticsCard;
