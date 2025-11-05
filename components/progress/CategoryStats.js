import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { getAccuracyColor } from './progressUtils';

const CategoryStats = ({
  analytics,
  currentTheme
}) => {
  if (!analytics || analytics.categoryStats.length === 0) return null;

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={800}
      style={[styles.chartContainer, currentTheme.chartContainer]}
    >
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Category Performance</Text>

      {analytics.categoryStats.map((category, index) => (
        <View key={category.category} style={styles.categoryItem}>
          <View style={styles.categoryHeader}>
            <Text style={[styles.categoryName, currentTheme.categoryName]}>
              {category.category}
            </Text>
            <Text style={[styles.categoryAccuracy, { color: getAccuracyColor(category.accuracy) }]}>
              {category.accuracy}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${category.accuracy}%`,
                  backgroundColor: getAccuracyColor(category.accuracy)
                }
              ]}
            />
          </View>
          <Text style={[styles.categoryCount, currentTheme.categoryCount]}>
            {category.count} quiz{category.count !== 1 ? 'es' : ''} • {category.total} questions
          </Text>
        </View>
      ))}
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
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  categoryAccuracy: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#7F8C8D',
  },
});

export default CategoryStats;