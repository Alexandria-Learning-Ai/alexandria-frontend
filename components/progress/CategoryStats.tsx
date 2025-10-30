import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { getAccuracyColor } from '../../utils/progressHelpers';

interface CategoryStat {
  category: string;
  accuracy: number;
  count: number;
  total: number;
}

interface CategoryStatsProps {
  categoryStats: CategoryStat[];
  styles: any;
  currentTheme: any;
}

/**
 * CategoryStats - Displays performance by category
 *
 * Features:
 * - Progress bars showing accuracy per category
 * - Color-coded accuracy levels
 * - Quiz and question counts
 */
const CategoryStats: React.FC<CategoryStatsProps> = ({
  categoryStats,
  styles,
  currentTheme
}) => {
  if (categoryStats.length === 0) return null;

  return (
    <Animatable.View animation="fadeInUp" delay={800} style={[styles.chartContainer, currentTheme.chartContainer]}>
      <Text style={[styles.chartTitle, currentTheme.chartTitle]}>Category Performance</Text>

      {categoryStats.map((category) => (
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

// Memoized export - only re-renders when category stats change
export default React.memo(CategoryStats);
