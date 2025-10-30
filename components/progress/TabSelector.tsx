import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getThemeProperty } from '../../utils/progressHelpers';

interface TabSelectorProps {
  activeTab: 'overall' | 'subjects' | 'courses' | 'advanced';
  setActiveTab: (tab: 'overall' | 'subjects' | 'courses' | 'advanced') => void;
  styles: any;
  currentTheme: any;
}

/**
 * TabSelector - Navigation tabs for different progress views
 *
 * Features:
 * - 4 tab options: Overview, Subjects, Courses, Advanced
 * - Active state highlighting with icons
 * - Theme-aware styling
 * - Icon + text layout
 */
const TabSelector: React.FC<TabSelectorProps> = ({
  activeTab,
  setActiveTab,
  styles,
  currentTheme
}) => {
  const tabs = [
    { key: 'overall' as const, icon: 'chart-line', label: 'Overview' },
    { key: 'subjects' as const, icon: 'book-open', label: 'Subjects' },
    { key: 'courses' as const, icon: 'graduation-cap', label: 'Courses' },
    { key: 'advanced' as const, icon: 'brain', label: 'Advanced' }
  ];

  return (
    <View style={[styles.tabSelector, currentTheme.tabSelector]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            currentTheme.tab,
            activeTab === tab.key && currentTheme.activeTab
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <FontAwesome5
            name={tab.icon}
            size={14}
            color={
              activeTab === tab.key
                ? getThemeProperty(currentTheme, 'activeTabText', '#FFFFFF')
                : getThemeProperty(currentTheme, 'tabText', '#4A5568')
            }
          />
          <Text
            style={[
              styles.tabText,
              currentTheme.tabText,
              activeTab === tab.key && currentTheme.activeTabText
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Memoized export - only re-renders when active tab changes
export default React.memo(TabSelector);
