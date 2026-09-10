import { create } from 'zustand';
import { Devotional } from './types';

export const RHEMA_DEVOTIONAL_TEMPLATE = `📖 RHEMA (Scripture)
"The LORD is my shepherd; I shall not want." — Psalm 23:1

🌿 REFLECTION (What is God saying?)
What does this verse reveal about God's heart and your current situation?

✨ MOTIVATION (Why this word today?)
What is the Holy Spirit encouraging or stirring inside your heart?

🙏 APPLICATION (Living it out)
How will you walk this truth out in action and prayer today?
`;

export interface DraftState {
  // Active editing ID (null if brand new entry)
  editingDevotionalId: string | null;

  // Single Notes field
  notes: string;

  // Form state
  isDirty: boolean;

  // Actions
  setNotes: (text: string) => void;
  applyRhemaTemplate: () => void;
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

  applyRhemaTemplate: () =>
    set({
      editingDevotionalId: null,
      notes: RHEMA_DEVOTIONAL_TEMPLATE,
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
