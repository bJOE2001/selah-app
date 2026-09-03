export interface Devotional {
  id: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  isBookmarked: boolean;
}

export interface DevotionalSummary {
  id: string;
  notesPreview: string;
  notes?: string;
  createdAt: string;
  isDraft: boolean;
  isBookmarked: boolean;
}

export interface DevotionalDraft {
  id?: string;
  notes: string;
  isDraft?: boolean;
}
