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
 * For KJV: reads directly from KJV.db (KJV_verses table, book_id 1-66).
 * For NLT, NIV, ESV, WEB, etc.: checks SQLite cached_verses first, and fetches & caches from API if needed.
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

  // 1. If KJV, read directly from the KJV.db Bible database
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
          book_name: bookName,
          book_abbrev: bookAbbrev,
        }));
      }
    } catch (e) {
      console.warn('Error querying KJV_verses from KJV.db:', e);
    }
    return [];
  }

  // 2. Ensure cached_verses table exists defensively
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_verses (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id INTEGER NOT NULL,
        book_name TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cached_verses_lookup ON cached_verses(translation_id, book_id, chapter);
    `);
  } catch {}

  // 3. For non-KJV translations (like NLT), check SQLite cached_verses table first
  try {
    const cached = await db.getAllAsync<{
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

    if (cached && cached.length > 0) {
      return cached.map((v) => ({
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
    console.warn('Cached verses lookup warning:', err);
  }

  // 4. If not cached, fetch from live API (Primary: Bolls Life, Secondary: Bible-API) and cache in SQLite
  const translationMeta = getTranslation(normId);
  const apiCode = translationMeta.apiIdentifier || normId.toUpperCase();

  let fetchedVersesList: { verse: number; text: string }[] = [];

  // 4a. Try Bolls Life API (Supports NLT, NIV, ESV, NKJV, NASB, etc.)
  try {
    const bollsUrl = `https://bolls.life/get-chapter/${encodeURIComponent(apiCode.toUpperCase())}/${bookId}/${chapter}/`;
    const response = await fetch(bollsUrl);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        fetchedVersesList = data.map((d: any) => ({
          verse: Number(d.verse),
          text: String(d.text || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        }));
      }
    }
  } catch (bollsErr) {
    console.warn(`Bolls Life fetch error for ${apiCode}:`, bollsErr);
  }

  // 4b. If Bolls Life didn't return data, try Bible-API.com
  if (fetchedVersesList.length === 0 && bookName) {
    try {
      const bibleApiUrl = `https://bible-api.com/${encodeURIComponent(bookName)}+${chapter}?translation=${encodeURIComponent(normId)}`;
      const response = await fetch(bibleApiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.verses) && data.verses.length > 0) {
          fetchedVersesList = data.verses.map((rawVerse: any) => ({
            verse: Number(rawVerse.verse),
            text: String(rawVerse.text || '').replace(/\s+/g, ' ').trim(),
          }));
        }
      }
    } catch (apiErr) {
      console.warn(`Bible-API fetch error for ${normId}:`, apiErr);
    }
  }

  // If verses were retrieved, persist to SQLite cache and return
  if (fetchedVersesList.length > 0) {
    const resultVerses: Verse[] = [];

    try {
      await db.withTransactionAsync(async () => {
        for (const item of fetchedVersesList) {
          const recordId = generateId();
          await db.runAsync(
            `INSERT OR REPLACE INTO cached_verses (id, translation_id, book_id, book_name, chapter, verse, text)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [recordId, normId, bookId, bookName, chapter, item.verse, item.text]
          );

          resultVerses.push({
            id: (bookId * 1000000) + (chapter * 1000) + item.verse,
            book_id: bookId,
            chapter: chapter,
            verse: item.verse,
            text: item.text,
            book_name: bookName,
            book_abbrev: bookAbbrev,
          });
        }
      });

      return resultVerses;
    } catch (saveErr) {
      console.warn('Error saving fetched verses to cache:', saveErr);
      return fetchedVersesList.map((item) => ({
        id: (bookId * 1000000) + (chapter * 1000) + item.verse,
        book_id: bookId,
        chapter: chapter,
        verse: item.verse,
        text: item.text,
        book_name: bookName,
        book_abbrev: bookAbbrev,
      }));
    }
  }

  // 5. Graceful offline fallback: Return KJV if offline/unreachable
  return getChapterVerses(db, bookId, chapter, 'kjv');
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
        book_name: book?.name || '',
        book_abbrev: book?.abbreviation || '',
      };
    }
  } catch {}
  return null;
}

/**
 * Search verses by keyword
 */
export async function searchVerses(
  db: SQLiteDatabase,
  query: string,
  limit: number = 30
): Promise<VerseSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

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
      return {
        ...v,
        book_name: book?.name || '',
        reference: `${book?.name || ''} ${v.chapter}:${v.verse}`,
      };
    });
  } catch {
    return [];
  }
}
