import { useState, useEffect, useCallback } from 'react';
import { SQLiteDatabase } from 'expo-sqlite';
import { getUserDatabase } from './db';
import { generateId } from '../utils/uuid';

export interface VerseHighlight {
  id: string;
  verseId: number;
  color: string;
  createdAt: string;
}

export const HIGHLIGHT_COLORS = [
  {
    id: 'yellow',
    name: 'Gold',
    dot: '#EAB308',
    bg: '#FEF9C3',
    darkBg: 'rgba(234, 179, 8, 0.22)',
    border: '#FDE047',
    darkBorder: 'rgba(234, 179, 8, 0.40)',
  },
  {
    id: 'green',
    name: 'Sage',
    dot: '#22C55E',
    bg: '#DCFCE7',
    darkBg: 'rgba(34, 197, 94, 0.20)',
    border: '#86EFAC',
    darkBorder: 'rgba(34, 197, 94, 0.40)',
  },
  {
    id: 'blue',
    name: 'Sky',
    dot: '#0EA5E9',
    bg: '#E0F2FE',
    darkBg: 'rgba(14, 165, 233, 0.20)',
    border: '#7DD3FC',
    darkBorder: 'rgba(14, 165, 233, 0.40)',
  },
  {
    id: 'purple',
    name: 'Lilac',
    dot: '#A855F7',
    bg: '#F3E8FF',
    darkBg: 'rgba(168, 85, 247, 0.22)',
    border: '#D8B4FE',
    darkBorder: 'rgba(168, 85, 247, 0.40)',
  },
  {
    id: 'rose',
    name: 'Rose',
    dot: '#F43F5E',
    bg: '#FFE4E6',
    darkBg: 'rgba(244, 63, 94, 0.22)',
    border: '#FDA4AF',
    darkBorder: 'rgba(244, 63, 94, 0.40)',
  },
] as const;

export type HighlightColorId = typeof HIGHLIGHT_COLORS[number]['id'];

export function getHighlightStyle(colorId?: string | null) {
  return HIGHLIGHT_COLORS.find((c) => c.id === colorId) || null;
}

/**
 * Fetch highlights for a list of verse IDs
 */
export async function getHighlightsForVerses(
  db: SQLiteDatabase,
  verseIds: number[]
): Promise<Record<number, string>> {
  if (verseIds.length === 0) return {};
  
  const placeholders = verseIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ verse_id: number; color: string }>(
    `SELECT verse_id, color FROM verse_highlights WHERE verse_id IN (${placeholders})`,
    verseIds
  );

  const map: Record<number, string> = {};
  rows.forEach((r) => {
    map[r.verse_id] = r.color;
  });
  return map;
}

/**
 * Set highlight for multiple verses
 */
export async function setHighlights(
  db: SQLiteDatabase,
  verseIds: number[],
  color: string
): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const verseId of verseIds) {
      const id = generateId();
      await db.runAsync(
        `INSERT INTO verse_highlights (id, verse_id, color, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(verse_id) DO UPDATE SET color = excluded.color, created_at = excluded.created_at;`,
        [id, verseId, color, now]
      );
    }
  });
}

/**
 * Remove highlights for multiple verses
 */
export async function removeHighlights(
  db: SQLiteDatabase,
  verseIds: number[]
): Promise<void> {
  if (verseIds.length === 0) return;
  const placeholders = verseIds.map(() => '?').join(',');
  await db.runAsync(
    `DELETE FROM verse_highlights WHERE verse_id IN (${placeholders})`,
    verseIds
  );
}

/**
 * React hook to manage chapter highlights
 */
export function useChapterHighlights(verseIds: number[]) {
  const [highlights, setHighlightsMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadHighlights = useCallback(async () => {
    if (verseIds.length === 0) {
      setHighlightsMap({});
      setIsLoading(false);
      return;
    }
    try {
      const db = await getUserDatabase();
      const map = await getHighlightsForVerses(db, verseIds);
      setHighlightsMap(map);
    } catch (err) {
      console.warn('Failed to load verse highlights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [verseIds]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  const applyHighlight = async (targetVerseIds: number[], colorId: string) => {
    // Optimistic update
    setHighlightsMap((prev) => {
      const updated = { ...prev };
      targetVerseIds.forEach((id) => {
        updated[id] = colorId;
      });
      return updated;
    });

    try {
      const db = await getUserDatabase();
      await setHighlights(db, targetVerseIds, colorId);
    } catch (err) {
      console.warn('Failed to save highlight:', err);
      loadHighlights();
    }
  };

  const clearHighlight = async (targetVerseIds: number[]) => {
    // Optimistic update
    setHighlightsMap((prev) => {
      const updated = { ...prev };
      targetVerseIds.forEach((id) => {
        delete updated[id];
      });
      return updated;
    });

    try {
      const db = await getUserDatabase();
      await removeHighlights(db, targetVerseIds);
    } catch (err) {
      console.warn('Failed to remove highlight:', err);
      loadHighlights();
    }
  };

  return {
    highlights,
    isLoading,
    applyHighlight,
    clearHighlight,
  };
}
