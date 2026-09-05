/**
 * RevenueCat Service
 *
 * Initializes the RevenueCat SDK, listens for entitlement changes,
 * and syncs premium status to the entitlement store.
 *
 * Pricing is fetched dynamically from RevenueCat offerings (configured
 * in the RevenueCat dashboard) — never hardcoded in the app.
 */

import { Platform } from 'react-native';
import { useEntitlementStore } from './store';
import {
  EntitlementInfo,
  DEFAULT_ENTITLEMENT,
  SubscriptionTier,
  EntitlementSource,
} from './types';

// RevenueCat entitlement identifier (configured in RevenueCat dashboard)
const ENTITLEMENT_ID = 'selah_grace';

// RevenueCat API keys — set these from your RevenueCat project dashboard
// In production, these should come from environment variables / EAS secrets
const REVENUECAT_API_KEYS = {
  android:
    process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ||
    'goog_fgvJABcRlgYQJiJAbqvtOAbNHRM',
  ios:
    process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ||
    'YOUR_REVENUECAT_APPLE_API_KEY',
};

/** Cached reference to the Purchases module (lazy loaded) */
let PurchasesModule: typeof import('react-native-purchases') | null = null;

/**
 * Lazily load the RevenueCat Purchases module.
 * Returns null if the module is not available (e.g., Expo Go).
 */
function getPurchasesModule(): typeof import('react-native-purchases') | null {
  if (PurchasesModule) return PurchasesModule;
  try {
    PurchasesModule = require('react-native-purchases');
    return PurchasesModule;
  } catch {
    console.warn('[RevenueCat] react-native-purchases not available (likely running in Expo Go)');
    return null;
  }
}

/**
 * Map a RevenueCat product identifier to our internal tier.
 */
function productIdToTier(productId: string): SubscriptionTier {
  const id = productId.toLowerCase();
  if (id.includes('lifetime') || id.includes('patron')) return 'patron_lifetime';
  if (id.includes('annual') || id.includes('yearly')) return 'grace_annual';
  if (id.includes('monthly')) return 'grace_monthly';
  return 'grace_monthly'; // fallback for any premium product
}

/**
 * Parse RevenueCat CustomerInfo into our EntitlementInfo.
 */
function parseCustomerInfo(
  customerInfo: any,
  source: EntitlementSource = 'revenueCat'
): EntitlementInfo {
  const activeEntitlements = customerInfo?.entitlements?.active;
  const entitlement = activeEntitlements?.[ENTITLEMENT_ID];
  if (!entitlement) {
    return DEFAULT_ENTITLEMENT;
  }

  const productId = entitlement.productIdentifier || '';
  const tier = productIdToTier(productId);

  return {
    isPremium: true,
    tier,
    source,
    expiresAt: entitlement.expirationDate || null,
    willRenew: entitlement.willRenew ?? false,
  };
}

/**
 * Initialize RevenueCat SDK and set up the customer info listener.
 * Call this once in the app root (_layout.tsx) on startup.
 *
 * Safe to call in Expo Go — gracefully no-ops if the native module
 * is unavailable.
 */
export async function initRevenueCat(): Promise<void> {
  const Purchases = getPurchasesModule();
  if (!Purchases) {
    console.log('[RevenueCat] Skipping init — module not available');
    return;
  }

  const apiKey = Platform.OS === 'ios'
    ? REVENUECAT_API_KEYS.ios
    : REVENUECAT_API_KEYS.android;

  if (!apiKey || apiKey.startsWith('YOUR_')) {
    console.warn('[RevenueCat] API key not configured — skipping init');
    return;
  }

  try {
    // Configure with anonymous user (no forced sign-up for free users)
    await Purchases.default.configure({
      apiKey,
    });

    // Set up listener for entitlement changes
    Purchases.default.addCustomerInfoUpdateListener((info) => {
      const entitlement = parseCustomerInfo(info);
      useEntitlementStore.getState().setEntitlement(entitlement);
    });

    // Fetch initial status
    const customerInfo = await Purchases.default.getCustomerInfo();
    const entitlement = parseCustomerInfo(customerInfo);
    useEntitlementStore.getState().setEntitlement(entitlement);

    console.log('[RevenueCat] Initialized successfully, premium:', entitlement.isPremium);
  } catch (err) {
    console.warn('[RevenueCat] Init error:', err);
  }
}

/**
 * Offering & Package types for the paywall.
 * Prices are fetched dynamically from RevenueCat (configured in dashboard).
 */
export interface PaywallPackage {
  identifier: string;
  tier: SubscriptionTier;
  title: string;
  description: string;
  priceString: string;
  /** The raw RevenueCat package object for purchasing */
  rcPackage: any;
}

/**
 * Fetch available subscription packages from RevenueCat.
 * Returns empty array if not available.
 */
export async function getOfferings(): Promise<PaywallPackage[]> {
  const Purchases = getPurchasesModule();
  if (!Purchases) return [];

  const apiKey = Platform.OS === 'ios'
    ? REVENUECAT_API_KEYS.ios
    : REVENUECAT_API_KEYS.android;

  // In development / Expo Go or when API keys are placeholder, return empty
  // so PaywallModal displays custom configured FALLBACK_TIERS ($2.99/mo, $19.99/yr, $49.99).
  if (!apiKey || apiKey.startsWith('YOUR_')) {
    return [];
  }

  try {
    const offerings = await Purchases.default.getOfferings();
    const currentOffering = offerings.current;

    if (!currentOffering?.availablePackages) {
      console.warn('[RevenueCat] No current offering available');
      return [];
    }

    return currentOffering.availablePackages.map((pkg: any) => {
      const productId = pkg.product?.identifier || '';
      const tier = productIdToTier(productId);

      let title = 'Premium';
      let description = '';
      switch (tier) {
        case 'grace_monthly':
          title = 'Monthly';
          description = 'Billed monthly, cancel anytime';
          break;
        case 'grace_annual':
          title = 'Annual';
          description = 'Best value — save 44%';
          break;
        case 'patron_lifetime':
          title = 'Lifetime Pass';
          description = 'One-time payment, forever yours';
          break;
      }

      return {
        identifier: pkg.identifier,
        tier,
        title,
        description,
        priceString: pkg.product?.priceString || '',
        rcPackage: pkg,
      };
    });
  } catch (err) {
    console.warn('[RevenueCat] Error fetching offerings:', err);
    return [];
  }
}

/**
 * Purchase a subscription package.
 * Returns true if purchase was successful, false otherwise.
 */
export async function purchasePackage(paywallPackage: PaywallPackage): Promise<boolean> {
  const Purchases = getPurchasesModule();
  if (!Purchases) return false;

  try {
    const { customerInfo } = await Purchases.default.purchasePackage(
      paywallPackage.rcPackage
    );

    const entitlement = parseCustomerInfo(customerInfo);
    useEntitlementStore.getState().setEntitlement(entitlement);

    return entitlement.isPremium;
  } catch (err: any) {
    // User cancelled is not an error
    if (err?.userCancelled) {
      console.log('[RevenueCat] Purchase cancelled by user');
      return false;
    }
    console.warn('[RevenueCat] Purchase error:', err);
    throw err;
  }
}

/**
 * Restore previously made purchases.
 * Returns true if premium was restored.
 */
export async function restorePurchases(): Promise<boolean> {
  const Purchases = getPurchasesModule();
  if (!Purchases) return false;

  try {
    const customerInfo = await Purchases.default.restorePurchases();
    const entitlement = parseCustomerInfo(customerInfo, 'restored');
    useEntitlementStore.getState().setEntitlement(entitlement);

    return entitlement.isPremium;
  } catch (err) {
    console.warn('[RevenueCat] Restore error:', err);
    throw err;
  }
}
