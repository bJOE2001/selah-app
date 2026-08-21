import { SQLiteDatabase } from 'expo-sqlite';
import { Book, Verse, VerseSearchResult } from './types';
import { CANONICAL_BOOKS } from './constants';
import { getBibleDatabase } from './db';
import { getTranslation } from './translations';
import { generateId } from '../utils/uuid';

/**
 * Fetch all 66 canonical books of the Bible in order
 */
export async function getBooks(db: SQLiteDatabase): Promise<Book[]> {
  return CANONICAL_BOOKS;
}

/**
 * Get a specific book by its canonical ID (1-66)
 */
export async function getBookById(db: SQLiteDatabase, bookId: number): Promise<Book | null> {
  return CANONICAL_BOOKS.find((b) => b.id === bookId) || null;
}

/**
 * Get all verses in a given book and chapter for a specific translation (default KJV)
 *
 * - For KJV: reads directly from KJV.db (bundled offline database).
 * - For other translations (NLT, ESV, NIV, etc.): reads directly from local downloaded_verses table.
 * - If not downloaded, returns empty array so UI can prompt user to download.
 */
export async function getChapterVerses(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number,
  translationId: string = 'kjv'
): Promise<Verse[]> {
  const normId = (translationId || 'kjv').toLowerCase();
  const book = CANONICAL_BOOKS.find((b) => b.id === bookId);
  const bookName = book?.name || '';
  const bookAbbrev = book?.abbreviation || '';

  // 1. If KJV, read directly from the bundled KJV.db database
  if (normId === 'kjv') {
    try {
      const bibleDb = await getBibleDatabase();
      const verses = await bibleDb.getAllAsync<{
        id: number;
        book_id: number;
        chapter: number;
        verse: number;
        text: string;
      }>(
        `SELECT MIN(id) as id, book_id, chapter, verse, text
         FROM KJV_verses
         WHERE book_id = ? AND chapter = ?
         GROUP BY book_id, chapter, verse
         ORDER BY verse ASC;`,
        [bookId, chapter]
      );
      if (verses && verses.length > 0) {
        return verses.map((v) => ({
          ...v,
          id: (v.book_id * 1000000) + (v.chapter * 1000) + v.verse,
          book_name: bookName,
          book_abbrev: bookAbbrev,
        }));
      }
    } catch (e) {
      console.warn('Error querying KJV_verses from KJV.db:', e);
    }
    return [];
  }

  // 2. For non-KJV translations, query downloaded_verses table
  try {
    const downloaded = await db.getAllAsync<{
      id: string;
      book_id: number;
      chapter: number;
      verse: number;
      text: string;
      book_name: string;
    }>(
      `SELECT id, book_id, chapter, verse, text, book_name
       FROM downloaded_verses
       WHERE translation_id = ? AND book_id = ? AND chapter = ?
       ORDER BY verse ASC;`,
      [normId, bookId, chapter]
    );

    if (downloaded && downloaded.length > 0) {
      return downloaded.map((v) => ({
        id: (bookId * 1000000) + (chapter * 1000) + v.verse,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        book_name: v.book_name || bookName,
        book_abbrev: bookAbbrev,
      }));
    }
  } catch (err) {
    console.warn('Downloaded verses lookup error:', err);
  }

  // 3. Backward-compatibility check: check legacy cached_verses if exists
  try {
    const legacyCached = await db.getAllAsync<{
      id: string;
      book_id: number;
      chapter: number;
      verse: number;
      text: string;
      book_name: string;
    }>(
      `SELECT id, book_id, chapter, verse, text, book_name
       FROM cached_verses
       WHERE translation_id = ? AND book_id = ? AND chapter = ?
       ORDER BY verse ASC;`,
      [normId, bookId, chapter]
    );

    if (legacyCached && legacyCached.length > 0) {
      return legacyCached.map((v) => ({
        id: (bookId * 1000000) + (chapter * 1000) + v.verse,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        book_name: v.book_name || bookName,
        book_abbrev: bookAbbrev,
      }));
    }
  } catch {}

  // 4. Not downloaded yet - return empty array (UI handles prompt)
  return [];
}

/**
 * Get a single verse by ID
 */
export async function getVerseById(
  db: SQLiteDatabase,
  verseId: number
): Promise<Verse | null> {
  try {
    const bibleDb = await getBibleDatabase();

    // Canonical ID support (e.g. 1001001 -> Book 1, Chapter 1, Verse 1)
    if (verseId >= 1000000) {
      const bookId = Math.floor(verseId / 1000000);
      const chapter = Math.floor((verseId % 1000000) / 1000);
      const verseNum = verseId % 1000;

      const verse = await bibleDb.getFirstAsync<{
        id: number;
        book_id: number;
        chapter: number;
        verse: number;
        text: string;
      }>(
        `SELECT MIN(id) as id, book_id, chapter, verse, text
         FROM KJV_verses
         WHERE book_id = ? AND chapter = ? AND verse = ?
         GROUP BY book_id, chapter, verse;`,
        [bookId, chapter, verseNum]
      );
      if (verse) {
        const book = CANONICAL_BOOKS.find((b) => b.id === verse.book_id);
        return {
          ...verse,
          id: verseId,
          book_name: book?.name || '',
          book_abbrev: book?.abbreviation || '',
        };
      }
    }

    // Fallback for legacy raw KJV row IDs
    const verse = await bibleDb.getFirstAsync<{
      id: number;
      book_id: number;
      chapter: number;
      verse: number;
      text: string;
    }>(
      `SELECT id, book_id, chapter, verse, text
       FROM KJV_verses
       WHERE id = ?;`,
      [verseId]
    );
    if (verse) {
      const book = CANONICAL_BOOKS.find((b) => b.id === verse.book_id);
      return {
        ...verse,
        id: (verse.book_id * 1000000) + (verse.chapter * 1000) + verse.verse,
        book_name: book?.name || '',
        book_abbrev: book?.abbreviation || '',
      };
    }
  } catch {}
  return null;
}

/**
 * Search verses by keyword in specified translation
 */
export async function searchVerses(
  db: SQLiteDatabase,
  query: string,
  translationId: string = 'kjv',
  limit: number = 30
): Promise<VerseSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const normId = (translationId || 'kjv').toLowerCase();

  // If KJV: query KJV.db
  if (normId === 'kjv') {
    try {
      const bibleDb = await getBibleDatabase();
      const results = await bibleDb.getAllAsync<{
        id: number;
        book_id: number;
        chapter: number;
        verse: number;
        text: string;
      }>(
        `SELECT MIN(id) as id, book_id, chapter, verse, text
         FROM KJV_verses
         WHERE book_id BETWEEN 1 AND 66 AND text LIKE ?
         GROUP BY book_id, chapter, verse
         ORDER BY book_id ASC, chapter ASC, verse ASC
         LIMIT ?;`,
        [`%${trimmed}%`, limit]
      );

      return results.map((v) => {
        const book = CANONICAL_BOOKS.find((b) => b.id === v.book_id);
        const bookName = book?.name || '';
        return {
          id: (v.book_id * 1000000) + (v.chapter * 1000) + v.verse,
          book_id: v.book_id,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
          book_name: bookName,
          book_abbrev: book?.abbreviation || '',
          reference: `${bookName} ${v.chapter}:${v.verse}`,
        };
      });
    } catch {
      return [];
    }
  }

  // Non-KJV: query downloaded_verses in user database
  try {
    const results = await db.getAllAsync<{
      id: string;
      book_id: number;
      chapter: number;
      verse: number;
      text: string;
      book_name: string;
    }>(
      `SELECT id, book_id, chapter, verse, text, book_name
       FROM downloaded_verses
       WHERE translation_id = ? AND text LIKE ?
       ORDER BY book_id ASC, chapter ASC, verse ASC
       LIMIT ?;`,
      [normId, `%${trimmed}%`, limit]
    );

    return results.map((v) => {
      const book = CANONICAL_BOOKS.find((b) => b.id === v.book_id);
      return {
        id: (v.book_id * 1000000) + (v.chapter * 1000) + v.verse,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        book_name: v.book_name || book?.name || '',
        reference: `${v.book_name || book?.name || ''} ${v.chapter}:${v.verse}`,
      };
    });
  } catch {
    return [];
  }
}
