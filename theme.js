// ============================================
// GateWise Mobile App - Theme Configuration
// Modern, Clean & Futuristic Design System
// ============================================

export const colors = {
  // Primary Brand Colors
  primary: {
    blue: "#3B82F6", // Bright blue - Main brand color
    purple: "#8B5CF6", // Vibrant purple - Secondary brand
    indigo: "#6366F1", // Deep indigo - Accent
    cyan: "#06B6D4", // Cyan - Info/Active states
  },

  // Extended Primary Palette
  primaryShades: {
    blue50: "#EFF6FF",
    blue100: "#DBEAFE",
    blue200: "#BFDBFE",
    blue300: "#93C5FD",
    blue400: "#60A5FA",
    blue500: "#3B82F6",
    blue600: "#2563EB",
    blue700: "#1D4ED8",
    blue800: "#1E40AF",
    blue900: "#1E3A8A",

    purple50: "#FAF5FF",
    purple100: "#F3E8FF",
    purple200: "#E9D5FF",
    purple300: "#D8B4FE",
    purple400: "#C084FC",
    purple500: "#8B5CF6",
    purple600: "#7C3AED",
    purple700: "#6D28D9",
    purple800: "#5B21B6",
    purple900: "#4C1D95",
  },

  // Neutral Colors - Modern Gray Scale
  neutral: {
    white: "#FFFFFF",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
    black: "#000000",
  },

  // Status & Feedback Colors
  status: {
    success: "#10B981", // Green
    successLight: "#D1FAE5",
    warning: "#F59E0B", // Amber
    warningLight: "#FEF3C7",
    error: "#EF4444", // Red
    errorLight: "#FEE2E2",
    info: "#06B6D4", // Cyan
    infoLight: "#CFFAFE",
  },

  // Background Variants
  background: {
    primary: "#FFFFFF",
    secondary: "#F9FAFB",
    tertiary: "#F3F4F6",
    card: "#FFFFFF",
    elevated: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",
    modal: "rgba(0, 0, 0, 0.6)",
    blur: "rgba(255, 255, 255, 0.8)",

    // Gradient backgrounds
    gradientLight: ["#EFF6FF", "#F9FAFB"],
    gradientPrimary: ["#3B82F6", "#8B5CF6"],
    gradientSecondary: ["#8B5CF6", "#EC4899"],
    gradientCyan: ["#06B6D4", "#3B82F6"],
  },

  // Text Colors
  text: {
    primary: "#111827", // Almost black
    secondary: "#4B5563", // Medium gray
    tertiary: "#6B7280", // Light gray
    disabled: "#9CA3AF", // Disabled state
    inverse: "#FFFFFF", // White text
    link: "#3B82F6", // Blue links
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    placeholder: "#9CA3AF",
  },

  // Border Colors
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
    focus: "#3B82F6",
    error: "#EF4444",
    success: "#10B981",
  },

  // Surface Colors (for cards, sheets, etc.)
  surface: {
    base: "#FFFFFF",
    elevated: "#FFFFFF",
    overlay: "#F9FAFB",
    dialog: "#FFFFFF",
    sheet: "#FFFFFF",
  },

  // Feature-specific Colors
  features: {
    visitor: {
      primary: "#06B6D4",
      light: "#CFFAFE",
      dark: "#0891B2",
    },
    security: {
      primary: "#10B981",
      light: "#D1FAE5",
      dark: "#059669",
    },
    guest: {
      primary: "#8B5CF6",
      light: "#F3E8FF",
      dark: "#7C3AED",
    },
    alert: {
      primary: "#EF4444",
      light: "#FEE2E2",
      dark: "#DC2626",
    },
  },
};

// Spacing Scale (8px base unit)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
  giant: 80,
};

// Border Radius Scale
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,

  // Component-specific
  button: 12,
  card: 16,
  input: 12,
  badge: 20,
  avatar: 9999,
  sheet: 24,
};

// Shadow Definitions (iOS & Android compatible)
export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  xxl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 10,
  },

  // Colored shadows
  primary: {
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  success: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Typography System
export const typography = {
  // Font Families (Use Inter or SF Pro)
  fonts: {
    thin: "Outfit-Thin",
    extraLight: "Outfit-ExtraLight",
    light: "Outfit-Light",
    regular: "Outfit-Regular",
    medium: "Outfit-Medium",
    semiBold: "Outfit-SemiBold",
    bold: "Outfit-Bold",
    extraBold: "Outfit-ExtraBold",
    black: "Outfit-Black",
  },

  // Font Weights (for iOS)
  weights: {
    thin: "100",
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
    black: "900",
  },

  // Font Sizes
  sizes: {
    xxs: 10,
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    heading1: 32,
    heading2: 28,
    heading3: 24,
    heading4: 20,
    display: 40,
    giant: 48,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

// Animation Configurations
export const animations = {
  duration: {
    fastest: 100,
    fast: 200,
    normal: 300,
    slow: 400,
    slower: 500,
    slowest: 700,
  },

  easing: {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    spring: [0.34, 1.56, 0.64, 1],
  },

  // Pre-configured animations
  preset: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideInUp: {
      from: { opacity: 0, translateY: 20 },
      to: { opacity: 1, translateY: 0 },
    },
    slideInDown: {
      from: { opacity: 0, translateY: -20 },
      to: { opacity: 1, translateY: 0 },
    },
    scale: {
      from: { opacity: 0, scale: 0.9 },
      to: { opacity: 1, scale: 1 },
    },
  },
};

// Gradient Definitions
export const gradients = {
  primary: {
    colors: ["#3B82F6", "#8B5CF6"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: ["#8B5CF6", "#EC4899"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  cyan: {
    colors: ["#06B6D4", "#3B82F6"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  success: {
    colors: ["#10B981", "#34D399"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sunset: {
    colors: ["#F59E0B", "#EF4444"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  ocean: {
    colors: ["#0EA5E9", "#06B6D4", "#10B981"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  night: {
    colors: ["#1E40AF", "#7C3AED"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Component-specific Styles
export const componentStyles = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: colors.primary.blue,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      ...shadows.md,
    },
    secondary: {
      backgroundColor: colors.primary.purple,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      ...shadows.md,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: colors.primary.blue,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing.xl - 2,
    },
    ghost: {
      backgroundColor: "transparent",
      borderRadius: borderRadius.button,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    success: {
      backgroundColor: colors.status.success,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      ...shadows.success,
    },
    danger: {
      backgroundColor: colors.status.error,
      borderRadius: borderRadius.button,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      ...shadows.md,
    },
  },

  // Card Styles
  card: {
    default: {
      backgroundColor: colors.surface.base,
      borderRadius: borderRadius.card,
      padding: spacing.base,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.surface.elevated,
      borderRadius: borderRadius.card,
      padding: spacing.base,
      ...shadows.lg,
    },
    outlined: {
      backgroundColor: colors.surface.base,
      borderRadius: borderRadius.card,
      padding: spacing.base,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    gradient: {
      borderRadius: borderRadius.card,
      padding: spacing.base,
      ...shadows.md,
    },
  },

  // Input Styles
  input: {
    default: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      borderColor: colors.border.light,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
      fontSize: typography.sizes.base,
      color: colors.text.primary,
    },
    focused: {
      backgroundColor: colors.background.primary,
      borderColor: colors.border.focus,
      borderWidth: 2,
      ...shadows.sm,
    },
    error: {
      borderColor: colors.border.error,
      borderWidth: 2,
      backgroundColor: colors.status.errorLight,
    },
    success: {
      borderColor: colors.border.success,
      borderWidth: 2,
      backgroundColor: colors.status.successLight,
    },
  },

  // Bottom Sheet
  bottomSheet: {
    container: {
      backgroundColor: colors.surface.sheet,
      borderTopLeftRadius: borderRadius.sheet,
      borderTopRightRadius: borderRadius.sheet,
      ...shadows.xxl,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.neutral.gray300,
      alignSelf: "center",
      marginVertical: spacing.sm,
    },
  },

  // Badge Styles
  badge: {
    default: {
      borderRadius: borderRadius.badge,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.primaryShades.blue100,
    },
    success: {
      borderRadius: borderRadius.badge,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.status.successLight,
    },
    warning: {
      borderRadius: borderRadius.badge,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.status.warningLight,
    },
    error: {
      borderRadius: borderRadius.badge,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.status.errorLight,
    },
  },

  // Avatar Styles
  avatar: {
    small: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.avatar,
    },
    medium: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.avatar,
    },
    large: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.avatar,
    },
    xlarge: {
      width: 96,
      height: 96,
      borderRadius: borderRadius.avatar,
    },
  },
};

// Utility Functions
export const getColor = (colorPath) => {
  const keys = colorPath.split(".");
  let result = colors;

  for (const key of keys) {
    if (result[key]) {
      result = result[key];
    } else {
      console.warn(`Color path "${colorPath}" not found in theme`);
      return colors.primary.blue;
    }
  }

  return result;
};

export const getSpacing = (multiplier = 1) => spacing.base * multiplier;

export const getFontStyle = (
  size = "base",
  weight = "regular",
  color = "text.primary"
) => ({
  fontSize: typography.sizes[size] || typography.sizes.base,
  fontFamily: typography.fonts[weight] || typography.fonts.regular,
  fontWeight: typography.weights[weight] || typography.weights.regular,
  color: getColor(color),
});

export const applyOpacity = (color, opacity) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Layout Constants
export const layout = {
  window: {
    width: null, // Set dynamically
    height: null, // Set dynamically
  },
  isSmallDevice: false, // Set dynamically
  header: {
    height: 60,
  },
  tabBar: {
    height: 60,
  },
  bottomSheet: {
    snapPoints: ["25%", "50%", "90%"],
  },
};

// Export default theme object
export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  animations,
  gradients,
  componentStyles,
  layout,
  getColor,
  getSpacing,
  getFontStyle,
  applyOpacity,
};
