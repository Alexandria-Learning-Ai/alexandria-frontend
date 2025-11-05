/**
 * TabBar - Material type tab navigation
 *
 * Features:
 * - Tab switching for Books, Study Guides, Papers
 * - Active state highlighting
 * - Alexandria theme styling
 * - Smooth transitions
 * - Touch feedback
 *
 * @param tabs - Array of tab labels
 * @param selectedTab - Currently selected tab
 * @param onTabChange - Callback when tab is selected
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialKind } from '../../types/materials';

interface TabBarProps {
  tabs: Array<{ id: MaterialKind; label: string }>;
  selectedTab: MaterialKind;
  onTabChange: (tab: MaterialKind) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, selectedTab, onTabChange }) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      activeBackground: Colors.primary,
      activeText: Colors.textLight,
      inactiveText: Colors.text,
      border: Colors.border,
    }),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {tabs.map((tab) => {
        const isActive = tab.id === selectedTab;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && { backgroundColor: themeColors.activeBackground },
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive
                    ? themeColors.activeText
                    : themeColors.inactiveText,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
  },
});

export default TabBar;
