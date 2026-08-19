import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { Devotional } from './types';

export interface ApplicationTaskDraft {
  tempId: string;
  text: string;
  isCompleted: boolean;
}

export interface DraftState {
  // Active editing ID (null if brand new entry)
  editingDevotionalId: string | null;

  // 1. Rhema
  rhemaVerseId: number | null;
  rhemaText: string;
  rhemaReference: string;

  // 2. Reflection
  reflection: string;

  // 3. Motivation
  motivation: string;
  selectedMoodTagIds: number[];

  // 4. Application
  application: string;
  applicationTasks: ApplicationTaskDraft[];

  // Form state
  isDirty: boolean;

  // Actions
  setRhema: (verseId: number, text: string, reference: string) => void;
  setReflection: (text: string) => void;
  setMotivation: (text: string) => void;
  setApplication: (text: string) => void;
  toggleMoodTag: (tagId: number) => void;
  addTask: (text?: string) => void;
  updateTask: (tempId: string, text: string) => void;
  toggleTask: (tempId: string) => void;
  removeTask: (tempId: string) => void;
  loadFromExisting: (devotional: Devotional) => void;
  reset: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  editingDevotionalId: null,
  rhemaVerseId: null,
  rhemaText: '',
  rhemaReference: '',
  reflection: '',
  motivation: '',
  selectedMoodTagIds: [],
  application: '',
  applicationTasks: [{ tempId: generateId(), text: '', isCompleted: false }],
  isDirty: false,

  setRhema: (verseId, text, reference) =>
    set({
      rhemaVerseId: verseId,
      rhemaText: text,
      rhemaReference: reference,
      isDirty: true,
    }),

  setReflection: (text) =>
    set({
      reflection: text,
      isDirty: true,
    }),

  setMotivation: (text) =>
    set({
      motivation: text,
      isDirty: true,
    }),

  setApplication: (text) =>
    set({
      application: text,
      isDirty: true,
    }),

  toggleMoodTag: (tagId) =>
    set((state) => ({
      selectedMoodTagIds: state.selectedMoodTagIds.includes(tagId)
        ? state.selectedMoodTagIds.filter((id) => id !== tagId)
        : [...state.selectedMoodTagIds, tagId],
      isDirty: true,
    })),

  addTask: (text = '') =>
    set((state) => ({
      applicationTasks: [
        ...state.applicationTasks,
        { tempId: generateId(), text, isCompleted: false },
      ],
      isDirty: true,
    })),

  updateTask: (tempId, text) =>
    set((state) => ({
      applicationTasks: state.applicationTasks.map((t) =>
        t.tempId === tempId ? { ...t, text } : t
      ),
      isDirty: true,
    })),

  toggleTask: (tempId) =>
    set((state) => ({
      applicationTasks: state.applicationTasks.map((t) =>
        t.tempId === tempId ? { ...t, isCompleted: !t.isCompleted } : t
      ),
      isDirty: true,
    })),

  removeTask: (tempId) =>
    set((state) => ({
      applicationTasks: state.applicationTasks.filter((t) => t.tempId !== tempId),
      isDirty: true,
    })),

  loadFromExisting: (devotional) =>
    set({
      editingDevotionalId: devotional.id,
      rhemaVerseId: devotional.rhemaVerseId,
      rhemaText: devotional.rhemaText,
      rhemaReference: devotional.rhemaReference,
      reflection: devotional.reflection,
      motivation: devotional.motivation,
      application: devotional.application || '',
      selectedMoodTagIds: devotional.moodTags.map((t) => t.id),
      applicationTasks:
        devotional.applicationTasks.length > 0
          ? devotional.applicationTasks.map((t) => ({
              tempId: t.id,
              text: t.text,
              isCompleted: t.isCompleted,
            }))
          : [{ tempId: generateId(), text: '', isCompleted: false }],
      isDirty: false,
    }),

  reset: () =>
    set({
      editingDevotionalId: null,
      rhemaVerseId: null,
      rhemaText: '',
      rhemaReference: '',
      reflection: '',
      motivation: '',
      selectedMoodTagIds: [],
      application: '',
      applicationTasks: [{ tempId: generateId(), text: '', isCompleted: false }],
      isDirty: false,
    }),
}));
