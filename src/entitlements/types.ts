/**
 * Entitlement Types
 *
 * Central type definitions for the premium/free entitlement system.
 * All feature-gating across Shepema reads from these types.
 */

/** Subscription tier identifiers matching RevenueCat product IDs */
export type SubscriptionTier = 'free' | 'grace_monthly' | 'grace_annual' | 'patron_lifetime';

/** Where the entitlement status came from */
export type EntitlementSource =
  | 'revenueCat'   // Live entitlement from RevenueCat SDK
  | 'restored'     // Restored purchase via RevenueCat
  | 'devOverride'  // Development-only override for testing
  | 'none';        // No active entitlement (free user)

/** Structured entitlement info */
export interface EntitlementInfo {
  /** Whether the user currently has premium access */
  isPremium: boolean;

  /** The active subscription tier */
  tier: SubscriptionTier;

  /** Where the entitlement info originated */
  source: EntitlementSource;

  /** ISO date string of when the current entitlement expires (null for lifetime or free) */
  expiresAt: string | null;

  /** Whether the subscription will auto-renew */
  willRenew: boolean;
}

/** Default entitlement for free/guest users */
export const DEFAULT_ENTITLEMENT: EntitlementInfo = {
  isPremium: false,
  tier: 'free',
  source: 'none',
  expiresAt: null,
  willRenew: false,
};

/** Maximum number of free journal pages before Grace upgrade is required */
export const FREE_JOURNAL_PAGE_LIMIT = 30;

/**
 * Feature flags gated behind premium.
 * Used for granular feature checks across the app.
 */
export type PremiumFeature =
  | 'unlimitedJournalPages'
  | 'cloudVault'
  | 'multiDeviceSync'
  | 'luxuryCovers'
  | 'ambientSoundscapes'
  | 'watermarkFreeCards'
  | 'patronBadge';

/**
 * Map of which features each tier unlocks.
 * 'patron_lifetime' gets everything 'grace' gets plus the badge.
 */
export const TIER_FEATURES: Record<SubscriptionTier, PremiumFeature[]> = {
  free: [],
  grace_monthly: [
    'unlimitedJournalPages',
    'cloudVault',
    'multiDeviceSync',
    'luxuryCovers',
    'ambientSoundscapes',
    'watermarkFreeCards',
  ],
  grace_annual: [
    'unlimitedJournalPages',
    'cloudVault',
    'multiDeviceSync',
    'luxuryCovers',
    'ambientSoundscapes',
    'watermarkFreeCards',
  ],
  patron_lifetime: [
    'unlimitedJournalPages',
    'cloudVault',
    'multiDeviceSync',
    'luxuryCovers',
    'ambientSoundscapes',
    'watermarkFreeCards',
    'patronBadge',
  ],
};
