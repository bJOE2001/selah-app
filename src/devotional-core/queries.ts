import { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '../utils/uuid';
import {
  Devotional,
  DevotionalDraft,
  DevotionalSummary,
  MoodTag,
  ApplicationTask,
} from './types';

/**
 * Fetch all available mood tags
 */
export async function getMoodTags(db: SQLiteDatabase): Promise<MoodTag[]> {
  return db.getAllAsync<MoodTag>('SELECT id, value, emoji, color FROM mood_tags ORDER BY id ASC;');
}

/**
 * Save or update a devotional entry
 */
export async function saveDevotional(
  db: SQLiteDatabase,
  draft: DevotionalDraft
): Promise<string> {
  const id = draft.id || generateId();
  const now = new Date().toISOString();
  const isDraft = draft.isDraft ? 1 : 0;

  await db.withTransactionAsync(async () => {
    // 1. Upsert devotional
    await db.runAsync(
      `INSERT INTO devotionals (id, rhema_verse_id, rhema_text, rhema_reference, reflection, motivation, application, created_at, updated_at, is_draft)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         rhema_verse_id = excluded.rhema_verse_id,
         rhema_text = excluded.rhema_text,
         rhema_reference = excluded.rhema_reference,
         reflection = excluded.reflection,
         motivation = excluded.motivation,
         application = excluded.application,
         updated_at = excluded.updated_at,
         is_draft = excluded.is_draft;`,
      [
        id,
        draft.rhemaVerseId,
        draft.rhemaText,
        draft.rhemaReference,
        draft.reflection,
        draft.motivation,
        draft.application || '',
        now,
        now,
        isDraft,
      ]
    );

    // 2. Refresh mood tags
    await db.runAsync('DELETE FROM devotional_mood_tags WHERE devotional_id = ?;', [id]);
    for (const tagId of draft.moodTagIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO devotional_mood_tags (devotional_id, mood_tag_id) VALUES (?, ?);',
        [id, tagId]
      );
    }

    // 3. Refresh application tasks
    await db.runAsync('DELETE FROM application_tasks WHERE devotional_id = ?;', [id]);
    let order = 0;
    for (const task of draft.tasks) {
      if (task.text.trim().length > 0) {
        const taskId = task.id || generateId();
        const completedAt = task.isCompleted ? now : null;
        await db.runAsync(
          `INSERT INTO application_tasks (id, devotional_id, text, is_completed, sort_order, completed_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [taskId, id, task.text.trim(), task.isCompleted ? 1 : 0, order++, completedAt, now]
        );
      }
    }
  });

  return id;
}

/**
 * Get a single devotional by ID with tags and tasks
 */
export async function getDevotionalById(
  db: SQLiteDatabase,
  id: string
): Promise<Devotional | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM devotionals WHERE id = ?;',
    [id]
  );

  if (!row) {
    return null;
  }

  const tags = await db.getAllAsync<MoodTag>(
    `SELECT m.id, m.value, m.emoji, m.color
     FROM mood_tags m
     JOIN devotional_mood_tags dmt ON m.id = dmt.mood_tag_id
     WHERE dmt.devotional_id = ?;`,
    [id]
  );

  const tasksRaw = await db.getAllAsync<any>(
    'SELECT * FROM application_tasks WHERE devotional_id = ? ORDER BY sort_order ASC;',
    [id]
  );

  const tasks: ApplicationTask[] = tasksRaw.map((t) => ({
    id: t.id,
    devotionalId: t.devotional_id,
    text: t.text,
    isCompleted: t.is_completed === 1,
    sortOrder: t.sort_order,
    completedAt: t.completed_at,
    createdAt: t.created_at,
  }));

  return {
    id: row.id,
    rhemaVerseId: row.rhema_verse_id,
    rhemaText: row.rhema_text,
    rhemaReference: row.rhema_reference,
    reflection: row.reflection,
    motivation: row.motivation,
    application: row.application || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDraft: row.is_draft === 1,
    moodTags: tags,
    applicationTasks: tasks,
  };
}

/**
 * Get recent devotionals for Timeline & Calendar view
 */
export async function getRecentDevotionals(
  db: SQLiteDatabase,
  limit: number = 50
): Promise<DevotionalSummary[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT d.id, d.rhema_reference, d.rhema_text, d.reflection, d.created_at, d.is_draft,
            COUNT(t.id) as total_tasks,
            SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed_tasks
     FROM devotionals d
     LEFT JOIN application_tasks t ON d.id = t.devotional_id
     GROUP BY d.id
     ORDER BY d.created_at DESC
     LIMIT ?;`,
    [limit]
  );

  const summaries: DevotionalSummary[] = [];

  for (const r of rows) {
    const tags = await db.getAllAsync<MoodTag>(
      `SELECT m.id, m.value, m.emoji, m.color
       FROM mood_tags m
       JOIN devotional_mood_tags dmt ON m.id = dmt.mood_tag_id
       WHERE dmt.devotional_id = ?;`,
      [r.id]
    );

    summaries.push({
      id: r.id,
      rhemaReference: r.rhema_reference,
      rhemaText: r.rhema_text,
      reflectionPreview: r.reflection ? r.reflection.substring(0, 100) : '',
      createdAt: r.created_at,
      isDraft: r.is_draft === 1,
      moodTags: tags,
      totalTasks: r.total_tasks || 0,
      completedTasks: r.completed_tasks || 0,
    });
  }

  return summaries;
}

/**
 * Toggle an application task completion status
 */
export async function toggleTaskCompletion(
  db: SQLiteDatabase,
  taskId: string
): Promise<boolean> {
  const task = await db.getFirstAsync<any>(
    'SELECT is_completed FROM application_tasks WHERE id = ?;',
    [taskId]
  );

  if (!task) return false;

  const nextState = task.is_completed === 1 ? 0 : 1;
  const completedAt = nextState === 1 ? new Date().toISOString() : null;

  await db.runAsync(
    'UPDATE application_tasks SET is_completed = ?, completed_at = ? WHERE id = ?;',
    [nextState, completedAt, taskId]
  );

  return nextState === 1;
}

/**
 * Get all active/incomplete application tasks across recent devotionals
 */
export async function getIncompleteTasks(
  db: SQLiteDatabase,
  limit: number = 20
): Promise<ApplicationTask[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT t.id, t.devotional_id, t.text, t.is_completed, t.sort_order, t.completed_at, t.created_at
     FROM application_tasks t
     JOIN devotionals d ON t.devotional_id = d.id
     WHERE t.is_completed = 0 AND d.is_draft = 0
     ORDER BY t.created_at DESC
     LIMIT ?;`,
    [limit]
  );

  return rows.map((t) => ({
    id: t.id,
    devotionalId: t.devotional_id,
    text: t.text,
    isCompleted: false,
    sortOrder: t.sort_order,
    completedAt: null,
    createdAt: t.created_at,
  }));
}

/**
 * Delete a devotional by ID
 */
export async function deleteDevotional(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM devotionals WHERE id = ?;', [id]);
}
