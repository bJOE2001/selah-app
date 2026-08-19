export const FONTS = {
  // Scripture & Quotes (Classic Elegant Serif)
  scriptureDisplay: 'PlayfairDisplay_400Regular',
  scriptureBold: 'PlayfairDisplay_700Bold',
  scriptureItalic: 'PlayfairDisplay_400Regular_Italic',

  // Section Headers & UI Titles (Refined Editorial Serif)
  sectionHeader: 'Lora_700Bold',
  body: 'Lora_400Regular',
  bodyBold: 'Lora_700Bold',
  bodyItalic: 'Lora_400Regular_Italic',

  // User Hand-journaling entries (Natural Handwriting)
  userInput: 'Caveat_400Regular',
  userInputBold: 'Caveat_700Bold',

  // System Fallbacks for instant load
  systemSerif: 'serif',
  systemSans: 'System',
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
  display: 34,
} as const;

export const LINE_HEIGHTS = {
  ruledLine: 32, // Default spacing for ruled paper journaling inputs
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;
