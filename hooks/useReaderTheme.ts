/**
 * useReaderTheme - Adaptive theme management for reader
 *
 * Features:
 * - Theme modes: Light, Dark, Sepia, Auto
 * - Auto mode: switches to dark mode after 8 PM, light mode during day
 * - Smooth theme transitions
 * - Persistent user preference via AsyncStorage
 * - Returns theme colors optimized for reading
 *
 * Usage:
 * const { theme, themeMode, setThemeMode, themeColors } = useReaderTheme();
 *
 * @returns Theme configuration and controls
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import logger from '../utils/logger';

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'auto';

export interface ReaderThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
}

const STORAGE_KEY = '@alexandria_reader_theme';

/**
 * Light theme colors (default)
 */
const LIGHT_THEME: ReaderThemeColors = {
  background: Colors.background,
  surface: Colors.surface,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  accent: Colors.accent,
  border: Colors.border,
};

/**
 * Dark theme colors (for night reading)
 */
const DARK_THEME: ReaderThemeColors = {
  background: '#1A1A1A',
  surface: '#2A2A2A',
  text: '#E8E8E8',
  textSecondary: '#B0B0B0',
  accent: Colors.accentLight,
  border: '#3A3A3A',
};

/**
 * Sepia theme colors (warm, eye-friendly)
 */
const SEPIA_THEME: ReaderThemeColors = {
  background: '#F4ECD8',
  surface: '#F9F4E8',
  text: '#5B4636',
  textSecondary: '#8B7355',
  accent: Colors.accentDark,
  border: '#D4C4A8',
};

/**
 * Determine if it's night time (after 8 PM or before 6 AM)
 */
const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6; // 8 PM - 6 AM = night
};

/**
 * Hook for managing reader theme with auto-switching
 */
export const useReaderTheme = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from AsyncStorage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = stored as ThemeMode;
          setThemeModeState(parsed);
          logger.info('Reader theme loaded from storage', { theme: parsed });
        } else {
          logger.info('No stored theme preference, using auto mode');
        }
      } catch (error) {
        logger.error('Failed to load theme preference', { error });
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Determine effective theme based on mode and time
  const effectiveTheme = useMemo((): 'light' | 'dark' | 'sepia' => {
    if (themeMode === 'auto') {
      return isNightTime() ? 'dark' : 'light';
    }
    return themeMode as 'light' | 'dark' | 'sepia';
  }, [themeMode]);

  // Get theme colors based on effective theme
  const themeColors = useMemo((): ReaderThemeColors => {
    switch (effectiveTheme) {
      case 'dark':
        return DARK_THEME;
      case 'sepia':
        return SEPIA_THEME;
      case 'light':
      default:
        return LIGHT_THEME;
    }
  }, [effectiveTheme]);

  // Update theme mode and persist to AsyncStorage
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
      logger.info('Reader theme updated and saved', { mode });
    } catch (error) {
      logger.error('Failed to save theme preference', { error });
    }
  }, []);

  // For auto mode, check periodically if time has crossed threshold
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const interval = setInterval(() => {
      // Force re-render every minute to check if night time changed
      setThemeModeState('auto');
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [themeMode]);

  return {
    themeMode,
    setThemeMode,
    effectiveTheme,
    themeColors,
    isLoading,
  };
};

export default useReaderTheme;
