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

export function useBook(bookId: number) {
  return useQuery({
    queryKey: ['bible', 'book', bookId],
    queryFn: async () => {
      const db = await getUserDatabase();
      const book = await queries.getBookById(db, bookId);
      if (book) return book;
      return CANONICAL_BOOKS.find((b) => b.id === bookId) || null;
    },
    initialData: CANONICAL_BOOKS.find((b) => b.id === bookId) || null,
    staleTime: Infinity,
    enabled: !!bookId && bookId > 0,
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

export function useVerse(verseId: number) {
  return useQuery({
    queryKey: ['bible', 'verse', verseId],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.getVerseById(db, verseId);
    },
    staleTime: Infinity,
    enabled: !!verseId && verseId > 0,
  });
}

export function useVerseSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['bible', 'search', searchTerm],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.searchVerses(db, searchTerm);
    },
    enabled: searchTerm.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
