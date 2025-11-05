import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { getThemeProperty } from './progressUtils';

const { width: screenWidth } = Dimensions.get('window');

const ScoreChart = ({
  analytics,
  currentTheme,
  chartConfig
}) => {
  if (!analytics || analytics.scoreHistory.length === 0) {
    return (
      <View style={[styles.chartContainer, currentTheme.chartContainer]}>
        <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Score Progression</Text>
        <View style={styles.noDataContainer}>
          <FontAwesome5
            name="chart-line"
            size={48}
            color={getThemeProperty(currentTheme, 'noDataIcon', '#7F8C8D')}
          />
          <Text style={[styles.noDataText, currentTheme.noDataText]}>
            Take more quizzes to see your progress!
          </Text>
        </View>
      </View>
    );
  }

  // Safe guard against undefined scoreHistory
  const scoreData = analytics?.scoreHistory || [];

  const data = {
    labels: scoreData.map(item => `Q${item?.x || 0}`),
    datasets: [{
      data: scoreData.map(item => item?.y || 0),
      strokeWidth: 3,
    }]
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={700}
      style={[styles.chartContainer, currentTheme.chartContainer]}
    >
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Score Progression</Text>
      <LineChart
        data={data}
        width={screenWidth - 60}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
        Last {analytics.scoreHistory.length} quizzes
      </Text>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2C5B',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default ScoreChart;