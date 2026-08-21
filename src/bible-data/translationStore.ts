import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleTranslation, BIBLE_TRANSLATIONS, getTranslation } from './translations';

interface TranslationState {
  selectedTranslation: BibleTranslation;
  setTranslation: (translationOrId: BibleTranslation | string) => void;
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set) => ({
      selectedTranslation: BIBLE_TRANSLATIONS[0], // Default KJV
      setTranslation: (translationOrId) => {
        if (typeof translationOrId === 'string') {
          set({ selectedTranslation: getTranslation(translationOrId) });
        } else {
          set({ selectedTranslation: translationOrId });
        }
      },
    }),
    {
      name: 'shepema-translation-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
