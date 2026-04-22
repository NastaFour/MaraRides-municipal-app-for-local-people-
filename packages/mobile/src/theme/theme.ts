export const theme = {
  colors: {
    bg: '#050505',
    surface: '#111111',
    elevated: '#1C1C1C',
    border: '#2A2A2A',
    accent: '#CCFF00',  // Neon Chartreuse
    cyan: '#00FFFF',    // Cyber Cyan
    danger: '#FF3300',  // Blood Orange
    warn: '#FFB800',
    text: '#F0F0F0',
    muted: '#8A9099',
    transparent: 'transparent',
  },
  fonts: {
    // In React Native, without ejecting to add custom fonts immediately, we use system monospace/sans-serif.
    // Later we can load 'Space Grotesk' & 'Anton' using expo-font.
    mono: 'monospace',
    sans: 'sans-serif',
    display: 'sans-serif-condensed',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borders: {
    panel: {
      borderWidth: 1,
      borderColor: '#2A2A2A',
    },
    accent: {
      borderWidth: 2,
      borderColor: '#CCFF00',
    }
  },
  shadows: {
    hard: {
      shadowColor: '#CCFF00',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 0, // Hard shadows don't translate well to Android elevation without custom SVG, but we use this structure.
    }
  }
};
