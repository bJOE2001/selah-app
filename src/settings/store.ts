import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Journal Cover Customization
  journalCoverTitle: string;
  journalCoverSubtitle: string;
  journalCoverVerseRef: string;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: ScriptureFontSize) => void;
  setRedLetter: (enabled: boolean) => void;
  setMorningReminder: (enabled: boolean, time?: string) => void;
  setEveningReminder: (enabled: boolean, time?: string) => void;
  setPaperLined: (enabled: boolean) => void;
  setJournalCover: (title: string, subtitle?: string, verseRef?: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      fontSize: 'M',
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
    }
  )
);
