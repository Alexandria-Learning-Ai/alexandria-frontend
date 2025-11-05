/**
 * ArtifactTabs - Tab navigation for chapter artifacts
 *
 * Features:
 * - Tabs: Read, Summary, Flashcards, Quiz
 * - Active state highlighting
 * - Smooth transitions
 * - Loading indicator per tab
 * - Alexandria theme colors
 * - Accessible touch targets
 * - Icon support
 *
 * @param activeTab - Currently active tab
 * @param onTabChange - Callback when tab changes
 * @param loadingStates - Loading state for each tab
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface ArtifactTabsProps {
  activeTab: 'read' | 'summary' | 'flashcards' | 'quiz';
  onTabChange: (tab: 'read' | 'summary' | 'flashcards' | 'quiz') => void;
  loadingStates: {
    summary: boolean;
    flashcards: boolean;
    quiz: boolean;
  };
}

interface TabDefinition {
  id: 'read' | 'summary' | 'flashcards' | 'quiz';
  label: string;
  icon: string;
}

const ArtifactTabs: React.FC<ArtifactTabsProps> = ({
  activeTab,
  onTabChange,
  loadingStates,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accentLight,
      accentDark: Colors.accentDark,
      border: Colors.border,
      primary: Colors.primary,
    }),
    []
  );

  const tabs: TabDefinition[] = [
    { id: 'read', label: 'Read', icon: 'book-open' },
    { id: 'summary', label: 'Summary', icon: 'list-ul' },
    { id: 'flashcards', label: 'Flashcards', icon: 'layer-group' },
    { id: 'quiz', label: 'Quiz', icon: 'question-circle' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isLoading = tab.id !== 'read' && loadingStates[tab.id as keyof typeof loadingStates];

        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && [styles.activeTab, { borderBottomColor: themeColors.accent }],
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <FontAwesome5
                name={tab.icon}
                size={16}
                color={isActive ? themeColors.accent : themeColors.textSecondary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.label,
                  { color: isActive ? themeColors.accent : themeColors.textSecondary },
                  isActive && styles.activeLabel,
                ]}
              >
                {tab.label}
              </Text>
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={themeColors.accent}
                  style={styles.loadingIndicator}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeLabel: {
    fontWeight: '700',
  },
  loadingIndicator: {
    marginLeft: 4,
  },
});

export default ArtifactTabs;
