import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDatabase } from '../bible-data/db';
import * as queries from './queries';
import { DevotionalDraft } from './types';

export function useMoodTags() {
  return useQuery({
    queryKey: ['devotional', 'mood-tags'],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.getMoodTags(db);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useRecentDevotionals(limit: number = 50) {
  return useQuery({
    queryKey: ['devotionals', 'recent', limit],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.getRecentDevotionals(db, limit);
    },
  });
}

export function useDevotional(id: string | null) {
  return useQuery({
    queryKey: ['devotional', id],
    queryFn: async () => {
      if (!id) return null;
      const db = await getUserDatabase();
      return queries.getDevotionalById(db, id);
    },
    enabled: !!id,
  });
}

export function useIncompleteTasks(limit: number = 20) {
  return useQuery({
    queryKey: ['tasks', 'incomplete', limit],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.getIncompleteTasks(db, limit);
    },
  });
}

export function useSaveDevotional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: DevotionalDraft) => {
      const db = await getUserDatabase();
      return queries.saveDevotional(db, draft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['devotional'] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const db = await getUserDatabase();
      return queries.toggleTaskCompletion(db, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
    },
  });
}

export function useDeleteDevotional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = await getUserDatabase();
      return queries.deleteDevotional(db, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useToggleBookmarkDevotional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) => {
      const db = await getUserDatabase();
      return queries.toggleBookmarkDevotional(db, id, isBookmarked);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
      queryClient.invalidateQueries({ queryKey: ['devotional'] });
    },
  });
}

