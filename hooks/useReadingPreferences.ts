/**
 * Reading Preferences Hook
 *
 * Manages user reading preferences for the chapter reader, including:
 * - Original vs Alexandria styling toggle
 * - Persistence to AsyncStorage
 * - Type-safe preference management
 *
 * Usage:
 * const { preferences, updatePreference, isLoading } = useReadingPreferences();
 *
 * Features:
 * - Automatic persistence to AsyncStorage
 * - Loading state for initial hydration
 * - Type-safe preference updates
 * - Default to Alexandria styling (useOriginalStyles: false)
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

/**
 * Reading preferences interface
 */
export interface ReadingPreferences {
  useOriginalStyles: boolean; // true = EPUB publisher styles, false = Alexandria styles
}

/**
 * Default reading preferences (Alexandria styling by default)
 */
const DEFAULT_PREFERENCES: ReadingPreferences = {
  useOriginalStyles: false,
};

const STORAGE_KEY = '@alexandria_reading_preferences';

/**
 * Hook for managing reading preferences with AsyncStorage persistence
 *
 * @returns {object} preferences, updatePreference, isLoading
 *
 * @example
 * const { preferences, updatePreference, isLoading } = useReadingPreferences();
 *
 * // Toggle original styling
 * updatePreference({ useOriginalStyles: !preferences.useOriginalStyles });
 *
 * // Check if loading
 * if (isLoading) return <Spinner />;
 */
export const useReadingPreferences = () => {
  const [preferences, setPreferences] = useState<ReadingPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored) as ReadingPreferences;
          setPreferences(parsed);
          logger.info('Reading preferences loaded from storage', { preferences: parsed });
        } else {
          logger.info('No stored reading preferences, using defaults', {
            defaults: DEFAULT_PREFERENCES,
          });
        }
      } catch (error) {
        logger.error('Failed to load reading preferences', { error });
        // Keep default preferences on error
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  /**
   * Update reading preferences and persist to AsyncStorage
   *
   * @param updates - Partial preferences to update
   */
  const updatePreference = useCallback(
    async (updates: Partial<ReadingPreferences>) => {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
        logger.info('Reading preferences updated and saved', { newPreferences });
      } catch (error) {
        logger.error('Failed to save reading preferences', { error });
        // Note: We still update state even if save fails (optimistic update)
      }
    },
    [preferences]
  );

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(async () => {
    setPreferences(DEFAULT_PREFERENCES);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      logger.info('Reading preferences reset to defaults');
    } catch (error) {
      logger.error('Failed to reset reading preferences', { error });
    }
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences,
    isLoading,
  };
};

export default useReadingPreferences;
