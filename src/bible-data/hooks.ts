import { useQuery } from '@tanstack/react-query';
import { getUserDatabase } from './db';
import * as queries from './queries';
import { CANONICAL_BOOKS } from './constants';

export function useBooks() {
  return useQuery({
    queryKey: ['bible', 'books'],
    queryFn: async () => {
      try {
        const db = await getUserDatabase();
        const dbBooks = await queries.getBooks(db);
        if (dbBooks && dbBooks.length === 66) {
          return dbBooks;
        }
      } catch (err) {
        console.warn('Using canonical books metadata fallback:', err);
      }
      return CANONICAL_BOOKS;
    },
    initialData: CANONICAL_BOOKS,
    staleTime: Infinity, // Canonical Bible books never change
  });
}

export function useChapterVerses(
  bookId: number,
  chapter: number,
  translationId: string = 'kjv'
) {
  return useQuery({
    queryKey: ['bible', 'chapter', bookId, chapter, translationId],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.getChapterVerses(db, bookId, chapter, translationId);
    },
    staleTime: Infinity,
    enabled: !!bookId && !!chapter && bookId > 0 && chapter > 0,
  });
}
