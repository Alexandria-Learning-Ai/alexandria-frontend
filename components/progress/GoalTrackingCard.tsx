import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface UserGoals {
  streakGoals: {
    weekly: {
      current: number;
      target: number;
    };
  };
  scoreGoals: {
    averageScore: {
      current: number;
      target: number;
    };
    perfectScores: {
      current: number;
      target: number;
    };
  };
}

interface GoalTrackingCardProps {
  userGoals: UserGoals | null;
  isDarkMode: boolean;
  setShowGoalModal: (show: boolean) => void;
  styles: any;
  currentTheme: any;
}

/**
 * GoalTrackingCard - Personal goals tracking
 *
 * Features:
 * - Weekly streak goal with progress bar
 * - Average score goal with progress bar
 * - Perfect scores goal with progress bar
 * - Edit button to modify goals
 * - Color-coded progress bars
 * - Current/Target display for each goal
 */
const GoalTrackingCard: React.FC<GoalTrackingCardProps> = ({
  userGoals,
  isDarkMode,
  setShowGoalModal,
  styles,
  currentTheme
}) => {
  if (!userGoals) return null;

  const { streakGoals, scoreGoals } = userGoals;

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <View style={styles.goalHeader}>
        <Text style={[styles.chartTitle, currentTheme.chartTitle]}>🎯 Goals Progress</Text>
        <TouchableOpacity
          style={[styles.goalEditButton, { borderColor: isDarkMode ? '#D4AF37' : '#1A2C5B' }]}
          onPress={() => setShowGoalModal(true)}
        >
          <FontAwesome5 name="edit" size={12} color={isDarkMode ? '#D4AF37' : '#1A2C5B'} />
        </TouchableOpacity>
      </View>

      <View style={styles.goalsGrid}>
        <View style={styles.goalItem}>
          <Text style={[styles.goalLabel, currentTheme.categoryName]}>Weekly Streak</Text>
          <View style={styles.goalProgress}>
            <View style={[
              styles.goalProgressBar,
              {
                width: `${calculateProgress(streakGoals.weekly.current, streakGoals.weekly.target)}%`,
                backgroundColor: '#28a745'
              }
            ]} />
          </View>
          <Text style={[styles.goalText, currentTheme.categoryCount]}>
            {streakGoals.weekly.current}/{streakGoals.weekly.target} days
          </Text>
        </View>

        <View style={styles.goalItem}>
          <Text style={[styles.goalLabel, currentTheme.categoryName]}>Average Score</Text>
          <View style={styles.goalProgress}>
            <View style={[
              styles.goalProgressBar,
              {
                width: `${calculateProgress(scoreGoals.averageScore.current, scoreGoals.averageScore.target)}%`,
                backgroundColor: '#3498DB'
              }
            ]} />
          </View>
          <Text style={[styles.goalText, currentTheme.categoryCount]}>
            {scoreGoals.averageScore.current}/{scoreGoals.averageScore.target}%
          </Text>
        </View>

        <View style={styles.goalItem}>
          <Text style={[styles.goalLabel, currentTheme.categoryName]}>Perfect Scores</Text>
          <View style={styles.goalProgress}>
            <View style={[
              styles.goalProgressBar,
              {
                width: `${calculateProgress(scoreGoals.perfectScores.current, scoreGoals.perfectScores.target)}%`,
                backgroundColor: '#D4AF37'
              }
            ]} />
          </View>
          <Text style={[styles.goalText, currentTheme.categoryCount]}>
            {scoreGoals.perfectScores.current}/{scoreGoals.perfectScores.target} quizzes
          </Text>
        </View>
      </View>
    </Animatable.View>
  );
};

export default GoalTrackingCard;
