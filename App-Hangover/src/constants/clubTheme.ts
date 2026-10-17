export const ClubTheme = {
  colors: {
    bg: '#040407',
    surface: '#0d0d16',
    surfaceElevated: '#141422',
    border: 'rgba(255, 255, 255, 0.07)',
    borderActive: 'rgba(217, 70, 239, 0.35)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',

    textPrimary: '#ffffff',
    textSecondary: '#9da0b5',
    textMuted: '#646678',

    primary: '#c026d3',
    primaryGradient: ['#c026d3', '#7c3aed'] as const,
    primaryLight: 'rgba(192, 38, 211, 0.12)',

    accent: '#818cf8',
    accentLight: 'rgba(129, 140, 248, 0.12)',

    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.12)',

    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.12)',

    danger: '#f43f5e',
    dangerLight: 'rgba(244, 63, 94, 0.12)',
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  touchTarget: {
    minHeight: 46,
  },
} as const;
