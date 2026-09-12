/**
 * Entitlement Types
 *
 * Central type definitions for the Selah Grace lifetime purchase entitlement system.
 */

import { PremiumFeature } from './featureGates';
export { PremiumFeature };

/** RevenueCat Entitlement Identifier */
export const SELAH_GRACE_ENTITLEMENT = 'selah_grace';

/** Store Product Identifier for lifetime one-time purchase */
export const SELAH_GRACE_PRODUCT_ID = 'selah_grace_lifetime';

/** Subscription / Purchase tier identifier */
export type SubscriptionTier = 'free' | 'selah_grace';

/** Source of the entitlement */
export type EntitlementSource =
  | 'revenueCat'   // Live entitlement from RevenueCat SDK
  | 'restored'     // Restored purchase via RevenueCat
  | 'devOverride'  // Development-only override for testing (__DEV__ only)
  | 'none';        // Free user

/** Structured entitlement info */
export interface EntitlementInfo {
  /** Whether the user has unlocked Selah Grace */
  isSelahGrace: boolean;

  /** Alias for backward compatibility with existing UI components */
  isPremium: boolean;

  /** The active tier */
  tier: SubscriptionTier;

  /** Where the entitlement info originated */
  source: EntitlementSource;

  /** ISO date string of when the lifetime entitlement was activated */
  purchasedAt: string | null;
}

/** Default entitlement for free users */
export const DEFAULT_ENTITLEMENT: EntitlementInfo = {
  isSelahGrace: false,
  isPremium: false,
  tier: 'free',
  source: 'none',
  purchasedAt: null,
};

/**
 * Clean, decoupled store product information for UI rendering.
 * Does NOT expose internal RevenueCat SDK packages to the UI layer.
 */
export interface StoreProductInfo {
  productId: string;
  priceString: string;
  title: string;
  description: string;
}
