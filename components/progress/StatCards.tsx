import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface Analytics {
  totalQuizzes: number;
  averageScore: number;
  currentStreak: number;
}

interface StatCardsProps {
  analytics: Analytics;
  styles: any;
  currentTheme: any;
}

/**
 * StatCards - Displays key statistics in animated cards
 *
 * Shows:
 * - Total quizzes taken
 * - Average score percentage
 * - Current streak
 */
const StatCards: React.FC<StatCardsProps> = ({ analytics, styles, currentTheme }) => {
  return (
    <View style={styles.statsContainer}>
      <Animatable.View animation="slideInLeft" delay={400} style={[styles.statCard, currentTheme.statCard]}>
        <FontAwesome5 name="book" size={24} color="#007bff" />
        <Text style={[styles.statNumber, currentTheme.statNumber]}>{analytics.totalQuizzes}</Text>
        <Text style={[styles.statLabel, currentTheme.statLabel]}>Quizzes Taken</Text>
      </Animatable.View>

      <Animatable.View animation="slideInUp" delay={500} style={[styles.statCard, currentTheme.statCard]}>
        <FontAwesome5 name="percentage" size={24} color="#28a745" />
        <Text style={[styles.statNumber, currentTheme.statNumber]}>{analytics.averageScore}%</Text>
        <Text style={[styles.statLabel, currentTheme.statLabel]}>Average Score</Text>
      </Animatable.View>

      <Animatable.View animation="slideInRight" delay={600} style={[styles.statCard, currentTheme.statCard]}>
        <FontAwesome5 name="fire" size={24} color="#dc3545" />
        <Text style={[styles.statNumber, currentTheme.statNumber]}>{analytics.currentStreak}</Text>
        <Text style={[styles.statLabel, currentTheme.statLabel]}>Current Streak</Text>
      </Animatable.View>
    </View>
  );
};

// Memoized export - only re-renders when analytics data changes
export default React.memo(StatCards);
