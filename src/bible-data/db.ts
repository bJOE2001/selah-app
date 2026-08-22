import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

let userDbInstance: SQLite.SQLiteDatabase | null = null;
let bibleDbInstance: SQLite.SQLiteDatabase | null = null;

// Singleton promise to prevent concurrent initialization
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let bibleInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const USER_DB_NAME = 'devotion.db';
const BIBLE_DB_NAME = 'KJV.db';

/**
 * Initialize user database (devotion.db) for journal, highlights, etc.
 * Uses a singleton promise so concurrent callers all await the same init.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (userDbInstance) {
    return userDbInstance;
  }

  // If init is already in progress, await the existing promise
  if (initPromise) {
    return initPromise;
  }

  initPromise = _doInitDatabase();
  try {
    const db = await initPromise;
    return db;
  } catch (err) {
    // Reset so it can be retried
    initPromise = null;
    throw err;
  }
}

async function _doInitDatabase(): Promise<SQLite.SQLiteDatabase> {
  // --- Step 1: Copy KJV.db asset to device if needed (native only) ---
  await ensureBibleDb();

  // --- Step 2: Open user database ---
  const db = await SQLite.openDatabaseAsync(USER_DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await initDevotionalTables(db);
  userDbInstance = db;
  return db;
}

/**
 * Ensure the KJV.db Bible asset is copied to the device's SQLite folder.
 * Only checks file existence + size — no database open/close for verification.
 */
async function ensureBibleDb(): Promise<void> {
  if (Platform.OS === 'web') {
    // On web, SQLite uses WASM/IndexedDB/OPFS; local filesystem copy is not applicable
    return;
  }
  try {
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    const biblePath = `${sqliteDir}/${BIBLE_DB_NAME}`;

    // Ensure SQLite directory exists
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    // Check if Bible DB file exists and is big enough (KJV.db is ~33MB)
    const fileInfo = await FileSystem.getInfoAsync(biblePath);
    const needsCopy = !fileInfo.exists || (fileInfo.exists && (fileInfo.size ?? 0) < 1_000_000);

    if (needsCopy) {
      console.log('Copying KJV.db Bible asset to:', biblePath);

      // Delete old file if exists
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(biblePath, { idempotent: true });
      }

      const dbAsset = Asset.fromModule(require('../../assets/db/KJV.db'));
      await dbAsset.downloadAsync();

      const sourceUri = dbAsset.localUri || dbAsset.uri;
      if (sourceUri) {
        await FileSystem.copyAsync({
          from: sourceUri,
          to: biblePath,
        });
        console.log('KJV.db successfully copied to SQLite folder.');
      } else {
        console.error('Could not resolve KJV.db asset URI!');
      }
    } else {
      console.log('KJV.db already exists, size:', fileInfo.size);
    }
  } catch (error) {
    console.warn('Bible DB asset copy error:', error);
  }
}

/**
 * Get or open the read-only KJV Bible database.
 * Uses a singleton promise to prevent concurrent opens.
 */
export async function getBibleDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (bibleDbInstance) {
    return bibleDbInstance;
  }

  if (bibleInitPromise) {
    return bibleInitPromise;
  }

  bibleInitPromise = (async () => {
    // Make sure the file is copied first
    await ensureBibleDb();
    const db = await SQLite.openDatabaseAsync(BIBLE_DB_NAME);
    bibleDbInstance = db;
    return db;
  })();

  try {
    return await bibleInitPromise;
  } catch (err) {
    bibleInitPromise = null;
    throw err;
  }
}

/**
 * Get the user database (devotion.db) for journal, highlights, etc.
 * Always awaits initDatabase() first so tables are guaranteed to exist.
 */
export async function getUserDatabase(): Promise<SQLite.SQLiteDatabase> {
  return initDatabase();
}

/**
 * Synchronous accessor — only safe after initDatabase() has completed.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (userDbInstance) {
    return userDbInstance;
  }
  // This should rarely happen if getUserDatabase() is used properly
  console.warn('getDatabase() called before init — opening sync fallback');
  return SQLite.openDatabaseSync(USER_DB_NAME);
}

async function initDevotionalTables(db: SQLite.SQLiteDatabase) {
  // Create tables one at a time to avoid issues with multi-statement exec
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS mood_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      value TEXT NOT NULL UNIQUE,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS devotionals (
      id TEXT PRIMARY KEY,
      rhema_verse_id INTEGER NOT NULL,
      rhema_text TEXT NOT NULL,
      rhema_reference TEXT NOT NULL,
      reflection TEXT NOT NULL DEFAULT '',
      motivation TEXT NOT NULL DEFAULT '',
      application TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_draft INTEGER NOT NULL DEFAULT 1,
      is_bookmarked INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS devotional_mood_tags (
      devotional_id TEXT NOT NULL,
      mood_tag_id INTEGER NOT NULL,
      PRIMARY KEY (devotional_id, mood_tag_id),
      FOREIGN KEY (devotional_id) REFERENCES devotionals(id) ON DELETE CASCADE,
      FOREIGN KEY (mood_tag_id) REFERENCES mood_tags(id)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS application_tasks (
      id TEXT PRIMARY KEY,
      devotional_id TEXT NOT NULL,
      text TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (devotional_id) REFERENCES devotionals(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_devotionals_created ON devotionals(created_at);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_devotionals_draft ON devotionals(is_draft);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_tasks_devotional ON application_tasks(devotional_id);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON application_tasks(is_completed);`);

  // Migration: add application column for existing databases
  try {
    await db.execAsync(`ALTER TABLE devotionals ADD COLUMN application TEXT NOT NULL DEFAULT '';`);
  } catch (_) {
    // Column already exists, ignore
  }

  // Migration: add is_bookmarked column for existing databases
  try {
    await db.execAsync(`ALTER TABLE devotionals ADD COLUMN is_bookmarked INTEGER NOT NULL DEFAULT 0;`);
  } catch (_) {
    // Column already exists, ignore
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS verse_highlights (
      id TEXT PRIMARY KEY,
      verse_id INTEGER NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_highlights_verse ON verse_highlights(verse_id);`);

  // Migration: Automatically upgrade any legacy KJV row IDs (< 1000000) to universal canonical verse IDs
  try {
    const legacyHighlights = await db.getAllAsync<{
      id: string;
      verse_id: number;
      color: string;
      created_at: string;
    }>(`SELECT id, verse_id, color, created_at FROM verse_highlights WHERE verse_id < 1000000;`);

    if (legacyHighlights && legacyHighlights.length > 0) {
      const bibleDb = await getBibleDatabase();
      for (const h of legacyHighlights) {
        const kjvRow = await bibleDb.getFirstAsync<{
          book_id: number;
          chapter: number;
          verse: number;
        }>(`SELECT book_id, chapter, verse FROM KJV_verses WHERE id = ?;`, [h.verse_id]);

        if (kjvRow) {
          const canonicalId = (kjvRow.book_id * 1000000) + (kjvRow.chapter * 1000) + kjvRow.verse;
          await db.runAsync(`DELETE FROM verse_highlights WHERE verse_id = ? AND id != ?;`, [canonicalId, h.id]);
          await db.runAsync(`UPDATE verse_highlights SET verse_id = ? WHERE id = ?;`, [canonicalId, h.id]);
        }
      }
    }
  } catch (migErr) {
    // Non-critical migration failure caught safely
    console.warn('Verse highlights canonical migration note:', migErr);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS downloaded_translations (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      downloaded_at TEXT NOT NULL,
      verse_count INTEGER NOT NULL,
      size_bytes INTEGER NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS downloaded_verses (
      id TEXT PRIMARY KEY,
      translation_id TEXT NOT NULL,
      book_id INTEGER NOT NULL,
      book_name TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL
    );
  `);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_downloaded_verses_lookup ON downloaded_verses(translation_id, book_id, chapter);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_downloaded_verses_search ON downloaded_verses(translation_id, text);`);

  // Legacy cached_verses table for backward-compatible fallback
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
  `);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cached_verses_lookup ON cached_verses(translation_id, book_id, chapter);`);

  // Seed standard mood tags if empty
  await db.execAsync(`
    INSERT OR IGNORE INTO mood_tags (id, value, emoji, color) VALUES
      (1, 'peace', '☮️', '#81C784'),
      (2, 'joy', '😊', '#FFD54F'),
      (3, 'conviction', '⚡', '#FF8A65'),
      (4, 'surrender', '🤲', '#90CAF9'),
      (5, 'gratitude', '🙏', '#CE93D8'),
      (6, 'hope', '🌅', '#4FC3F7'),
      (7, 'repentance', '💔', '#EF9A9A'),
      (8, 'awe', '✨', '#FFF176'),
      (9, 'comfort', '🫂', '#A5D6A7'),
      (10, 'boldness', '🦁', '#FFAB91');
  `);
}
