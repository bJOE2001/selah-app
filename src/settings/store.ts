import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Legacy type kept for backward compatibility during migration
export type ScriptureFontSize = 'S' | 'M' | 'L' | 'XL';
export type ThemeMode = 'light' | 'dark' | 'system';

// Min/Max bounds for the continuous font size slider
export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 28;
export const FONT_SIZE_DEFAULT = 17;

export interface SettingsState {
  // Theme
  themeMode: ThemeMode;

  // Reading — continuous numeric font size (px)
  fontSize: number;
  redLetter: boolean;

  // Reminders
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;

  // Appearance
  paperLined: boolean;

  // Journal Cover Customization
  journalCoverTitle: string;
  journalCoverSubtitle: string;
  journalCoverVerseRef: string;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: number) => void;
  setRedLetter: (enabled: boolean) => void;
  setMorningReminder: (enabled: boolean, time?: string) => void;
  setEveningReminder: (enabled: boolean, time?: string) => void;
  setPaperLined: (enabled: boolean) => void;
  setJournalCover: (title: string, subtitle?: string, verseRef?: string) => void;
}

// Migration map for old string-based font sizes → numeric px
const LEGACY_FONT_SIZE_MAP: Record<string, number> = {
  S: 14,
  M: 17,
  L: 20,
  XL: 23,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      fontSize: FONT_SIZE_DEFAULT,
      redLetter: true,
      morningReminderEnabled: false,
      morningReminderTime: '07:00 AM',
      eveningReminderEnabled: false,
      eveningReminderTime: '09:00 PM',
      paperLined: true,
      journalCoverTitle: 'My Devotional Journal',
      journalCoverSubtitle: 'Thy word is a lamp unto my feet, and a light unto my path.',
      journalCoverVerseRef: 'Psalm 119:105',

      setThemeMode: (themeMode) => set({ themeMode }),
      setFontSize: (fontSize) =>
        set({ fontSize: Math.round(Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, fontSize))) }),
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
      setJournalCover: (title, subtitle, verseRef) =>
        set((state) => ({
          journalCoverTitle: title.trim() || state.journalCoverTitle,
          journalCoverSubtitle:
            subtitle !== undefined ? subtitle.trim() : state.journalCoverSubtitle,
          journalCoverVerseRef:
            verseRef !== undefined ? verseRef.trim() : state.journalCoverVerseRef,
        })),
    }),
    {
      name: 'shepema-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Migrate old string-based fontSize ('S','M','L','XL') to numeric px
      migrate: (persistedState: any, _version: number) => {
        if (persistedState && typeof persistedState.fontSize === 'string') {
          persistedState.fontSize =
            LEGACY_FONT_SIZE_MAP[persistedState.fontSize] || FONT_SIZE_DEFAULT;
        }
        return persistedState;
      },
      version: 1,
    }
  )
);
