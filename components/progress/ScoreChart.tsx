import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { getThemeProperty } from '../../utils/progressHelpers';

const { width: screenWidth } = Dimensions.get('window');

interface ScoreHistory {
  x: number;
  y: number;
}

interface ChartConfig {
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  color?: (opacity: number) => string;
  labelColor?: (opacity: number) => string;
  decimalPlaces?: number;
  propsForDots?: {
    r?: string;
    strokeWidth?: string;
    stroke?: string;
  };
}

interface ScoreChartProps {
  scoreHistory: ScoreHistory[];
  chartConfig: ChartConfig;
  styles: any;
  currentTheme: any;
}

/**
 * ScoreChart - Displays score progression over time
 *
 * Features:
 * - Line chart showing recent quiz scores
 * - Empty state with encouragement
 * - Animated entrance
 */
const ScoreChart: React.FC<ScoreChartProps> = ({
  scoreHistory,
  chartConfig,
  styles,
  currentTheme
}) => {
  if (scoreHistory.length === 0) {
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
  const scoreData = scoreHistory || [];

  const data = {
    labels: scoreData.map(item => `Q${item?.x || 0}`),
    datasets: [{
      data: scoreData.map(item => item?.y || 0),
      strokeWidth: 3,
    }]
  };

  return (
    <Animatable.View animation="fadeInUp" delay={700} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Score Progression</Text>
      <LineChart
        data={data}
        width={screenWidth - 60}
        height={200}
        chartConfig={{
          ...chartConfig,
          // Defensive defaults to prevent undefined access
          color: chartConfig?.color || ((opacity = 1) => `rgba(26, 44, 91, ${opacity})`),
          labelColor: chartConfig?.labelColor || ((opacity = 1) => `rgba(0, 0, 0, ${opacity})`),
          // Ensure all required properties exist
          backgroundGradientFrom: chartConfig?.backgroundGradientFrom || '#FFFFFF',
          backgroundGradientTo: chartConfig?.backgroundGradientTo || '#FFFFFF',
          decimalPlaces: 0,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: chartConfig?.color?.(1) || '#1A2C5B'
          }
        }}
        bezier
        style={styles.chart}
      />
      <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
        Last {scoreHistory.length} quizzes
      </Text>
    </Animatable.View>
  );
};

// Memoized export - only re-renders when score history changes
export default React.memo(ScoreChart);
