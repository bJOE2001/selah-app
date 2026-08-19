export const LIGHT_COLORS = {
  // Canvas & Backgrounds
  paperBg: '#FAF7F2',
  paperLine: '#E8E0D4',
  bindingAccent: '#C46246',
  cardBg: '#FFFFFF',

  // Typography Inks
  inkPrimary: '#2C2520',
  inkSecondary: '#6B5E54',
  inkPlaceholder: '#B8AFA6',
  inkMuted: '#96887B',

  // Branding
  brandGreen: '#3A7D3A',
  brandGreenLight: '#EAF3EA',
  brandGold: '#D4A84B',

  // Ribbon Tape Headers
  tapeRhema: '#C46246',       // Terracotta / Crimson Red
  tapeReflection: '#5B8C5A',  // Sage Green
  tapeMotivation: '#D4A84B',  // Warm Gold / Honey
  tapeApplication: '#4A7C9B', // Steel / Slate Blue

  // UI Interactive Elements
  chipBg: '#F5F0EA',
  chipBgSelected: '#E8DFD3',
  chipBorder: '#D4C9BC',

  checkboxUnchecked: '#C4B9AC',
  checkboxChecked: '#5B8C5A',

  // Scripture Card Accent
  rhemaCardBg: '#FFF8F0',
  rhemaCardBorder: '#E8D5C4',
  quoteMarkColor: '#C46246',

  // Calendar & Accents
  calendarMark: '#C46246',
  calendarToday: '#3A7D3A',
  calendarSelected: '#3A7D3A',

  // Privacy / Lock Screen
  lockBg: '#FAF7F2',
  lockAccent: '#3A7D3A',
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  // Canvas & Backgrounds
  paperBg: '#151311',
  paperLine: '#2B2621',
  bindingAccent: '#E07A5F',
  cardBg: '#211E1B',

  // Typography Inks
  inkPrimary: '#F6F0EB',
  inkSecondary: '#A99F94',
  inkPlaceholder: '#635B52',
  inkMuted: '#83796E',

  // Branding
  brandGreen: '#52A752',
  brandGreenLight: '#1C291C',
  brandGold: '#E6BC5C',

  // Ribbon Tape Headers
  tapeRhema: '#E07A5F',
  tapeReflection: '#6FA46E',
  tapeMotivation: '#E6BC5C',
  tapeApplication: '#6098BD',

  // UI Interactive Elements
  chipBg: '#2A2520',
  chipBgSelected: '#38322B',
  chipBorder: '#3D362F',

  checkboxUnchecked: '#4A4239',
  checkboxChecked: '#52A752',

  // Scripture Card Accent
  rhemaCardBg: '#26211C',
  rhemaCardBorder: '#3D342B',
  quoteMarkColor: '#E07A5F',

  // Calendar & Accents
  calendarMark: '#E07A5F',
  calendarToday: '#52A752',
  calendarSelected: '#52A752',

  // Privacy / Lock Screen
  lockBg: '#151311',
  lockAccent: '#52A752',
};

export const COLORS = LIGHT_COLORS;

export type ColorTheme = typeof LIGHT_COLORS;
export type ColorToken = keyof typeof LIGHT_COLORS;
