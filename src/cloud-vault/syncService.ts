import { getDatabase } from '../bible-data/db';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useCloudAuthStore } from './authStore';
import { deriveUserVaultKey, encryptText, decryptText } from './encryption';

/**
 * Journal Cloud Sync Service
 *
 * Handles bidirectional encrypted synchronization between local SQLite (devotion.db)
 * and Supabase Cloud Vault.
 */

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  error?: string;
}

/**
 * Upload local journal entries to Supabase (Zero-Knowledge Encrypted)
 */
export async function syncToCloud(): Promise<SyncResult> {
  const user = useCloudAuthStore.getState().user;
  if (!user) {
    return { success: false, syncedCount: 0, error: 'User is not signed in to Cloud Vault.' };
  }

  if (!isSupabaseConfigured()) {
    // If Supabase credentials are placeholder in development, simulate sync
    if (__DEV__) {
      const now = new Date().toISOString();
      useCloudAuthStore.getState().setLastSyncTime(now);
      return { success: true, syncedCount: 1 };
    }
    return { success: false, syncedCount: 0, error: 'Supabase credentials are not configured.' };
  }

  useCloudAuthStore.getState().setIsSyncing(true);
  useCloudAuthStore.getState().setSyncError(null);

  try {
    const vaultKey = deriveUserVaultKey(user.id);
    const db = await getDatabase();

    // 1. Fetch all local devotionals
    const localDevotionals = await db.getAllAsync<any>(
      'SELECT * FROM devotionals ORDER BY created_at ASC;'
    );

    if (!localDevotionals || localDevotionals.length === 0) {
      useCloudAuthStore.getState().setLastSyncTime(new Date().toISOString());
      useCloudAuthStore.getState().setIsSyncing(false);
      return { success: true, syncedCount: 0 };
    }

    // 2. Fetch associated tasks & mood tags
    const allTasks = await db.getAllAsync<any>('SELECT * FROM application_tasks;');
    const allMoodTags = await db.getAllAsync<any>('SELECT * FROM devotional_mood_tags;');

    // 3. Encrypt and map rows
    const rowsToUpsert = localDevotionals.map((item) => {
      const itemTasks = (allTasks || []).filter((t) => t.devotional_id === item.id);
      const itemMoods = (allMoodTags || [])
        .filter((m) => m.devotional_id === item.id)
        .map((m) => m.mood_tag_id);

      const metadataPayload = JSON.stringify({
        tasks: itemTasks,
        moodTagIds: itemMoods,
      });

      return {
        id: item.id,
        user_id: user.id,
        rhema_verse_id: item.rhema_verse_id || 0,
        rhema_reference: item.rhema_reference || '',
        encrypted_rhema_text: encryptText(item.rhema_text || '', vaultKey),
        encrypted_reflection: encryptText(item.reflection || '', vaultKey),
        encrypted_motivation: encryptText(item.motivation || '', vaultKey),
        encrypted_application: encryptText(item.application || '', vaultKey),
        encrypted_metadata: encryptText(metadataPayload, vaultKey),
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_draft: item.is_draft || 0,
        is_bookmarked: item.is_bookmarked || 0,
      };
    });

    // 4. Batch upsert to Supabase
    const { error } = await supabase
      .from('user_devotionals')
      .upsert(rowsToUpsert, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    const now = new Date().toISOString();
    useCloudAuthStore.getState().setLastSyncTime(now);
    return { success: true, syncedCount: rowsToUpsert.length };
  } catch (err: any) {
    const msg = err?.message || 'Failed to sync with Cloud Vault.';
    useCloudAuthStore.getState().setSyncError(msg);
    return { success: false, syncedCount: 0, error: msg };
  } finally {
    useCloudAuthStore.getState().setIsSyncing(false);
  }
}

/**
 * Restore entries from Supabase to local SQLite (Decrypted on-device)
 */
export async function restoreFromCloud(): Promise<SyncResult> {
  const user = useCloudAuthStore.getState().user;
  if (!user) {
    return { success: false, syncedCount: 0, error: 'User is not signed in to Cloud Vault.' };
  }

  if (!isSupabaseConfigured()) {
    if (__DEV__) {
      return { success: true, syncedCount: 0 };
    }
    return { success: false, syncedCount: 0, error: 'Supabase credentials are not configured.' };
  }

  useCloudAuthStore.getState().setIsSyncing(true);
  useCloudAuthStore.getState().setSyncError(null);

  try {
    const vaultKey = deriveUserVaultKey(user.id);
    const db = await getDatabase();

    // 1. Download encrypted rows
    const { data: remoteRows, error } = await supabase
      .from('user_devotionals')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    if (!remoteRows || remoteRows.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    // 2. Decrypt and insert into local SQLite
    await db.withTransactionAsync(async () => {
      for (const row of remoteRows) {
        const decryptedRhemaText = decryptText(row.encrypted_rhema_text || '', vaultKey);
        const decryptedReflection = decryptText(row.encrypted_reflection || '', vaultKey);
        const decryptedMotivation = decryptText(row.encrypted_motivation || '', vaultKey);
        const decryptedApplication = decryptText(row.encrypted_application || '', vaultKey);

        // Upsert devotional
        await db.runAsync(
          `INSERT INTO devotionals (id, rhema_verse_id, rhema_text, rhema_reference, reflection, motivation, application, created_at, updated_at, is_draft, is_bookmarked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             rhema_verse_id = excluded.rhema_verse_id,
             rhema_text = excluded.rhema_text,
             rhema_reference = excluded.rhema_reference,
             reflection = excluded.reflection,
             motivation = excluded.motivation,
             application = excluded.application,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at,
             is_draft = excluded.is_draft,
             is_bookmarked = excluded.is_bookmarked;`,
          [
            row.id,
            row.rhema_verse_id,
            decryptedRhemaText,
            row.rhema_reference,
            decryptedReflection,
            decryptedMotivation,
            decryptedApplication,
            row.created_at,
            row.updated_at,
            row.is_draft ?? 0,
            row.is_bookmarked ?? 0,
          ]
        );

        // Decrypt metadata for tasks & mood tags
        if (row.encrypted_metadata) {
          try {
            const metaJson = decryptText(row.encrypted_metadata, vaultKey);
            if (metaJson) {
              const meta = JSON.parse(metaJson);

              // Restore mood tags
              if (Array.isArray(meta.moodTagIds)) {
                await db.runAsync('DELETE FROM devotional_mood_tags WHERE devotional_id = ?;', [row.id]);
                for (const tagId of meta.moodTagIds) {
                  await db.runAsync(
                    'INSERT OR IGNORE INTO devotional_mood_tags (devotional_id, mood_tag_id) VALUES (?, ?);',
                    [row.id, tagId]
                  );
                }
              }

              // Restore tasks
              if (Array.isArray(meta.tasks)) {
                await db.runAsync('DELETE FROM application_tasks WHERE devotional_id = ?;', [row.id]);
                for (const task of meta.tasks) {
                  await db.runAsync(
                    'INSERT OR IGNORE INTO application_tasks (id, devotional_id, text, is_completed, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?);',
                    [
                      task.id,
                      row.id,
                      task.text,
                      task.is_completed ? 1 : 0,
                      task.sort_order || 0,
                      task.created_at || new Date().toISOString(),
                    ]
                  );
                }
              }
            }
          } catch (metaErr) {
            console.warn('[Sync] Metadata restore notice:', metaErr);
          }
        }
      }
    });

    const now = new Date().toISOString();
    useCloudAuthStore.getState().setLastSyncTime(now);
    return { success: true, syncedCount: remoteRows.length };
  } catch (err: any) {
    const msg = err?.message || 'Failed to restore from Cloud Vault.';
    useCloudAuthStore.getState().setSyncError(msg);
    return { success: false, syncedCount: 0, error: msg };
  } finally {
    useCloudAuthStore.getState().setIsSyncing(false);
  }
}
