import { create } from 'zustand';
import { BibleTranslation, BIBLE_TRANSLATIONS } from './translations';
import {
  DownloadedTranslationInfo,
  getDownloadedTranslationsFromDb,
  downloadTranslation as executeDownload,
  deleteDownloadedTranslation as executeDelete,
  formatBytes,
} from './downloadManager';

export interface DownloadProgressState {
  progress: number;
  statusText: string;
  isDownloading: boolean;
  error?: string;
}

interface DownloadStoreState {
  downloadedTranslations: Record<string, DownloadedTranslationInfo>;
  isInitialized: boolean;
  activeDownloads: Record<string, DownloadProgressState>;

  initDownloads: () => Promise<void>;
  download: (translation: BibleTranslation) => Promise<DownloadedTranslationInfo | null>;
  deleteDownload: (translationId: string) => Promise<void>;
  isDownloaded: (translationId: string) => boolean;
  getTotalStorageBytes: () => number;
  getTotalStorageFormatted: () => string;
}

export const useDownloadStore = create<DownloadStoreState>((set, get) => ({
  downloadedTranslations: {},
  isInitialized: false,
  activeDownloads: {},

  initDownloads: async () => {
    try {
      const list = await getDownloadedTranslationsFromDb();
      const validIds = new Set(BIBLE_TRANSLATIONS.map((t) => t.id.toLowerCase()));
      const map: Record<string, DownloadedTranslationInfo> = {};

      for (const item of list) {
        const normId = item.id.toLowerCase();
        if (!validIds.has(normId)) {
          // Silently purge deprecated/removed translation to free device storage
          executeDelete(normId).catch((e) =>
            console.warn('Purge failed for deprecated translation', normId, e)
          );
        } else {
          map[normId] = item;
        }
      }

      set({ downloadedTranslations: map, isInitialized: true });
    } catch (err) {
      console.warn('Failed to init downloaded translations:', err);
      set({ isInitialized: true });
    }
  },

  download: async (translation: BibleTranslation) => {
    const id = translation.id.toLowerCase();
    if (id === 'kjv') return null; // KJV is bundled offline

    set((state) => ({
      activeDownloads: {
        ...state.activeDownloads,
        [id]: {
          progress: 5,
          statusText: 'Starting download...',
          isDownloading: true,
        },
      },
    }));

    try {
      const result = await executeDownload(translation, (percent, statusText) => {
        set((state) => ({
          activeDownloads: {
            ...state.activeDownloads,
            [id]: {
              progress: percent,
              statusText: statusText,
              isDownloading: true,
            },
          },
        }));
      });

      set((state) => {
        const nextActive = { ...state.activeDownloads };
        delete nextActive[id];

        return {
          downloadedTranslations: {
            ...state.downloadedTranslations,
            [id]: result,
          },
          activeDownloads: nextActive,
        };
      });

      return result;
    } catch (err: any) {
      const errorMsg = err?.message || 'Download failed. Please try again.';
      set((state) => ({
        activeDownloads: {
          ...state.activeDownloads,
          [id]: {
            progress: 0,
            statusText: errorMsg,
            isDownloading: false,
            error: errorMsg,
          },
        },
      }));
      throw err;
    }
  },

  deleteDownload: async (translationId: string) => {
    const id = translationId.toLowerCase();
    if (id === 'kjv') return;

    try {
      await executeDelete(id);
      set((state) => {
        const next = { ...state.downloadedTranslations };
        delete next[id];
        return { downloadedTranslations: next };
      });
    } catch (err) {
      console.warn(`Error deleting translation ${id}:`, err);
      throw err;
    }
  },

  isDownloaded: (translationId: string) => {
    const id = (translationId || 'kjv').toLowerCase();
    if (id === 'kjv') return true;
    return Boolean(get().downloadedTranslations[id]);
  },

  getTotalStorageBytes: () => {
    const translations = Object.values(get().downloadedTranslations);
    return translations.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  },

  getTotalStorageFormatted: () => {
    return formatBytes(get().getTotalStorageBytes());
  },
}));
