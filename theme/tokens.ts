// theme/tokens.ts
export const colors = {
  // Base
  bg:        '#0B1223',   // deep navy
  bg2:       '#0F1B2D',   // surface
  card:      '#121C2E',
  cardStroke:'#1E2A44',

  // Text
  text:      '#EAF0FF',
  textDim:   '#A8B2D1',
  textMute:  '#8A95B5',

  // Brand accents
  gold:      '#F5C451',   // CTA fill
  goldDeep:  '#D4AF37',   // CTA gradient end / borders
  bronze:    '#CD7F32',
  green:     '#014421',
  maroon:    '#800020',
  purple:    '#9E8CFB',
  blue:      '#6BA9FF',

  // States
  success:   '#32D583',
  warning:   '#FDE68A',
  danger:    '#FF6B6B',
};

export const gradients = {
  appBg:    ['#0B1223', '#0F1F33'],
  cta:      ['#F8D777', '#D4AF37'],
  cardShine:['#1B2436', '#0F1B2D'],
};

export const radius  = { xl: 24, lg: 18, md: 14, sm: 10 };
export const spacing = { 0:0, 4:4, 8:8, 12:12, 16:16, 20:20, 24:24, 32:32 };
export const shadow  = {
  card: { shadowColor:'#000', shadowOpacity:0.35, shadowRadius:16, shadowOffset:{width:0,height:10}, elevation:10 },
  glow: { shadowColor:'#F5C451', shadowOpacity:0.45, shadowRadius:18, shadowOffset:{width:0,height:6} },
};

export const typography = {
  h1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: 0.2, color: colors.text },
  h2: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.textDim },
  label: { fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.3, color: colors.text },
};

