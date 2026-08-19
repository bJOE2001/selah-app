import { create } from 'zustand';

export type ScriptureFontSize = 'S' | 'M' | 'L' | 'XL';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface SettingsState {
  // Theme
  themeMode: ThemeMode;

  // Reading
  fontSize: ScriptureFontSize;
  redLetter: boolean;

  // Reminders
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;

  // Appearance
  paperLined: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: ScriptureFontSize) => void;
  setRedLetter: (enabled: boolean) => void;
  setMorningReminder: (enabled: boolean, time?: string) => void;
  setEveningReminder: (enabled: boolean, time?: string) => void;
  setPaperLined: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: 'light',
  fontSize: 'M',
  redLetter: true,
  morningReminderEnabled: false,
  morningReminderTime: '07:00 AM',
  eveningReminderEnabled: false,
  eveningReminderTime: '09:00 PM',
  paperLined: true,

  setThemeMode: (themeMode) => set({ themeMode }),
  setFontSize: (fontSize) => set({ fontSize }),
  setRedLetter: (redLetter) => set({ redLetter }),
  setMorningReminder: (enabled, time) =>
    set((state) => ({
      morningReminderEnabled: enabled,
      morningReminderTime: time || state.morningReminderTime,
    })),
  setEveningReminder: (enabled, time) =>
    set((state) => ({
      eveningReminderEnabled: enabled,
      eveningReminderTime: time || state.eveningReminderTime,
    })),
  setPaperLined: (paperLined) => set({ paperLined }),
}));
