import { create } from 'zustand';
import { Devotional } from './types';

export interface DraftState {
  // Active editing ID (null if brand new entry)
  editingDevotionalId: string | null;

  // Single Notes field
  notes: string;

  // Form state
  isDirty: boolean;

  // Actions
  setNotes: (text: string) => void;
  loadFromExisting: (devotional: Devotional) => void;
  reset: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  editingDevotionalId: null,
  notes: '',
  isDirty: false,

  setNotes: (text) =>
    set({
      notes: text,
      isDirty: true,
    }),

  loadFromExisting: (devotional) =>
    set({
      editingDevotionalId: devotional.id,
      notes: devotional.notes,
      isDirty: false,
    }),

  reset: () =>
    set({
      editingDevotionalId: null,
      notes: '',
      isDirty: false,
    }),
}));
