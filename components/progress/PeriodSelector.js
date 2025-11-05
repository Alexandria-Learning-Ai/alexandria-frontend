import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const PeriodSelector = ({
  selectedPeriod,
  onPeriodChange,
  currentTheme,
  getThemeProperty
}) => {
  return (
    <View style={[styles.periodSelector, currentTheme.periodSelector]}>
      {['week', 'month', 'all'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            currentTheme.periodButton,
            selectedPeriod === period && currentTheme.activePeriodButton
          ]}
          onPress={() => onPeriodChange(period)}
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

const styles = StyleSheet.create({
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
});

export default PeriodSelector;