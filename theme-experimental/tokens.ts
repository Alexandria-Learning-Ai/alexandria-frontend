/**
 * Experimental Design System Tokens (Enhanced for Gradient Orbs + Depth)
 *
 * Adds: gradients.card, gradients.orbs, gradients.goldOrb, shadow.glowSoft, shadow.glowColor()
 * Goal: unify button, orb, and card lighting styles under a consistent theme system.
 */

export const colors = {
  // Base backgrounds
  bg: '#0B1223',
  bg2: '#0F1F33',
  card: '#111A2B',
  cardStroke: 'rgba(255,255,255,0.06)',

  // Text
  text: '#F8F4E3',
  textMute: '#7A89A7',
  textDim: '#A8B2D1',

  // Brand accent
  gold: '#FFD15C',
  goldDeep: '#E8A93A',
  bronze: '#CD7F32',

  // Accent hues
  blue: '#5DAEFF',
  purple: '#8A6CFF',
  pink: '#FF5F6D',
  teal: '#00C9A7',
  green: '#43E97B',
  orange: '#FF8A65',
  red: '#FF5252',

  // Semantic
  success: '#32D583',
  danger: '#FF6B6B',
  warning: '#FDE68A',
};

export const gradients = {
  // App backgrounds
  appBg: ['#0B1223', '#0F1F33'],

  // CTA and components
  cta: ['#FFD15C', '#E8A93A'],
  pillIcon: ['#8A6CFF', '#5DAEFF'],
  cardShine: ['#1B2436', '#0F1B2D'],

  /**
   * ✨ New — Default gradient for cards and panels
   * Used by FeatureCard, MainActionsEnhanced, and OrbSectionCard
   */
  card: ['#101A2B', '#0C1423'],

  // ✨ Gradient Orbs (for CircularOrb.js)
  orbs: {
    insights: ['#9D7BFF', '#4FC3F7'],     // Purple → Blue
    playlists: ['#FF8A65', '#FF5252'],   // Orange → Red
    dashboard: ['#4FC3F7', '#00C9A7'],   // Blue → Teal
    reflections: ['#FFC371', '#FF5F6D'], // Gold → Pink
    journal: ['#8E2DE2', '#4A00E0'],     // Violet → Deep Purple
    study: ['#43E97B', '#38F9D7'],       // Green → Aqua
  },

  // ✨ Gold Orb (used by Primary CTA-style circular buttons)
  goldOrb: ['#FFD15C', '#E8A93A'],

  // ✨ Text shimmer overlay (for animated highlights)
  textShine: ['#ffffff30', '#ffffff10', '#ffffff00'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const shadow = {
  // Deep card shadow
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  // Gold glow (used by PrimaryButton)
  glow: {
    shadowColor: '#FFD15C',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },

  // ✨ Soft luminous glow for Orbs
  glowSoft: {
    shadowColor: '#FFD15C',
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },

  // ✨ Dynamic glow helper (useful for per-color shadows)
  glowColor: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
  }),

  // Subtle drop shadow
  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
};

export const typography = {
  h1: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },

  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textDim,
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.textDim,
  },

  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMute,
  },

  button: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },

  sub: {
    fontSize: 14,
    color: colors.textMute,
  },
};
