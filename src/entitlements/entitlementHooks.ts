import { useEntitlementStore } from './entitlementStore';
import { PremiumFeature, SubscriptionTier } from './types';
import { canUseFeature } from './featureGates';

/**
 * Primary hook to check if user has unlocked Selah Grace (Lifetime).
 * Evaluates cached state for offline UI continuity, with strict __DEV__ guard for testing.
 */
export function useSelahGrace(): boolean {
  return useEntitlementStore((state) => {
    if (__DEV__ && state.devOverride) return true;
    return state.entitlement.isSelahGrace;
  });
}

/**
 * Evaluates access to a specific premium feature against centralized feature gates.
 */
export function useCanUseFeature(feature: PremiumFeature): boolean {
  const isSelahGrace = useSelahGrace();
  return canUseFeature(feature, isSelahGrace);
}

/**
 * Backward compatibility alias for `useSelahGrace`.
 */
export function useIsPremium(): boolean {
  return useSelahGrace();
}

/**
 * Backward compatibility alias for `useCanUseFeature`.
 */
export function useHasFeature(feature: PremiumFeature): boolean {
  return useCanUseFeature(feature);
}

/**
 * Returns the current active subscription/purchase tier.
 */
export function useCurrentTier(): SubscriptionTier {
  return useEntitlementStore((state) => {
    if (__DEV__ && state.devOverride) return 'selah_grace';
    return state.entitlement.tier;
  });
}
