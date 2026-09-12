import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getUserDatabase } from '../bible-data/db';
import { generateId } from '../utils/uuid';

export interface BackupDevotionalEntry {
  id: string;
  notes: string;
  created_at: string;
  updated_at: string;
  is_draft: number;
  is_bookmarked: number;
}

export interface SelahJournalBackup {
  format: 'selah-journal';
  version: number;
  exported_at: string;
  app: string;
  entries: BackupDevotionalEntry[];
}

export interface ImportResult {
  canceled?: boolean;
  success: boolean;
  imported: number;
  skipped: number;
  duplicates: number;
  errors: number;
  message: string;
}

export interface ExportResult {
  canceled?: boolean;
  success: boolean;
  count: number;
  filePath?: string;
  message?: string;
}

/**
 * Exports all local devotional entries from devotion_v2.db to a versioned JSON file
 * and invokes the native OS sharing sheet.
 */
export async function exportJournalToJson(): Promise<ExportResult> {
  try {
    const db = await getUserDatabase();

    // Query all devotionals preserving the exact SQLite schema columns
    const rows = await db.getAllAsync<BackupDevotionalEntry>(
      `SELECT id, notes, created_at, updated_at, is_draft, is_bookmarked
       FROM devotionals
       ORDER BY created_at ASC;`
    );

    const backupData: SelahJournalBackup = {
      format: 'selah-journal',
      version: 1,
      exported_at: new Date().toISOString(),
      app: 'Selah: Bible & Devotional',
      entries: rows.map((r) => ({
        id: r.id,
        notes: r.notes || '',
        created_at: r.created_at,
        updated_at: r.updated_at || r.created_at,
        is_draft: r.is_draft ?? 0,
        is_bookmarked: r.is_bookmarked ?? 0,
      })),
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    // Write backup file to cache directory
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `selah-journal-backup-${dateStamp}.json`;
    const targetPath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(targetPath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return {
        success: true,
        count: rows.length,
        filePath: targetPath,
        message: `Backup written to ${fileName}, but system sharing is not available on this device.`,
      };
    }

    await Sharing.shareAsync(targetPath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Selah Journal Backup',
      UTI: 'public.json',
    });

    return {
      success: true,
      count: rows.length,
      filePath: targetPath,
      message: `Exported ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      count: 0,
      message: error?.message || 'Failed to export journal.',
    };
  }
}

/**
 * Validates and parses raw backup text.
 * Throws friendly descriptive error strings if validation fails.
 */
export function validateBackupContent(rawJson: string): SelahJournalBackup {
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file structure.');
  }

  if (parsed.format !== 'selah-journal') {
    throw new Error('Unrecognized backup format. Expected a Selah journal backup file.');
  }

  if (typeof parsed.version !== 'number' || parsed.version > 1 || parsed.version < 1) {
    throw new Error(`Unsupported backup format version (${parsed.version}).`);
  }

  if (!Array.isArray(parsed.entries)) {
    throw new Error('Backup does not contain a valid list of entries.');
  }

  return parsed as SelahJournalBackup;
}

/**
 * Imports journal entries from a user-selected JSON file.
 * Non-destructive transactional merge with two-priority duplicate prevention:
 * Priority 1: Existing ID in database -> Skip
 * Priority 2: Matching (created_at + '|||' + notes.trim()) fingerprint -> Skip
 * Existing database records are never modified or overwritten.
 */
export async function importJournalFromJson(): Promise<ImportResult> {
  try {
    const pickResult = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (pickResult.canceled || !pickResult.assets || pickResult.assets.length === 0) {
      return {
        canceled: true,
        success: false,
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
        message: 'Import canceled.',
      };
    }

    const fileAsset = pickResult.assets[0];
    const rawContent = await FileSystem.readAsStringAsync(fileAsset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const backup = validateBackupContent(rawContent);
    const db = await getUserDatabase();

    let imported = 0;
    let duplicates = 0;
    let errors = 0;
    let skipped = 0;

    await db.withTransactionAsync(async () => {
      // 1. Collect all existing IDs
      const existingIdRows = await db.getAllAsync<{ id: string }>('SELECT id FROM devotionals;');
      const existingIds = new Set<string>(existingIdRows.map((r) => r.id));

      // 2. Collect all existing fingerprints (created_at + '|||' + notes.trim())
      const existingFpRows = await db.getAllAsync<{ created_at: string; notes: string }>(
        'SELECT created_at, notes FROM devotionals;'
      );
      const existingFingerprints = new Set<string>(
        existingFpRows.map((r) => `${r.created_at || ''}|||${(r.notes || '').trim()}`)
      );

      for (const entry of backup.entries) {
        // Validate minimal required structure
        if (!entry || typeof entry !== 'object') {
          errors++;
          continue;
        }

        const notes = typeof entry.notes === 'string' ? entry.notes : '';
        const createdAt =
          typeof entry.created_at === 'string' && entry.created_at.length > 0
            ? entry.created_at
            : new Date().toISOString();
        const updatedAt =
          typeof entry.updated_at === 'string' && entry.updated_at.length > 0
            ? entry.updated_at
            : createdAt;
        const isDraft = entry.is_draft === 1 ? 1 : 0;
        const isBookmarked = entry.is_bookmarked === 1 ? 1 : 0;
        const id =
          typeof entry.id === 'string' && entry.id.trim().length > 0
            ? entry.id.trim()
            : generateId();

        // Priority 1 Duplicate Check: Stable UUID / ID
        if (existingIds.has(id)) {
          duplicates++;
          skipped++;
          continue;
        }

        // Priority 2 Duplicate Check: Deterministic content fingerprint
        const fingerprint = `${createdAt}|||${notes.trim()}`;
        if (existingFingerprints.has(fingerprint)) {
          duplicates++;
          skipped++;
          continue;
        }

        // Insert non-destructive record
        await db.runAsync(
          `INSERT INTO devotionals (id, notes, created_at, updated_at, is_draft, is_bookmarked)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [id, notes, createdAt, updatedAt, isDraft, isBookmarked]
        );

        // Register in sets to prevent intra-backup duplicate insertion
        existingIds.add(id);
        existingFingerprints.add(fingerprint);
        imported++;
      }
    });

    const summaryParts: string[] = [];
    if (imported > 0) summaryParts.push(`${imported} restored`);
    if (duplicates > 0) summaryParts.push(`${duplicates} duplicates skipped`);
    if (errors > 0) summaryParts.push(`${errors} invalid entries ignored`);

    const summaryMessage =
      summaryParts.length > 0
        ? summaryParts.join(', ')
        : 'Backup file contained no new entries.';

    return {
      success: true,
      imported,
      skipped,
      duplicates,
      errors,
      message: summaryMessage,
    };
  } catch (error: any) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: 1,
      message: error?.message || 'Failed to import backup.',
    };
  }
}
