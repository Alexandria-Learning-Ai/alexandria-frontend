import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface PeriodSelectorProps {
  selectedPeriod: 'week' | 'month' | 'all';
  setSelectedPeriod: (period: 'week' | 'month' | 'all') => void;
  styles: any;
  currentTheme: any;
}

/**
 * PeriodSelector - Time period filter for progress data
 *
 * Features:
 * - Toggle between Week/Month/All Time
 * - Active state highlighting
 * - Theme support
 */
const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  setSelectedPeriod,
  styles,
  currentTheme
}) => {
  return (
    <View style={[styles.periodSelector, currentTheme.periodSelector]}>
      {(['week', 'month', 'all'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            currentTheme.periodButton,
            selectedPeriod === period && currentTheme.activePeriodButton
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            currentTheme.periodButtonText,
            selectedPeriod === period && currentTheme.activePeriodButtonText
          ]}>
            {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Memoized export - only re-renders when period changes
export default React.memo(PeriodSelector);
