/**
 * useExperimentalTheme Hook
 *
 * EXPERIMENTAL DESIGN SYSTEM
 *
 * This hook provides the experimental theme tokens while maintaining
 * the exact same interface as the current useTheme hook. This allows
 * for drop-in replacement without any component changes.
 *
 * Features:
 * - Same ThemeStyles interface as useTheme
 * - Maps new design tokens to existing properties
 * - Uses experimental gradients and colors
 * - Fully type-safe
 *
 * Usage:
 * Replace: const { themeStyles } = useTheme();
 * With:    const { themeStyles } = useExperimentalTheme();
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { colors, gradients, shadow } from '../theme-experimental/tokens';

// Use the exact same interface as the production theme
interface ThemeStyles {
  // Container
  container: { backgroundColor: string };
  greeting: { color: string };
  userName: { color: string };
  profileButton: { backgroundColor: string; shadowColor?: string };
  profileIcon: { color: string };
  quickStats: { backgroundColor: string; shadowColor?: string };
  statNumber: { color: string };
  statLabel: { color: string };

  // Progress Widget
  progressWidget: { backgroundColor: string };
  progressIcon: { color: string };
  progressTitle: { color: string };
  progressStatNumber: { color: string };
  progressStatLabel: { color: string };
  strengthWeaknessLabel: { color: string };
  strengthWeaknessValue: { color: string };
  quickProgressAction: { backgroundColor: string; borderColor: string };
  quickProgressActionText: { color: string };
  noProgressIcon: { color: string };
  noProgressText: { color: string };
  startButton: { backgroundColor: string };
  startButtonText: { color: string };

  // Buttons
  primaryAction: { backgroundColor: string };
  primaryActionIcon: { backgroundColor: string };
  primaryActionIconColor: { color: string };
  primaryActionTitle: { color: string };
  primaryActionSubtitle: { color: string };

  secondaryAction: { backgroundColor: string };
  secondaryActionTitle: { color: string };
  secondaryActionSubtitle: { color: string };

  additionalFeatureButton: { backgroundColor: string; borderColor: string };
  additionalFeatureIcon: { color: string };
  additionalFeatureText: { color: string };

  quoteContainer: { backgroundColor: string; borderColor: string };
  quoteIcon: { color: string };
  quoteText: { color: string };
  quoteAuthor: { color: string };

  askAlexandriaButton: { backgroundColor: string; borderColor: string };
  askAlexandriaText: { color: string };
  askAlexandriaIcon: { color: string };

  refreshColor: { color: string };

  // Profile Menu
  profileMenuContainer: { backgroundColor: string };
  profileMenuAvatar: { backgroundColor: string };
  profileMenuUserName: { color: string };
  profileMenuUserEmail: { color: string };
  profileMenuDivider: { backgroundColor: string };
  profileMenuItem: { backgroundColor: string };
  profileMenuItemIcon: { color: string };
  profileMenuItemText: { color: string };
  profileMenuLanguageFlag: { color: string };
  profileMenuChevron: { color: string };

  // Language Menu
  languageMenuContainer: { backgroundColor: string };
  languageMenuTitle: { color: string };
  languageMenuItem: { backgroundColor: string };
  languageLabel: { color: string };
}

export const useExperimentalTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      logger.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      logger.error('Error saving theme:', error);
    }
  };

  /**
   * Get experimental theme styles
   *
   * Maps new design tokens to the existing ThemeStyles interface.
   * This ensures backward compatibility while using the new visual style.
   */
  const getThemeStyles = useCallback((): ThemeStyles => {
    if (isDarkMode) {
      // Dark mode with experimental design tokens
      return {
        // Main container uses gradient background (handled by LinearGradient in component)
        container: { backgroundColor: colors.bg },
        greeting: { color: colors.text },
        userName: { color: colors.text },
        profileButton: { backgroundColor: 'rgba(248, 244, 227, 0.08)' },
        profileIcon: { color: colors.text },
        quickStats: { backgroundColor: 'rgba(248, 244, 227, 0.08)' },
        statNumber: { color: colors.text },
        statLabel: { color: colors.textDim },

        // Progress Widget - experimental styling
        progressWidget: { backgroundColor: colors.card },
        progressIcon: { color: colors.gold },
        progressTitle: { color: colors.text },
        progressStatNumber: { color: colors.text },
        progressStatLabel: { color: colors.textDim },
        strengthWeaknessLabel: { color: colors.textDim },
        strengthWeaknessValue: { color: colors.text },
        quickProgressAction: {
          backgroundColor: 'rgba(255, 209, 92, 0.15)',
          borderColor: colors.gold
        },
        quickProgressActionText: { color: colors.gold },
        noProgressIcon: { color: colors.text },
        noProgressText: { color: colors.textDim },
        startButton: { backgroundColor: colors.gold },
        startButtonText: { color: colors.bg },

        // Buttons with experimental gold gradient
        primaryAction: { backgroundColor: colors.gold },
        primaryActionIcon: { backgroundColor: colors.bg },
        primaryActionIconColor: { color: colors.text },
        primaryActionTitle: { color: colors.bg },
        primaryActionSubtitle: { color: colors.bg },

        secondaryAction: { backgroundColor: colors.card },
        secondaryActionTitle: { color: colors.text },
        secondaryActionSubtitle: { color: colors.textDim },

        additionalFeatureButton: {
          backgroundColor: 'rgba(248, 244, 227, 0.06)',
          borderColor: 'rgba(248, 244, 227, 0.2)'
        },
        additionalFeatureIcon: { color: colors.text },
        additionalFeatureText: { color: colors.text },

        quoteContainer: {
          backgroundColor: 'rgba(255, 209, 92, 0.12)',
          borderColor: 'rgba(255, 209, 92, 0.3)'
        },
        quoteIcon: { color: colors.gold },
        quoteText: { color: colors.text },
        quoteAuthor: { color: colors.textDim },

        askAlexandriaButton: {
          backgroundColor: colors.card,
          borderColor: colors.gold
        },
        askAlexandriaText: { color: colors.text },
        askAlexandriaIcon: { color: colors.gold },

        refreshColor: { color: colors.gold },

        // Profile Menu with experimental styling
        profileMenuContainer: { backgroundColor: 'rgba(17, 26, 43, 0.98)' },
        profileMenuAvatar: { backgroundColor: 'rgba(255, 209, 92, 0.15)' },
        profileMenuUserName: { color: colors.text },
        profileMenuUserEmail: { color: colors.textDim },
        profileMenuDivider: { backgroundColor: 'rgba(248, 244, 227, 0.15)' },
        profileMenuItem: { backgroundColor: 'transparent' },
        profileMenuItemIcon: { color: colors.text },
        profileMenuItemText: { color: colors.text },
        profileMenuLanguageFlag: { color: colors.text },
        profileMenuChevron: { color: colors.textDim },

        // Language Menu
        languageMenuContainer: { backgroundColor: 'rgba(17, 26, 43, 0.98)' },
        languageMenuTitle: { color: colors.text },
        languageMenuItem: { backgroundColor: 'transparent' },
        languageLabel: { color: colors.text },
      };
    } else {
      // Light mode (keeping same as original for now - experimental is dark-first)
      return {
        container: { backgroundColor: '#F8F4E3' },
        greeting: { color: '#4A5568' },
        userName: { color: '#1A2C5B' },
        profileButton: { backgroundColor: 'rgba(255, 255, 255, 0.9)', shadowColor: '#1A2C5B' },
        profileIcon: { color: '#1A2C5B' },
        quickStats: { backgroundColor: 'rgba(255, 255, 255, 0.95)', shadowColor: '#1A2C5B' },
        statNumber: { color: '#1A2C5B' },
        statLabel: { color: '#4A5568' },

        progressWidget: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
        progressIcon: { color: '#1A2C5B' },
        progressTitle: { color: '#1A2C5B' },
        progressStatNumber: { color: '#1A2C5B' },
        progressStatLabel: { color: '#4A5568' },
        strengthWeaknessLabel: { color: '#4A5568' },
        strengthWeaknessValue: { color: '#1A2C5B' },
        quickProgressAction: { backgroundColor: 'rgba(26, 44, 91, 0.1)', borderColor: '#1A2C5B' },
        quickProgressActionText: { color: '#1A2C5B' },
        noProgressIcon: { color: '#1A2C5B' },
        noProgressText: { color: '#4A5568' },
        startButton: { backgroundColor: '#1A2C5B' },
        startButtonText: { color: '#FFFFFF' },

        primaryAction: { backgroundColor: '#1A2C5B' },
        primaryActionIcon: { backgroundColor: '#D4AF37' },
        primaryActionIconColor: { color: '#1A2C5B' },
        primaryActionTitle: { color: '#FFFFFF' },
        primaryActionSubtitle: { color: '#FFFFFF' },

        secondaryAction: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
        secondaryActionTitle: { color: '#1A2C5B' },
        secondaryActionSubtitle: { color: '#4A5568' },

        additionalFeatureButton: { backgroundColor: 'rgba(26, 44, 91, 0.05)', borderColor: 'rgba(26, 44, 91, 0.2)' },
        additionalFeatureIcon: { color: '#1A2C5B' },
        additionalFeatureText: { color: '#1A2C5B' },

        quoteContainer: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)' },
        quoteIcon: { color: '#D4AF37' },
        quoteText: { color: '#1A2C5B' },
        quoteAuthor: { color: '#4A5568' },

        askAlexandriaButton: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#1A2C5B' },
        askAlexandriaText: { color: '#1A2C5B' },
        askAlexandriaIcon: { color: '#1A2C5B' },

        refreshColor: { color: '#1A2C5B' },

        profileMenuContainer: { backgroundColor: 'rgba(255, 255, 255, 0.98)' },
        profileMenuAvatar: { backgroundColor: 'rgba(26, 44, 91, 0.1)' },
        profileMenuUserName: { color: '#1A2C5B' },
        profileMenuUserEmail: { color: '#4A5568' },
        profileMenuDivider: { backgroundColor: 'rgba(26, 44, 91, 0.1)' },
        profileMenuItem: { backgroundColor: 'transparent' },
        profileMenuItemIcon: { color: '#1A2C5B' },
        profileMenuItemText: { color: '#1A2C5B' },
        profileMenuLanguageFlag: { color: '#1A2C5B' },
        profileMenuChevron: { color: '#4A5568' },

        languageMenuContainer: { backgroundColor: 'rgba(255, 255, 255, 0.98)' },
        languageMenuTitle: { color: '#1A2C5B' },
        languageMenuItem: { backgroundColor: 'transparent' },
        languageLabel: { color: '#1A2C5B' },
      };
    }
  }, [isDarkMode]);

  // Expose gradient colors for LinearGradient components
  const experimentalGradients = useMemo(() => gradients, []);
  const experimentalColors = useMemo(() => colors, []);

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme,
    themeStyles: getThemeStyles(),
    // Additional experimental properties (optional to use)
    gradients: experimentalGradients,
    colors: experimentalColors,
  };
};
