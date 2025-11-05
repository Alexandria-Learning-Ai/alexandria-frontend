import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width: screenWidth } = Dimensions.get('window');

const DistributionChart = ({
  analytics,
  pieChartMode,
  setPieChartMode,
  currentTheme,
  chartConfig,
  isDarkMode
}) => {
  const currentData = pieChartMode === 'difficulty' ? analytics.difficultyBreakdown : analytics.subjectBreakdown;

  if (!analytics || currentData.length === 0) return null;

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={900}
      style={[styles.chartContainer, currentTheme.chartContainer]}
    >
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
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
      />

      <Text style={[styles.chartSubtitle, currentTheme.chartSubtitle]}>
        {pieChartMode === 'difficulty'
          ? `Quiz difficulty distribution (${analytics.totalQuizzes} total)`
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
            <FontAwesome5 name="graduation-cap" size={14} color={isDarkMode ? '#D4AF37' : '#1A2C5B'} />
            <Text style={[styles.insightText, currentTheme.categoryCount]}>
              Top subject: {currentData[0]?.name || 'N/A'} ({currentData[0]?.population || 0} quizzes)
            </Text>
          </View>
        )}
      </View>
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
    textAlign: 'center',
  },
  chartHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 1,
  },
  activeToggleButton: {
    backgroundColor: '#1A2C5B',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 10,
  },
  chartInsights: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

export default DistributionChart;