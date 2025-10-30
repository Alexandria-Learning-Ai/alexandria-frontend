import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { BarChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

interface WeeklyProgress {
  day: string;
  quizzes: number;
}

interface ChartConfig {
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  color?: (opacity: number) => string;
  labelColor?: (opacity: number) => string;
  decimalPlaces?: number;
}

interface WeeklyActivityProps {
  weeklyProgress: WeeklyProgress[];
  chartConfig: ChartConfig;
  styles: any;
  currentTheme: any;
}

/**
 * WeeklyActivity - Displays weekly quiz activity
 *
 * Features:
 * - Bar chart showing quizzes per day
 * - Shows values on top of bars
 * - Animated entrance
 */
const WeeklyActivity: React.FC<WeeklyActivityProps> = ({
  weeklyProgress,
  chartConfig,
  styles,
  currentTheme
}) => {
  // Safe guard against undefined weeklyProgress
  const weeklyData = Array.isArray(weeklyProgress) ? weeklyProgress : [];

  const data = {
    labels: weeklyData.map(day => day?.day || 'Day'),
    datasets: [{
      data: weeklyData.map(day => day?.quizzes || 0),
    }]
  };

  return (
    <Animatable.View animation="fadeInUp" delay={1000} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Weekly Activity</Text>
      <BarChart
        data={data}
        width={screenWidth - 60}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          ...chartConfig,
          // Defensive defaults to prevent undefined access
          color: chartConfig?.color || ((opacity = 1) => `rgba(26, 44, 91, ${opacity})`),
          labelColor: chartConfig?.labelColor || ((opacity = 1) => `rgba(0, 0, 0, ${opacity})`),
          // Ensure all required properties exist
          backgroundGradientFrom: chartConfig?.backgroundGradientFrom || '#FFFFFF',
          backgroundGradientTo: chartConfig?.backgroundGradientTo || '#FFFFFF',
          decimalPlaces: 0,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
      />
      <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
        Quizzes taken per day
      </Text>
    </Animatable.View>
  );
};

export default WeeklyActivity;
