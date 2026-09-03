import { getUserDatabase } from '../bible-data/db';
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
    const db = await getUserDatabase();

    // 1. Fetch all local devotionals
    const localDevotionals = await db.getAllAsync<any>(
      'SELECT * FROM devotionals ORDER BY created_at ASC;'
    );

    if (!localDevotionals || localDevotionals.length === 0) {
      useCloudAuthStore.getState().setLastSyncTime(new Date().toISOString());
      useCloudAuthStore.getState().setIsSyncing(false);
      return { success: true, syncedCount: 0 };
    }

    // 2. Encrypt and map rows
    const rowsToUpsert = localDevotionals.map((item) => {
      return {
        id: item.id,
        user_id: user.id,
        encrypted_notes: encryptText(item.notes || '', vaultKey),
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_draft: item.is_draft || 0,
        is_bookmarked: item.is_bookmarked || 0,
      };
    });

    // 3. Batch upsert to Supabase
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
    const db = await getUserDatabase();

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
        const decryptedNotes = decryptText(row.encrypted_notes || '', vaultKey);

        // Upsert devotional
        await db.runAsync(
          `INSERT INTO devotionals (id, notes, created_at, updated_at, is_draft, is_bookmarked)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             notes = excluded.notes,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at,
             is_draft = excluded.is_draft,
             is_bookmarked = excluded.is_bookmarked;`,
          [
            row.id,
            decryptedNotes,
            row.created_at,
            row.updated_at,
            row.is_draft ?? 0,
            row.is_bookmarked ?? 0,
          ]
        );
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
