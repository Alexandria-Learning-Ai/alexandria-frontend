/**
 * Layout Constants - Centralized sizing and spacing values
 *
 * Provides consistent dimensions across the app for headers, icons, spacing, etc.
 */

// ==================== HEADER SIZES ====================

export const HEADER_SIZES = {
  // Title font sizes (reduced from previous values)
  title: {
    large: 24,      // Main screen titles (was 28-32)
    medium: 20,     // Section titles (was 24)
    small: 18,      // Card/component titles (was 20)
  },

  // Icon sizes
  icon: {
    large: 28,      // Main header icons (was 32)
    medium: 24,     // Section icons (was 28)
    small: 20,      // Inline icons (was 24)
  },

  // Spacing
  spacing: {
    vertical: 20,   // Vertical padding (was 28-32)
    horizontal: 16, // Horizontal padding (was 20-24)
  },

  // Heights
  height: {
    compact: 60,    // Compact header height
    standard: 80,   // Standard header height (was 100-120)
    large: 100,     // Large header with subtitle
  },
};

// ==================== COMMON SPACING ====================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ==================== BORDER RADIUS ====================

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// ==================== FONT SIZES ====================

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

// ==================== ICON SIZES ====================

export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
};

export default {
  HEADER_SIZES,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  ICON_SIZES,
};
