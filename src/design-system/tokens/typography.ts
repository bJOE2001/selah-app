export const FONTS = {
  // Scripture & Quotes (Crisp High-Legibility Editorial Serif)
  scriptureDisplay: 'Lora_700Bold',
  scriptureBold: 'Lora_700Bold',
  scriptureSemiBold: 'Lora_700Bold',
  scriptureItalic: 'Lora_400Regular_Italic',
  scriptureBoldItalic: 'Lora_700Bold',

  // Section Headers & UI Titles (Refined Editorial Serif)
  sectionHeader: 'Lora_700Bold',
  body: 'Lora_400Regular',
  bodyBold: 'Lora_700Bold',
  bodyItalic: 'Lora_400Regular_Italic',

  // User Devotional Journaling entries (Clean Editorial Serif - Lora)
  userInput: 'Lora_400Regular',
  userInputBold: 'Lora_700Bold',
  userInputHandwriting: 'Caveat_700Bold',

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
