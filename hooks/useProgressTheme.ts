/**
 * useProgressTheme.ts
 *
 * Custom hook for managing Progress Tracker theme configuration.
 * Extracted from ProgressTrackerScreen.js for better maintainability.
 */

import { useState, useMemo } from 'react';

interface ThemeStyles {
  container: { backgroundColor: string };
  backButton: { backgroundColor: string; shadowColor: string };
  backButtonText: { color: string };
  titleIcon: { backgroundColor: string; shadowColor: string };
  titleIconColor: { color: string };
  title: { color: string };
  subtitle: { color: string };
  dataSourceText: { color: string };
  chartContainer: { backgroundColor: string; shadowColor: string };
  chartTitle: { color: string };
  chartSubtitle: { color: string };
  categoryName: { color: string };
  categoryCount: { color: string };
  statCard: { backgroundColor: string; shadowColor: string };
  statNumber: { color: string };
  statLabel: { color: string };
  noDataIcon: { color: string };
  noDataText: { color: string };
  refreshColor: { color: string };
  periodSelector: { backgroundColor: string };
  periodButton: { backgroundColor: string; borderColor: string };
  periodButtonText: { color: string };
  activePeriodButton: { backgroundColor: string };
  activePeriodButtonText: { color: string };
  tabSelector: { backgroundColor: string };
  tab: { backgroundColor: string };
  activeTab: { backgroundColor: string };
  tabText: { color: string };
  activeTabText: { color: string };
  loadingColor: { color: string };
  loadingText: { color: string };
  quickProgressAction: { backgroundColor: string };
  quickProgressActionText: { color: string };
}

export const useProgressTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Light theme configuration
  const lightStyles: ThemeStyles = useMemo(() => ({
    container: { backgroundColor: '#F8F4E3' },
    backButton: { backgroundColor: 'rgba(255, 255, 255, 0.9)', shadowColor: '#1A2C5B' },
    backButtonText: { color: '#1A2C5B' },
    titleIcon: { backgroundColor: 'rgba(26, 44, 91, 0.1)', shadowColor: '#1A2C5B' },
    titleIconColor: { color: '#1A2C5B' },
    title: { color: '#1A2C5B' },
    subtitle: { color: '#4A5568' },
    dataSourceText: { color: '#4A5568' },
    chartContainer: { backgroundColor: '#FFFFFF', shadowColor: '#1A2C5B' },
    chartTitle: { color: '#2C3E50' },
    chartSubtitle: { color: '#4A5568' },
    categoryName: { color: '#2C3E50' },
    categoryCount: { color: '#7F8C8D' },
    statCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', shadowColor: '#1A2C5B' },
    statNumber: { color: '#2C3E50' },
    statLabel: { color: '#7F8C8D' },
    noDataIcon: { color: '#7F8C8D' },
    noDataText: { color: '#7F8C8D' },
    refreshColor: { color: '#1A2C5B' },
    periodSelector: { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
    periodButton: { backgroundColor: '#FFFFFF', borderColor: '#1A2C5B' },
    periodButtonText: { color: '#1A2C5B' },
    activePeriodButton: { backgroundColor: '#1A2C5B' },
    activePeriodButtonText: { color: '#FFFFFF' },
    tabSelector: { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
    tab: { backgroundColor: 'transparent' },
    activeTab: { backgroundColor: '#1A2C5B' },
    tabText: { color: '#4A5568' },
    activeTabText: { color: '#FFFFFF' },
    loadingColor: { color: '#1A2C5B' },
    loadingText: { color: '#4A5568' },
    quickProgressAction: { backgroundColor: 'rgba(26, 44, 91, 0.1)' },
    quickProgressActionText: { color: '#1A2C5B' },
  }), []);

  // Dark theme configuration
  const darkStyles: ThemeStyles = useMemo(() => ({
    container: { backgroundColor: '#1A2C5B' },
    backButton: { backgroundColor: 'rgba(44, 70, 125, 0.8)', shadowColor: '#D4AF37' },
    backButtonText: { color: '#F8F4E3' },
    titleIcon: { backgroundColor: 'rgba(212, 175, 55, 0.2)', shadowColor: '#D4AF37' },
    titleIconColor: { color: '#D4AF37' },
    title: { color: '#F8F4E3' },
    subtitle: { color: '#CBD5E0' },
    dataSourceText: { color: '#CBD5E0' },
    chartContainer: { backgroundColor: '#2C3E50', shadowColor: '#D4AF37' },
    chartTitle: { color: '#FFFFFF' },
    chartSubtitle: { color: '#CBD5E0' },
    categoryName: { color: '#FFFFFF' },
    categoryCount: { color: '#BDC3C7' },
    statCard: { backgroundColor: 'rgba(44, 62, 80, 0.95)', shadowColor: '#D4AF37' },
    statNumber: { color: '#FFFFFF' },
    statLabel: { color: '#BDC3C7' },
    noDataIcon: { color: '#BDC3C7' },
    noDataText: { color: '#BDC3C7' },
    refreshColor: { color: '#D4AF37' },
    periodSelector: { backgroundColor: 'rgba(44, 70, 125, 0.6)' },
    periodButton: { backgroundColor: '#2C467D', borderColor: '#D4AF37' },
    periodButtonText: { color: '#D4AF37' },
    activePeriodButton: { backgroundColor: '#D4AF37' },
    activePeriodButtonText: { color: '#1A2C5B' },
    tabSelector: { backgroundColor: 'rgba(44, 70, 125, 0.6)' },
    tab: { backgroundColor: 'transparent' },
    activeTab: { backgroundColor: '#D4AF37' },
    tabText: { color: '#CBD5E0' },
    activeTabText: { color: '#1A2C5B' },
    loadingColor: { color: '#D4AF37' },
    loadingText: { color: '#CBD5E0' },
    quickProgressAction: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
    quickProgressActionText: { color: '#D4AF37' },
  }), []);

  // Current theme based on mode
  const currentTheme = useMemo(
    () => (isDarkMode ? darkStyles : lightStyles),
    [isDarkMode, darkStyles, lightStyles]
  );

  // Status bar style
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

  return {
    isDarkMode,
    setIsDarkMode,
    currentTheme,
    statusBarStyle,
    lightStyles,
    darkStyles,
  };
};

export type { ThemeStyles };
