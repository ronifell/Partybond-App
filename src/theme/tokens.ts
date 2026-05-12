// Design tokens — modern 2026 dark UI with neon brand accents.
// Mirrors tailwind.config.js so non-NativeWind code can use the same values.

export const colors = {
  brand: {
    pink: '#FF4DA6',
    purple: '#7B3FF2',
    blue: '#00D1FF',
  },
  bg: {
    base: '#0A0A12',
    surface: '#12121A',
    card: '#1C1C28',
    border: '#2A2A38',
  },
  ink: {
    primary: '#FFFFFF',
    secondary: '#B8B8CC',
    disabled: '#6B6B80',
  },
  status: {
    success: '#00C853',
    error: '#FF5252',
  },
  // Glassmorphism — translucent layers that sit on top of the background image.
  glass: {
    surface: 'rgba(20, 20, 32, 0.55)', // primary card tint
    surfaceLight: 'rgba(28, 28, 44, 0.45)', // secondary surface
    border: 'rgba(255, 255, 255, 0.10)', // hairline border
    borderStrong: 'rgba(255, 255, 255, 0.18)', // focused / hovered border
    highlight: 'rgba(255, 255, 255, 0.04)', // very subtle inner sheen
  },
};

export const gradient = {
  primary: ['#FF4DA6', '#7B3FF2', '#00D1FF'] as const,
  primaryReverse: ['#00D1FF', '#7B3FF2', '#FF4DA6'] as const,
  glow: ['rgba(123,63,242,0.4)', 'rgba(123,63,242,0)'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Modern apps lean into bigger, softer corners.
export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  heading: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  subheading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
};
