/**
 * Theme Colors Utilities
 * Alexandria-themed color system for light and dark modes
 */

export interface ThemeColors {
  // Alexandria Core Colors
  alexandriaGold: string;
  alexandriaBronze: string;
  alexandriaSilver: string;
  alexandriaNavy: string;
  alexandriaCream: string;

  // Status Colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // UI Colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderSecondary: string;
  overlay: string;
  shadow: string;
}

/**
 * Get theme colors based on dark mode preference
 */
export const getThemeColors = (isDark: boolean): ThemeColors => {
  const baseColors = {
    // Alexandria Core Colors
    alexandriaGold: '#D4AF37',
    alexandriaBronze: '#CD7F32',
    alexandriaSilver: '#C0C0C0',
    alexandriaNavy: '#1A2C5B',
    alexandriaCream: '#F8F4E3',

    // Status Colors
    success: isDark ? '#4ade80' : '#28a745',
    error: isDark ? '#ff6b7a' : '#dc3545',
    warning: '#FFD700',
    info: '#3498DB',
  };

  return isDark ? {
    ...baseColors,
    background: '#0F1419', // Deep ancient night
    surface: '#1A2C5B',
    surfaceSecondary: '#2C3E50',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
    textTertiary: '#9CA3AF',
    border: 'rgba(212, 175, 55, 0.3)',
    borderSecondary: 'rgba(248, 244, 227, 0.2)',
    overlay: 'rgba(26, 44, 91, 0.8)',
    shadow: '#D4AF37',
  } : {
    ...baseColors,
    background: '#F8F4E3', // Warm parchment
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',
    text: '#1A2C5B',
    textSecondary: '#4A5568',
    textTertiary: '#718096',
    border: 'rgba(26, 44, 91, 0.2)',
    borderSecondary: 'rgba(26, 44, 91, 0.1)',
    overlay: 'rgba(255, 255, 255, 0.9)',
    shadow: '#1A2C5B',
  };
};
