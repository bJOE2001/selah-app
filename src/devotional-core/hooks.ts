import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDatabase } from '../bible-data/db';
import * as queries from './queries';
import { DevotionalDraft, DevotionalSummary } from './types';

export const DEFAULT_DEVOTIONAL_LIMIT = 100;

export function useRecentDevotionals(limit: number = DEFAULT_DEVOTIONAL_LIMIT) {
  return useQuery({
    queryKey: ['devotionals', 'recent', limit],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.getRecentDevotionals(db, limit);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: ['devotional'] });
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
    onSuccess: async (_, deletedId) => {
      // Synchronously remove deleted entry from all active cached lists
      queryClient.setQueriesData<DevotionalSummary[]>(
        { queryKey: ['devotionals'] },
        (old) => (old ? old.filter((item) => item.id !== deletedId) : [])
      );
      await queryClient.invalidateQueries({ queryKey: ['devotionals'] });
      await queryClient.invalidateQueries({ queryKey: ['devotional'] });
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

export function useDevotionalCount() {
  return useQuery({
    queryKey: ['devotionals', 'count'],
    queryFn: async () => {
      const db = await getUserDatabase();
      return queries.getDevotionalCount(db);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
