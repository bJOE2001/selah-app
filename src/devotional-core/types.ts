export interface MoodTag {
  id: number;
  value: string;
  emoji: string;
  color: string;
}

export interface ApplicationTask {
  id: string;
  devotionalId: string;
  text: string;
  isCompleted: boolean;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
}

export interface Devotional {
  id: string;
  rhemaVerseId: number;
  rhemaText: string;
  rhemaReference: string;
  reflection: string;
  motivation: string;
  application: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  isBookmarked: boolean;
  moodTags: MoodTag[];
  applicationTasks: ApplicationTask[];
}

export interface DevotionalSummary {
  id: string;
  rhemaReference: string;
  rhemaText: string;
  reflection: string;
  motivation: string;
  application: string;
  reflectionPreview: string;
  createdAt: string;
  isDraft: boolean;
  isBookmarked: boolean;
  moodTags: MoodTag[];
  totalTasks: number;
  completedTasks: number;
}

export interface DevotionalDraft {
  id?: string;
  rhemaVerseId: number;
  rhemaText: string;
  rhemaReference: string;
  reflection: string;
  motivation: string;
  application: string;
  moodTagIds: number[];
  tasks: {
    id?: string;
    text: string;
    isCompleted: boolean;
  }[];
  isDraft?: boolean;
}
