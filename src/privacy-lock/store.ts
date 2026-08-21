import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacyAuthState {
  isUnlocked: boolean;
  isLockEnabled: boolean;
  hasCheckedAuth: boolean;
  unlock: () => void;
  lock: () => void;
  setLockEnabled: (enabled: boolean) => void;
  setHasCheckedAuth: (checked: boolean) => void;
}

export const usePrivacyAuthStore = create<PrivacyAuthState>()(
  persist(
    (set) => ({
      isUnlocked: false,
      isLockEnabled: false,
      hasCheckedAuth: false,
      unlock: () => set({ isUnlocked: true }),
      lock: () => set({ isUnlocked: false }),
      setLockEnabled: (enabled) => set({ isLockEnabled: enabled }),
      setHasCheckedAuth: (checked) => set({ hasCheckedAuth: checked }),
    }),
    {
      name: 'shepema-privacy-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isLockEnabled: state.isLockEnabled }),
    }
  )
);
