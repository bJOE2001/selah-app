import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

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
  // --- Step 1: Open user database ---
  const db = await SQLite.openDatabaseAsync(USER_DB_NAME);
  userDbInstance = db;

  // Set high-concurrency PRAGMAs individually outside of any transaction
  try {
    await db.runAsync('PRAGMA journal_mode = WAL;');
  } catch (_) {}

  try {
    await db.runAsync('PRAGMA busy_timeout = 10000;');
  } catch (_) {}

  try {
    await db.runAsync('PRAGMA foreign_keys = ON;');
  } catch (_) {}

  // --- Step 2: Initialize DDL tables ---
  await initDevotionalTables(db);

  // --- Step 3: Copy KJV.db Bible asset in background (non-blocking) ---
  ensureBibleDb().catch((err) => {
    console.warn('Background Bible DB asset copy note:', err);
  });

  return db;
}

/**
 * Ensure the KJV.db Bible asset is copied to the device's SQLite folder.
 * Only checks file existence + size — no database open/close for verification.
 */
async function ensureBibleDb(): Promise<void> {
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
    try {
      await db.runAsync('PRAGMA journal_mode = WAL;');
    } catch (_) {}
    try {
      await db.runAsync('PRAGMA busy_timeout = 10000;');
    } catch (_) {}
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
  console.warn('getDatabase() called before init — opening sync fallback');
  const db = SQLite.openDatabaseSync(USER_DB_NAME);
  try {
    db.execSync('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 10000;');
  } catch (_) {}
  userDbInstance = db;
  return db;
}

async function initDevotionalTables(db: SQLite.SQLiteDatabase) {
  // Execute core tables and indices
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS mood_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      value TEXT NOT NULL UNIQUE,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS devotional_mood_tags (
      devotional_id TEXT NOT NULL,
      mood_tag_id INTEGER NOT NULL,
      PRIMARY KEY (devotional_id, mood_tag_id),
      FOREIGN KEY (devotional_id) REFERENCES devotionals(id) ON DELETE CASCADE,
      FOREIGN KEY (mood_tag_id) REFERENCES mood_tags(id)
    );

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

    CREATE INDEX IF NOT EXISTS idx_devotionals_created ON devotionals(created_at);
    CREATE INDEX IF NOT EXISTS idx_devotionals_draft ON devotionals(is_draft);
    CREATE INDEX IF NOT EXISTS idx_tasks_devotional ON application_tasks(devotional_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON application_tasks(is_completed);

    CREATE TABLE IF NOT EXISTS verse_highlights (
      id TEXT PRIMARY KEY,
      verse_id INTEGER NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_highlights_verse ON verse_highlights(verse_id);

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

  // Safe Column Migrations: check columns first to avoid failing ALTER TABLE commands
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(devotionals);`);
    const columnNames = new Set(tableInfo.map((col) => col.name));
    if (!columnNames.has('application')) {
      await db.runAsync(`ALTER TABLE devotionals ADD COLUMN application TEXT NOT NULL DEFAULT '';`);
    }
    if (!columnNames.has('is_bookmarked')) {
      await db.runAsync(`ALTER TABLE devotionals ADD COLUMN is_bookmarked INTEGER NOT NULL DEFAULT 0;`);
    }
  } catch (colErr) {
    console.warn('Devotionals column check note:', colErr);
  }

  // Seed standard mood tags if empty
  try {
    await db.runAsync(`
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
  } catch (_) {}
}
