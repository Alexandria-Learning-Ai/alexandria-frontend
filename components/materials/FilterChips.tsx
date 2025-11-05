/**
 * FilterChips - Status filter chips (All, In Progress, Completed)
 *
 * Features:
 * - Multiple chip selection
 * - Active state styling
 * - Alexandria theme colors
 * - Touch feedback
 * - Horizontal scrollable layout
 *
 * @param options - Array of filter options
 * @param selected - Currently selected filter
 * @param onChange - Callback when filter is changed
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialFilterStatus } from '../../types/materials';

interface FilterChipsProps {
  options: Array<{ id: MaterialFilterStatus; label: string }>;
  selected: MaterialFilterStatus;
  onChange: (filter: MaterialFilterStatus) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ options, selected, onChange }) => {
  const themeColors = useMemo(
    () => ({
      activeBackground: Colors.accent,
      activeText: Colors.white,
      inactiveBackground: Colors.gray200,
      inactiveText: Colors.textSecondary,
    }),
    []
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isActive = option.id === selected;

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.chip,
              {
                backgroundColor: isActive
                  ? themeColors.activeBackground
                  : themeColors.inactiveBackground,
              },
            ]}
            onPress={() => onChange(option.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isActive
                    ? themeColors.activeText
                    : themeColors.inactiveText,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
  },
});

export default FilterChips;
