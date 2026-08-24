import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EntitlementInfo,
  DEFAULT_ENTITLEMENT,
  PremiumFeature,
  SubscriptionTier,
  TIER_FEATURES,
  EntitlementSource,
} from './types';

/**
 * Entitlement Store
 *
 * Single source of truth for whether the current user has premium access.
 * All feature-gating across the app reads from this store.
 *
 * The store is hydrated from:
 * - RevenueCat listener (live purchases & restores)
 * - AsyncStorage persistence (survives cold starts)
 * - Dev override toggle (__DEV__ mode only)
 */

interface EntitlementState {
  /** Current entitlement info */
  entitlement: EntitlementInfo;

  /** Dev-only override — when true, forces isPremium = true regardless of RevenueCat */
  devOverride: boolean;

  /** Computed: is the user premium (accounts for devOverride) */
  isPremium: () => boolean;

  /** Computed: does the user have access to a specific premium feature */
  hasFeature: (feature: PremiumFeature) => boolean;

  /** Computed: current effective tier (accounts for devOverride) */
  currentTier: () => SubscriptionTier;

  /** Set entitlement from RevenueCat or other source */
  setEntitlement: (info: EntitlementInfo) => void;

  /** Reset to free tier */
  clearEntitlement: () => void;

  /** Toggle dev override (only effective in __DEV__ mode) */
  setDevOverride: (enabled: boolean) => void;
}

export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set, get) => ({
      entitlement: DEFAULT_ENTITLEMENT,
      devOverride: false,

      isPremium: () => {
        const state = get();
        if (__DEV__ && state.devOverride) return true;
        return state.entitlement.isPremium;
      },

      hasFeature: (feature: PremiumFeature) => {
        const state = get();
        const effectiveTier = state.currentTier();
        const tierFeatures = TIER_FEATURES[effectiveTier] || [];
        return tierFeatures.includes(feature);
      },

      currentTier: () => {
        const state = get();
        if (__DEV__ && state.devOverride) return 'patron_lifetime';
        return state.entitlement.tier;
      },

      setEntitlement: (info: EntitlementInfo) => {
        set({ entitlement: info });
      },

      clearEntitlement: () => {
        set({ entitlement: DEFAULT_ENTITLEMENT });
      },

      setDevOverride: (enabled: boolean) => {
        if (__DEV__) {
          set({ devOverride: enabled });
        }
      },
    }),
    {
      name: 'shepema-entitlements-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the entitlement info and devOverride, not the functions
      partialize: (state) => ({
        entitlement: state.entitlement,
        devOverride: state.devOverride,
      }),
    }
  )
);

/**
 * Convenience hook — use this in components for simple premium checks.
 *
 * Usage:
 *   const isPremium = useIsPremium();
 *   const canUseCloudVault = useHasFeature('cloudVault');
 */
export function useIsPremium(): boolean {
  return useEntitlementStore((state) => {
    if (__DEV__ && state.devOverride) return true;
    return state.entitlement.isPremium;
  });
}

export function useHasFeature(feature: PremiumFeature): boolean {
  return useEntitlementStore((state) => {
    let effectiveTier: SubscriptionTier;
    if (__DEV__ && state.devOverride) {
      effectiveTier = 'patron_lifetime';
    } else {
      effectiveTier = state.entitlement.tier;
    }
    const tierFeatures = TIER_FEATURES[effectiveTier] || [];
    return tierFeatures.includes(feature);
  });
}

export function useCurrentTier(): SubscriptionTier {
  return useEntitlementStore((state) => {
    if (__DEV__ && state.devOverride) return 'patron_lifetime';
    return state.entitlement.tier;
  });
}
