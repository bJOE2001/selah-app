import { SQLiteDatabase } from "expo-sqlite";
import { generateId } from "../utils/uuid";
import {
    Devotional,
    DevotionalDraft,
    DevotionalSummary,
} from "./types";

/**
 * Save or update a devotional entry
 */
export async function saveDevotional(
  db: SQLiteDatabase,
  draft: DevotionalDraft,
): Promise<string> {
  const id = draft.id || generateId();
  const now = new Date().toISOString();
  const isDraft = draft.isDraft ? 1 : 0;

  await db.withTransactionAsync(async () => {
    // 1. Upsert devotional
    await db.runAsync(
      `INSERT INTO devotionals (id, notes, created_at, updated_at, is_draft)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         notes = excluded.notes,
         updated_at = excluded.updated_at,
         is_draft = excluded.is_draft;`,
      [
        id,
        draft.notes,
        now,
        now,
        isDraft,
      ],
    );
  });

  return id;
}

/**
 * Get a single devotional by ID
 */
export async function getDevotionalById(
  db: SQLiteDatabase,
  id: string,
): Promise<Devotional | null> {
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM devotionals WHERE id = ?;",
    [id],
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDraft: row.is_draft === 1,
    isBookmarked: row.is_bookmarked === 1,
  };
}

/**
 * Get recent devotionals for Timeline & Calendar view
 */
export async function getRecentDevotionals(
  db: SQLiteDatabase,
  limit: number = 50,
): Promise<DevotionalSummary[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT id, notes, created_at, is_draft, is_bookmarked
     FROM devotionals
     ORDER BY created_at DESC
     LIMIT ?;`,
    [limit],
  );

  const summaries: DevotionalSummary[] = [];

  for (const r of rows) {
    // Use first line or first 100 chars as preview
    const firstLine = r.notes.split('\n')[0];
    const preview = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;

    summaries.push({
      id: r.id,
      notesPreview: preview,
      notes: r.notes,
      createdAt: r.created_at,
      isDraft: r.is_draft === 1,
      isBookmarked: r.is_bookmarked === 1,
    });
  }

  return summaries;
}

/**
 * Delete a devotional by ID
 */
export async function deleteDevotional(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM devotionals WHERE id = ?;", [id]);
  });
}

/**
 * Toggle bookmark status for a devotional
 */
export async function toggleBookmarkDevotional(
  db: SQLiteDatabase,
  id: string,
  isBookmarked: boolean,
): Promise<boolean> {
  await db.runAsync("UPDATE devotionals SET is_bookmarked = ? WHERE id = ?;", [
    isBookmarked ? 1 : 0,
    id,
  ]);
  return isBookmarked;
}

/**
 * Get total number of devotional entries
 */
export async function getDevotionalCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM devotionals;"
  );
  return row?.count ?? 0;
}
