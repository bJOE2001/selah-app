import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReadingState {
  lastBookId: number | null;
  lastBookName: string;
  lastChapter: number | null;
  lastReadAt: string | null;
  setLastRead: (bookId: number, bookName: string, chapter: number) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      lastBookId: null,
      lastBookName: '',
      lastChapter: null,
      lastReadAt: null,
      setLastRead: (bookId, bookName, chapter) =>
        set({
          lastBookId: bookId,
          lastBookName: bookName,
          lastChapter: chapter,
          lastReadAt: new Date().toISOString(),
        }),
    }),
    {
      name: 'shepema-reading-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
