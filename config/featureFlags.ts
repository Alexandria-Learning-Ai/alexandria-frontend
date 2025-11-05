/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for controlling experimental features
 * and gradual rollouts. This allows us to test new features in development
 * or enable them for specific users without deploying new code.
 *
 * Usage:
 * ```typescript
 * import { FEATURE_FLAGS } from '../config/featureFlags';
 *
 * if (FEATURE_FLAGS.USE_EXPERIMENTAL_THEME) {
 *   // Use experimental theme
 * }
 * ```
 */

// Check if running in development mode
const isDevelopment = __DEV__;

export const FEATURE_FLAGS = {
  /**
   * Experimental Design System
   *
   * Enables the new experimental design system with:
   * - Darker gradient backgrounds
   * - Refined gold accent colors
   * - Enhanced shadows and depth
   * - Modernized visual aesthetic
   *
   * When enabled:
   * - HomeScreenV2 is accessible via navigation
   * - Can be toggled in development
   * - Does not affect production HomeScreen
   */
  USE_EXPERIMENTAL_THEME: isDevelopment, // Only enabled in development

  /**
   * Feature Flag: Book Study Mode
   *
   * Enables the new Book Study Mode features:
   * - Material library
   * - Chapter-by-chapter reading
   * - Book-specific quizzes
   */
  ENABLE_BOOK_STUDY_MODE: true,

  /**
   * Feature Flag: Audio Playlists
   *
   * Enables audio playlist generation and playback
   */
  ENABLE_AUDIO_PLAYLISTS: true,

  /**
   * Feature Flag: Advanced Analytics
   *
   * Enables advanced analytics and insights
   */
  ENABLE_ADVANCED_ANALYTICS: isDevelopment,

  /**
   * Feature Flag: Experimental Components
   *
   * Enables access to experimental components directory
   */
  ENABLE_EXPERIMENTAL_COMPONENTS: isDevelopment,
} as const;

/**
 * Check if a feature is enabled
 *
 * @param feature - The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export const isFeatureEnabled = (
  feature: keyof typeof FEATURE_FLAGS
): boolean => {
  return FEATURE_FLAGS[feature] === true;
};

/**
 * Get all enabled features
 *
 * @returns Array of enabled feature names
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled === true)
    .map(([feature]) => feature);
};
