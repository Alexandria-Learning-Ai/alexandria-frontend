import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

interface DistributionData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface ChartConfig {
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  color?: (opacity: number) => string;
  labelColor?: (opacity: number) => string;
  decimalPlaces?: number;
}

interface DistributionChartProps {
  difficultyBreakdown: DistributionData[];
  subjectBreakdown: DistributionData[];
  pieChartMode: 'difficulty' | 'subjects';
  setPieChartMode: (mode: 'difficulty' | 'subjects') => void;
  totalQuizzes: number;
  isDarkMode: boolean;
  chartConfig: ChartConfig;
  styles: any;
  currentTheme: any;
}

/**
 * DistributionChart - Displays quiz distribution with toggle
 *
 * Features:
 * - Pie chart visualization
 * - Toggle between difficulty and subject modes
 * - Quick insights below chart
 * - Animated entrance
 */
const DistributionChart: React.FC<DistributionChartProps> = ({
  difficultyBreakdown,
  subjectBreakdown,
  pieChartMode,
  setPieChartMode,
  totalQuizzes,
  isDarkMode,
  chartConfig,
  styles,
  currentTheme
}) => {
  const currentData = pieChartMode === 'difficulty' ? difficultyBreakdown : subjectBreakdown;

  if (currentData.length === 0) return null;

  return (
    <Animatable.View animation="fadeInUp" delay={900} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <View style={styles.chartHeaderWithToggle}>
        <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Distribution Analysis</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              pieChartMode === 'difficulty' && styles.activeToggleButton,
              { borderColor: isDarkMode ? '#D4AF37' : '#1A2C5B' }
            ]}
            onPress={() => setPieChartMode('difficulty')}
          >
            <FontAwesome5
              name="layer-group"
              size={12}
              color={pieChartMode === 'difficulty' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B')}
            />
            <Text style={[
              styles.toggleText,
              { color: pieChartMode === 'difficulty' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B') }
            ]}>
              Difficulty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              pieChartMode === 'subjects' && styles.activeToggleButton,
              { borderColor: isDarkMode ? '#D4AF37' : '#1A2C5B' }
            ]}
            onPress={() => setPieChartMode('subjects')}
          >
            <FontAwesome5
              name="book-open"
              size={12}
              color={pieChartMode === 'subjects' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B')}
            />
            <Text style={[
              styles.toggleText,
              { color: pieChartMode === 'subjects' ? '#FFFFFF' : (isDarkMode ? '#D4AF37' : '#1A2C5B') }
            ]}>
              Subjects
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <PieChart
        data={currentData}
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
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
      />

      <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
        {pieChartMode === 'difficulty'
          ? `Quiz difficulty distribution (${totalQuizzes} total)`
          : `Subject coverage across ${currentData.length} topics`
        }
      </Text>

      {/* Quick insights below chart */}
      <View style={styles.chartInsights}>
        {pieChartMode === 'difficulty' ? (
          <View style={styles.insightRow}>
            <FontAwesome5 name="info-circle" size={14} color={isDarkMode ? '#D4AF37' : '#1A2C5B'} />
            <Text style={[styles.insightText, currentTheme.categoryCount]}>
              Most practiced: {currentData.reduce((prev, curr) => prev.population > curr.population ? prev : curr)?.name || 'N/A'} difficulty
            </Text>
          </View>
        ) : (
          <View style={styles.insightRow}>
            <FontAwesome5 name="lightbulb" size={14} color={isDarkMode ? '#D4AF37' : '#1A2C5B'} />
            <Text style={[styles.insightText, currentTheme.categoryCount]}>
              Focus area: {currentData.reduce((prev, curr) => prev.population > curr.population ? prev : curr)?.name || 'N/A'} ({Math.round((currentData.reduce((prev, curr) => prev.population > curr.population ? prev : curr)?.population || 0) / totalQuizzes * 100)}% of quizzes)
            </Text>
          </View>
        )}
      </View>
    </Animatable.View>
  );
};

export default DistributionChart;
