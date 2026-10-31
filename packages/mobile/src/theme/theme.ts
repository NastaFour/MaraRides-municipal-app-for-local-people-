// ============================================================
// Mara Rides Mobile — Design System & Theme Tokens
// Governed by taste-skill, refactoring-ui & emil-kowalski
// ============================================================

export const theme = {
  colors: {
    bg: '#0B0F17',
    surface: '#131C2E',
    elevated: '#1A263D',
    border: '#233352',
    borderLight: '#32476E',

    // Brand Mobility Amber
    accent: '#F59E0B',
    accentHover: '#D97706',
    accentLight: '#FBBF24',
    accentGlow: 'rgba(245, 158, 11, 0.15)',

    // Semantic status colors
    cyan: '#38BDF8',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    info: '#38BDF8',
    infoLight: 'rgba(56, 189, 248, 0.15)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    warn: '#F59E0B',

    // Text hierarchy
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    muted: '#8193AF',
    textDark: '#0B0F17',
    transparent: 'transparent',
  },
  fonts: {
    mono: 'System',
    sans: 'System',
    display: 'System',
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    float: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
