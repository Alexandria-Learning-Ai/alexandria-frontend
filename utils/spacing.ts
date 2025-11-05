/**
 * Spacing Constants
 * Standardized spacing system following 4/8px grid
 *
 * Usage:
 * ```typescript
 * import { spacing } from '../utils/spacing';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: spacing.lg,  // 16
 *     marginTop: spacing.xl, // 20
 *   }
 * });
 * ```
 */

export const spacing = {
  /** 4px - Minimal spacing */
  xs: 4,

  /** 8px - Small spacing */
  sm: 8,

  /** 12px - Medium spacing */
  md: 12,

  /** 16px - Large spacing (most common) */
  lg: 16,

  /** 20px - Extra large spacing */
  xl: 20,

  /** 24px - Double extra large */
  xxl: 24,

  /** 32px - Triple extra large */
  xxxl: 32,

  /** 40px - Huge spacing */
  huge: 40,

  /** 48px - Massive spacing */
  massive: 48,
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = typeof spacing[SpacingKey];

/**
 * Border radius values following design system
 */
export const borderRadius = {
  /** 4px - Minimal rounding */
  xs: 4,

  /** 8px - Small rounding */
  sm: 8,

  /** 12px - Medium rounding (buttons) */
  md: 12,

  /** 16px - Large rounding (cards) */
  lg: 16,

  /** 20px - Extra large rounding */
  xl: 20,

  /** 24px - Double extra large */
  xxl: 24,

  /** 9999px - Full rounding (pills) */
  full: 9999,
} as const;

/**
 * Common shadow presets for elevation
 */
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export default {
  spacing,
  borderRadius,
  shadows,
};
