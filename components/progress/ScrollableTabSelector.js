import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const ScrollableTabSelector = ({
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

  // Check if we need horizontal scroll (for very small screens)
  const needsScroll = screenWidth < 350;

  if (needsScroll) {
    return (
      <View style={[styles.tabSelectorContainer, currentTheme.tabSelector]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollableTabSelector}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.scrollableTab,
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
                  styles.scrollableTabText,
                  currentTheme.tabText,
                  activeTab === tab.id && currentTheme.activeTabText
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Default fixed layout for normal screens
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
  tabSelectorContainer: {
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
  scrollableTabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    minHeight: 60,
    maxWidth: '25%',
  },
  scrollableTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 60,
    minWidth: 80,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollableTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ScrollableTabSelector;