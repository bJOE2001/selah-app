import { SQLiteDatabase } from 'expo-sqlite';
import { BibleTranslation } from './translations';
import { CANONICAL_BOOKS } from './constants';
import { getUserDatabase } from './db';

export interface DownloadedTranslationInfo {
  id: string;
  code: string;
  name: string;
  downloadedAt: string;
  verseCount: number;
  sizeBytes: number;
  formattedSize: string;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get all installed/downloaded translations from SQLite database
 */
export async function getDownloadedTranslationsFromDb(
  db?: SQLiteDatabase
): Promise<DownloadedTranslationInfo[]> {
  try {
    const database = db || (await getUserDatabase());
    const rows = await database.getAllAsync<{
      id: string;
      code: string;
      name: string;
      downloaded_at: string;
      verse_count: number;
      size_bytes: number;
    }>(`SELECT id, code, name, downloaded_at, verse_count, size_bytes FROM downloaded_translations ORDER BY name ASC;`);

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      downloadedAt: r.downloaded_at,
      verseCount: r.verse_count,
      sizeBytes: r.size_bytes,
      formattedSize: formatBytes(r.size_bytes),
    }));
  } catch (error) {
    console.warn('Error reading downloaded translations:', error);
    return [];
  }
}

/**
 * Check if a specific translation is downloaded and available offline
 */
export async function checkIsTranslationDownloaded(
  translationId: string,
  db?: SQLiteDatabase
): Promise<boolean> {
  const normId = (translationId || 'kjv').toLowerCase();
  if (normId === 'kjv') return true; // KJV is bundled offline

  try {
    const database = db || (await getUserDatabase());
    const row = await database.getFirstAsync<{ id: string }>(
      `SELECT id FROM downloaded_translations WHERE id = ? LIMIT 1;`,
      [normId]
    );
    return !!row;
  } catch {
    return false;
  }
}

export interface RawApiVerse {
  pk?: number;
  translation?: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
  comment?: string;
}

/**
 * Ensure download tables and indices exist in SQLite
 */
export async function ensureDownloadTables(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS downloaded_translations (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        downloaded_at TEXT NOT NULL,
        verse_count INTEGER NOT NULL,
        size_bytes INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS downloaded_verses (
        id TEXT PRIMARY KEY,
        translation_id TEXT NOT NULL,
        book_id INTEGER NOT NULL,
        book_name TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_downloaded_verses_lookup ON downloaded_verses(translation_id, book_id, chapter);
      CREATE INDEX IF NOT EXISTS idx_downloaded_verses_search ON downloaded_verses(translation_id, text);
    `);
  } catch (_) {}
}

/**
 * Download a full Bible translation and save to SQLite for 100% offline access
 */
export async function downloadTranslation(
  translation: BibleTranslation,
  onProgress?: (percent: number, statusText: string) => void
): Promise<DownloadedTranslationInfo> {
  const normId = translation.id.toLowerCase();
  const apiCode = translation.apiIdentifier || translation.code.toUpperCase();
  const db = await getUserDatabase();

  // Make sure tables exist before downloading
  await ensureDownloadTables(db);

  onProgress?.(10, `Downloading ${translation.name}...`);

  let response: Response;
  const targetUrl =
    translation.downloadUrl ||
    `https://bolls.life/static/translations/${encodeURIComponent(apiCode)}.json`;

  try {
    response = await fetch(targetUrl);
    if (!response.ok && translation.fallbackUrl) {
      response = await fetch(translation.fallbackUrl);
    }
  } catch (fetchErr) {
    if (translation.fallbackUrl) {
      response = await fetch(translation.fallbackUrl);
    } else {
      throw fetchErr;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Failed to download ${translation.name} from repository (HTTP ${response.status}). Please check your internet connection.`
    );
  }

  onProgress?.(40, 'Preparing Scripture verses...');
  const rawData: any = await response.json();
  let rawVerses: RawApiVerse[] = [];

  if (Array.isArray(rawData)) {
    rawVerses = rawData;
  } else if (rawData && Array.isArray(rawData.books)) {
    // Nested format (e.g. scrollmapper canonical 66 books)
    rawData.books.forEach((b: any, bIdx: number) => {
      const bookNum = bIdx + 1;
      if (Array.isArray(b.chapters)) {
        b.chapters.forEach((c: any) => {
          const chapterNum = Number(c.chapter);
          if (Array.isArray(c.verses)) {
            c.verses.forEach((v: any) => {
              rawVerses.push({
                book: bookNum,
                chapter: chapterNum,
                verse: Number(v.verse),
                text: String(v.text || ''),
              });
            });
          }
        });
      }
    });
  }

  if (!Array.isArray(rawVerses) || rawVerses.length === 0) {
    throw new Error(`The downloaded data for ${translation.name} was empty or invalid.`);
  }

  // Pre-index canonical book names for fast lookup
  const bookNameMap = new Map<number, string>();
  CANONICAL_BOOKS.forEach((b) => bookNameMap.set(b.id, b.name));

  onProgress?.(55, 'Optimizing text for offline reading...');

  // Filter to 66 canonical Protestant books and clean text
  const cleanVerses = rawVerses
    .filter((v) => v.book >= 1 && v.book <= 66)
    .map((v) => {
      const bookName = bookNameMap.get(v.book) || `Book ${v.book}`;
      const cleanedText = String(v.text || '')
        .replace(/<S>\d+<\/S>/gi, '') // Strip Strong's numbers tags (e.g. <S>7225</S>)
        .replace(/<[^>]+>/g, '') // Strip all HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      return {
        id: `${normId}_${v.book}_${v.chapter}_${v.verse}`,
        translation_id: normId,
        book_id: v.book,
        book_name: bookName,
        chapter: v.chapter,
        verse: v.verse,
        text: cleanedText,
      };
    });

  if (cleanVerses.length === 0) {
    throw new Error(`No canonical verses found in ${translation.name}.`);
  }

  onProgress?.(65, `Saving ${cleanVerses.length.toLocaleString()} verses to your device...`);

  // Compute total size in bytes
  let totalChars = 0;
  cleanVerses.forEach((v) => {
    totalChars += v.text.length + 30; // row overhead
  });
  const sizeBytes = Math.max(totalChars, cleanVerses.length * 120);

  // SQLite max host parameter limit is 999.
  // 40 rows * 7 columns = 280 parameters (well within all native statement limits)
  const CHUNK_SIZE = 40;
  const totalChunks = Math.ceil(cleanVerses.length / CHUNK_SIZE);

  await db.withTransactionAsync(async () => {
    // 1. Clear any old rows for this translation
    await db.runAsync(`DELETE FROM downloaded_verses WHERE translation_id = ?;`, [normId]);

    // 2. Insert rows in multi-value chunks
    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const chunk = cleanVerses.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE);
      const valuePlaceholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const params: any[] = [];

      chunk.forEach((v) => {
        params.push(v.id, v.translation_id, v.book_id, v.book_name, v.chapter, v.verse, v.text);
      });

      await db.runAsync(
        `INSERT OR REPLACE INTO downloaded_verses (id, translation_id, book_id, book_name, chapter, verse, text)
         VALUES ${valuePlaceholders};`,
        params
      );

      if (chunkIdx % 10 === 0 || chunkIdx === totalChunks - 1) {
        const progressPercent = Math.round(65 + ((chunkIdx + 1) / totalChunks) * 33);
        onProgress?.(progressPercent, `Saving to your device (${progressPercent}%)...`);
      }
    }

    // 3. Insert or replace entry in downloaded_translations catalog
    const nowIso = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO downloaded_translations (id, code, name, downloaded_at, verse_count, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [normId, translation.code, translation.name, nowIso, cleanVerses.length, sizeBytes]
    );
  });

  onProgress?.(100, 'Ready for offline reading!');


  return {
    id: normId,
    code: translation.code,
    name: translation.name,
    downloadedAt: new Date().toISOString(),
    verseCount: cleanVerses.length,
    sizeBytes: sizeBytes,
    formattedSize: formatBytes(sizeBytes),
  };
}

/**
 * Delete a downloaded translation and free storage space
 */
export async function deleteDownloadedTranslation(
  translationId: string,
  db?: SQLiteDatabase
): Promise<void> {
  const normId = translationId.toLowerCase();
  if (normId === 'kjv') {
    // Cannot delete built-in KJV
    return;
  }

  const database = db || (await getUserDatabase());
  await database.withTransactionAsync(async () => {
    await database.runAsync(`DELETE FROM downloaded_verses WHERE translation_id = ?;`, [normId]);
    await database.runAsync(`DELETE FROM downloaded_translations WHERE id = ?;`, [normId]);
  });
}
