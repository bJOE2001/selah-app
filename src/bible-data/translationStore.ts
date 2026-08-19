import { create } from 'zustand';
import { BibleTranslation, BIBLE_TRANSLATIONS, getTranslation } from './translations';

interface TranslationState {
  selectedTranslation: BibleTranslation;
  setTranslation: (translationOrId: BibleTranslation | string) => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
  selectedTranslation: BIBLE_TRANSLATIONS[0], // Default KJV
  setTranslation: (translationOrId) => {
    if (typeof translationOrId === 'string') {
      set({ selectedTranslation: getTranslation(translationOrId) });
    } else {
      set({ selectedTranslation: translationOrId });
    }
  },
}));
