import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const StatsCards = ({
  analytics,
  currentTheme,
  getThemeProperty,
  isDarkMode
}) => {
  const statsData = [
    {
      title: 'Total Quizzes',
      value: analytics.totalQuizzes || 0,
      icon: 'clipboard-list',
      color: '#3B82F6',
      delay: 400
    },
    {
      title: 'Average Score',
      value: `${analytics.averageScore || 0}%`,
      icon: 'chart-line',
      color: '#10B981',
      delay: 500
    },
    {
      title: 'Best Score',
      value: `${analytics.bestScore || 0}%`,
      icon: 'trophy',
      color: '#F59E0B',
      delay: 600
    },
    {
      title: 'Current Streak',
      value: analytics.currentStreak || 0,
      icon: 'fire',
      color: '#EF4444',
      delay: 700
    }
  ];

  return (
    <View style={styles.statsContainer}>
      {statsData.map((stat, index) => (
        <Animatable.View
          key={stat.title}
          animation="fadeInUp"
          delay={stat.delay}
          style={[styles.statCard, currentTheme.statCard]}
        >
          <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
            <FontAwesome5
              name={stat.icon}
              size={20}
              color={stat.color}
            />
          </View>
          <Text style={[styles.statValue, currentTheme.statValue]}>
            {stat.value}
          </Text>
          <Text style={[styles.statTitle, currentTheme.statTitle]}>
            {stat.title}
          </Text>
        </Animatable.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2C5B',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default StatsCards;