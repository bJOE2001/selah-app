import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CloudUser {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  provider?: string;
}

interface CloudAuthState {
  user: CloudUser | null;
  lastSyncTime: string | null;
  isSyncing: boolean;
  syncError: string | null;

  setUser: (user: CloudUser | null) => void;
  setLastSyncTime: (isoDate: string | null) => void;
  setIsSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  signOut: () => void;
}

export const useCloudAuthStore = create<CloudAuthState>()(
  persist(
    (set) => ({
      user: null,
      lastSyncTime: null,
      isSyncing: false,
      syncError: null,

      setUser: (user) => set({ user, syncError: null }),
      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setSyncError: (syncError) => set({ syncError }),
      signOut: () => set({ user: null, lastSyncTime: null, syncError: null }),
    }),
    {
      name: 'selah-cloud-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
