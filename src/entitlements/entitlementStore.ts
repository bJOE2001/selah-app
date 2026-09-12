import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EntitlementInfo,
  DEFAULT_ENTITLEMENT,
  SubscriptionTier,
  PremiumFeature,
} from './types';
import { canUseFeature } from './featureGates';

/**
 * Entitlement Store
 *
 * Single source of truth for whether the current user has unlocked Selah Grace.
 * Persisted in AsyncStorage to ensure offline UI continuity when launching without network.
 *
 * In production builds, the authoritative state is derived strictly from RevenueCat.
 * The `devOverride` is guarded by `__DEV__` and cannot unlock features in production.
 */

interface EntitlementState {
  /** Current entitlement info */
  entitlement: EntitlementInfo;

  /** Loading state during purchase or restore network operations */
  isLoading: boolean;

  /** ISO date string of last verified check with RevenueCat */
  lastCheckedAt: string | null;

  /** Development-only override for local testing (__DEV__ only) */
  devOverride: boolean;

  /** Computed: whether the user has Selah Grace unlocked */
  isSelahGrace: () => boolean;

  /** Computed: whether the user has access to a specific premium feature */
  canUseFeature: (feature: PremiumFeature) => boolean;

  /** Computed: current active tier */
  currentTier: () => SubscriptionTier;

  /** Set verified entitlement from RevenueCat */
  setEntitlement: (info: EntitlementInfo) => void;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Set last checked timestamp */
  setLastCheckedAt: (timestamp: string) => void;

  /** Reset to free tier */
  clearEntitlement: () => void;

  /** Toggle dev override (only effective in __DEV__ mode) */
  setDevOverride: (enabled: boolean) => void;
}

export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set, get) => ({
      entitlement: DEFAULT_ENTITLEMENT,
      isLoading: false,
      lastCheckedAt: null,
      devOverride: false,

      isSelahGrace: () => {
        const state = get();
        // Production builds always derive authority from RevenueCat
        if (__DEV__ && state.devOverride) return true;
        return state.entitlement.isSelahGrace;
      },

      canUseFeature: (feature: PremiumFeature) => {
        const state = get();
        const isGrace = state.isSelahGrace();
        return canUseFeature(feature, isGrace);
      },

      currentTier: () => {
        const state = get();
        if (__DEV__ && state.devOverride) return 'selah_grace';
        return state.entitlement.tier;
      },

      setEntitlement: (info: EntitlementInfo) => {
        set({
          entitlement: info,
          lastCheckedAt: new Date().toISOString(),
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setLastCheckedAt: (timestamp: string) => {
        set({ lastCheckedAt: timestamp });
      },

      clearEntitlement: () => {
        set({
          entitlement: DEFAULT_ENTITLEMENT,
          lastCheckedAt: new Date().toISOString(),
        });
      },

      setDevOverride: (enabled: boolean) => {
        if (__DEV__) {
          set({ devOverride: enabled });
        }
      },
    }),
    {
      name: 'selah-grace-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entitlement: state.entitlement,
        lastCheckedAt: state.lastCheckedAt,
        // Only persist devOverride in dev mode
        devOverride: __DEV__ ? state.devOverride : false,
      }),
    }
  )
);
