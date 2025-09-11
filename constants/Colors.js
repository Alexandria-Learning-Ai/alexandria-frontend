/**
 * Alexandria App Color Scheme
 * Consistent colors used throughout the application
 */

export const Colors = {
  // Primary Brand Colors
  primary: '#1A2C5B',           // Deep navy blue - main brand color
  primaryLight: '#2A3F6B',      // Lighter navy for variations
  primaryDark: '#0F1E3D',       // Darker navy for depth
  
  // Secondary Colors
  secondary: '#F8F4E3',         // Warm cream - text on dark backgrounds
  accent: '#D4AF37',            // Gold accent - highlights and CTAs
  accentLight: '#E6C659',       // Lighter gold
  accentDark: '#B8941F',        // Darker gold
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  
  // Background Colors
  background: '#F8F9FA',        // Light gray background
  backgroundDark: '#1A2C5B',    // Dark mode background
  surface: '#FFFFFF',           // Card/surface background
  surfaceDark: '#2A3F6B',       // Dark mode surface
  
  // Text Colors
  text: '#343A40',              // Primary text
  textSecondary: '#6C757D',     // Secondary text
  textLight: '#F8F4E3',         // Light text on dark backgrounds
  textMuted: '#ADB5BD',         // Muted text
  
  // Status Colors
  success: '#28A745',           // Green for success states
  error: '#DC3545',             // Red for errors
  warning: '#FFC107',           // Yellow for warnings
  info: '#17A2B8',              // Blue for info
  
  // Educational Colors
  math: '#007AFF',              // Blue for math-related content
  science: '#34C759',           // Green for science
  literature: '#AF52DE',        // Purple for literature
  history: '#FF9500',           // Orange for history
  
  // Interactive Elements
  link: '#007AFF',              // Blue for links
  linkHover: '#0056CC',         // Darker blue for hover
  button: '#1A2C5B',            // Primary button color
  buttonHover: '#2A3F6B',       // Button hover state
  
  // Border Colors
  border: '#DEE2E6',            // Default border
  borderLight: '#E9ECEF',       // Light border
  borderDark: '#495057',        // Dark border
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)', // Default shadow
  shadowDark: 'rgba(0, 0, 0, 0.2)', // Darker shadow
  
  // Loading Animation Colors
  loadingPrimary: '#1A2C5B',    // Primary color for loading animations
  loadingSecondary: '#F8F4E3',  // Secondary color for loading animations
  loadingAccent: '#D4AF37',     // Accent color for loading animations
};

// Color variations for different themes
export const LightTheme = {
  ...Colors,
  background: Colors.background,
  surface: Colors.surface,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  border: Colors.border,
};

export const DarkTheme = {
  ...Colors,
  background: Colors.backgroundDark,
  surface: Colors.surfaceDark,
  text: Colors.textLight,
  textSecondary: Colors.gray400,
  border: Colors.borderDark,
};

// Gradient combinations
export const Gradients = {
  primary: [Colors.primary, Colors.primaryLight],
  accent: [Colors.accent, Colors.accentLight],
  success: [Colors.success, '#20C997'],
  warm: [Colors.accent, '#FFB84D'],
  cool: [Colors.primary, Colors.info],
  loading: [Colors.loadingPrimary, Colors.loadingAccent],
};

// Animation color schemes
export const AnimationColors = {
  bookLoading: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    accent: Colors.accent,
    background: Colors.background
  },
  success: {
    primary: Colors.success,
    secondary: Colors.white,
    accent: Colors.accent
  },
  error: {
    primary: Colors.error,
    secondary: Colors.white,
    accent: Colors.warning
  }
};

export default Colors;