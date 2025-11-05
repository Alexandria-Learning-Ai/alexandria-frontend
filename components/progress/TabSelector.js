import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const TabSelector = ({
  activeTab,
  onTabChange,
  currentTheme,
  getThemeProperty
}) => {
  const tabs = [
    { id: 'overall', icon: 'chart-line', label: 'Overview' },
    { id: 'subjects', icon: 'book-open', label: 'Subjects' },
    { id: 'courses', icon: 'graduation-cap', label: 'Courses' },
    { id: 'advanced', icon: 'brain', label: 'Advanced' }
  ];

  return (
    <View style={[styles.tabSelector, currentTheme.tabSelector]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            currentTheme.tab,
            activeTab === tab.id && currentTheme.activeTab
          ]}
          onPress={() => onTabChange(tab.id)}
        >
          <FontAwesome5
            name={tab.icon}
            size={14}
            color={
              activeTab === tab.id
                ? getThemeProperty(currentTheme, 'activeTabText', '#FFFFFF')
                : getThemeProperty(currentTheme, 'tabText', '#4A5568')
            }
          />
          <Text
            style={[
              styles.tabText,
              currentTheme.tabText,
              activeTab === tab.id && currentTheme.activeTabText
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4, // Reduced from 8 to 4
    borderRadius: 10,
    minHeight: 60,
    maxWidth: '25%', // Ensure equal distribution
  },
  tabText: {
    fontSize: 10, // Reduced from 11 to 10
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 4,
    textAlign: 'center',
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.8,
  },
});

export default TabSelector;