/**
 * RevenueCat Service
 *
 * Manages RevenueCat SDK initialization, offering retrieval, lifetime
 * purchase processing, and purchase restoration for Selah Grace.
 *
 * In-App Purchase Architecture:
 * - Free download + One-time non-consumable lifetime purchase (Selah Grace).
 * - No recurring subscriptions. No ads.
 * - RevenueCat Entitlement: "selah_grace"
 * - Store Product Identifier: "selah_grace_lifetime"
 *
 * Store Setup Checklist:
 * 1. Apple App Store Connect:
 *    - Create Non-Consumable In-App Purchase with ID: selah_grace_lifetime
 * 2. Google Play Console:
 *    - Create In-App Product with ID: selah_grace_lifetime
 * 3. RevenueCat Dashboard:
 *    - Create Entitlement with Identifier: selah_grace
 *    - Attach product "selah_grace_lifetime" to entitlement "selah_grace"
 *    - Create Default Offering containing package with this product.
 */

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEntitlementStore } from './entitlementStore';
import {
  EntitlementInfo,
  DEFAULT_ENTITLEMENT,
  SELAH_GRACE_ENTITLEMENT,
  SELAH_GRACE_PRODUCT_ID,
  StoreProductInfo,
  EntitlementSource,
} from './types';

export { StoreProductInfo };
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Environment-safe API keys loaded from Expo public environment variables
const REVENUECAT_API_KEYS = {
  android:
    process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ||
    (Constants.expoConfig?.extra?.revenueCat?.googleApiKey as string | undefined) ||
    '',
  ios:
    process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ||
    (Constants.expoConfig?.extra?.revenueCat?.appleApiKey as string | undefined) ||
    '',
};

/** Cached reference to Purchases module */
let PurchasesModule: typeof import('react-native-purchases') | null = null;

/** Internal cached reference to active RevenueCat package for purchase execution */
let activeRevenueCatPackage: unknown = null;

function getPurchasesModule(): typeof import('react-native-purchases') | null {
  if (PurchasesModule) return PurchasesModule;
  try {
    PurchasesModule = require('react-native-purchases');
    return PurchasesModule;
  } catch {
    if (__DEV__) {
      console.log('[RevenueCat] react-native-purchases native module unavailable (e.g. running in Expo Go sandbox).');
    }
    return null;
  }
}

/**
 * Check if the Purchases SDK is configured and ready.
 */
export async function isPurchasesConfigured(): Promise<boolean> {
  if (isExpoGo) return false;
  const Purchases = getPurchasesModule();
  if (!Purchases) return false;
  try {
    return await Purchases.default.isConfigured();
  } catch {
    return false;
  }
}

/**
 * Parses RevenueCat CustomerInfo into structured EntitlementInfo.
 */
function parseCustomerInfo(
  customerInfo: unknown,
  source: EntitlementSource = 'revenueCat'
): EntitlementInfo {
  const info = customerInfo as {
    entitlements?: {
      active?: Record<string, { productIdentifier?: string; originalPurchaseDate?: string }>;
    };
  } | null;

  const activeEntitlement = info?.entitlements?.active?.[SELAH_GRACE_ENTITLEMENT];
  if (!activeEntitlement) {
    return DEFAULT_ENTITLEMENT;
  }

  return {
    isSelahGrace: true,
    isPremium: true,
    tier: 'selah_grace',
    source,
    purchasedAt: activeEntitlement.originalPurchaseDate || new Date().toISOString(),
  };
}

/**
 * Initialize RevenueCat SDK at startup.
 * Called once in RootLayout (_layout.tsx).
 *
 * Startup Entitlement Lifecycle:
 * 1. UI instantly hydrates cached entitlement from AsyncStorage (offline continuity).
 * 2. RevenueCat configures with anonymous ID (no user account required).
 * 3. Listens for live customer info updates.
 * 4. Refreshes customer info against store when network is available.
 */
export async function initRevenueCat(): Promise<void> {
  if (isExpoGo) {
    if (__DEV__) {
      console.log('[RevenueCat] Sandbox Notice: Expo Go detected. Store IAP operates in development/standalone builds.');
    }
    return;
  }

  const Purchases = getPurchasesModule();
  if (!Purchases) return;

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;

  if (!apiKey || apiKey.startsWith('YOUR_')) {
    if (__DEV__) {
      console.warn(
        '[RevenueCat] API key not configured for ' + Platform.OS +
        '. Please set EXPO_PUBLIC_REVENUECAT_' + Platform.OS.toUpperCase() + '_API_KEY in your environment.'
      );
    }
    return;
  }

  try {
    // Configure anonymously — Selah never requires an account
    await Purchases.default.configure({ apiKey });

    // Live customer info update listener
    Purchases.default.addCustomerInfoUpdateListener((info) => {
      const entitlement = parseCustomerInfo(info);
      useEntitlementStore.getState().setEntitlement(entitlement);
    });

    // Initial background verification against store
    await refreshCustomerInfo();
  } catch (err) {
    if (__DEV__) {
      console.warn('[RevenueCat] Initialization warning:', err);
    }
  }
}

/**
 * Background refresh of customer info from RevenueCat.
 */
export async function refreshCustomerInfo(): Promise<void> {
  const Purchases = getPurchasesModule();
  if (!Purchases) return;

  const configured = await isPurchasesConfigured();
  if (!configured) return;

  try {
    const customerInfo = await Purchases.default.getCustomerInfo();
    const entitlement = parseCustomerInfo(customerInfo);
    useEntitlementStore.getState().setEntitlement(entitlement);
  } catch (err) {
    // Network or store offline — cached entitlement remains valid for offline continuity
    if (__DEV__) {
      console.log('[RevenueCat] Customer info refresh skipped (offline or store unreachable):', err);
    }
  }
}

/**
 * Fetch Selah Grace lifetime product information with localized store pricing.
 * Returns clean, decoupled StoreProductInfo without leaking SDK internals.
 */
export async function getOfferings(): Promise<StoreProductInfo | null> {
  if (isExpoGo) return null;

  const Purchases = getPurchasesModule();
  if (!Purchases) return null;

  const configured = await isPurchasesConfigured();
  if (!configured) return null;

  try {
    const offerings = await Purchases.default.getOfferings();
    const currentOffering = offerings.current;

    if (!currentOffering?.availablePackages || currentOffering.availablePackages.length === 0) {
      return null;
    }

    // Find the package matching SELAH_GRACE_PRODUCT_ID or the lifetime package
    const matchedPkg =
      currentOffering.availablePackages.find(
        (p: { product?: { identifier?: string }; packageType?: string }) =>
          p.product?.identifier === SELAH_GRACE_PRODUCT_ID ||
          p.packageType === 'LIFETIME'
      ) || currentOffering.availablePackages[0];

    if (!matchedPkg?.product) {
      return null;
    }

    // Cache internal package reference for purchase execution
    activeRevenueCatPackage = matchedPkg;

    return {
      productId: matchedPkg.product.identifier || SELAH_GRACE_PRODUCT_ID,
      priceString: matchedPkg.product.priceString || '',
      title: matchedPkg.product.title || 'Selah Grace — Lifetime',
      description: matchedPkg.product.description || 'Unlock the complete Selah journaling experience permanently.',
    };
  } catch (err) {
    if (__DEV__) {
      console.warn('[RevenueCat] Error fetching offerings:', err);
    }
    return null;
  }
}

/**
 * Purchase Selah Grace (Lifetime one-time purchase).
 * Returns true if purchase succeeded and unlocked, false if cancelled or failed.
 */
export async function purchaseSelahGrace(): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
  if (isExpoGo) {
    return { success: false, error: 'Store purchases are unavailable in Expo Go. Please test on a standalone development build.' };
  }

  const Purchases = getPurchasesModule();
  if (!Purchases) {
    return { success: false, error: 'In-app purchases module is not available on this device.' };
  }

  const configured = await isPurchasesConfigured();
  if (!configured) {
    return { success: false, error: 'Could not connect to the app store. Please verify your internet connection and try again.' };
  }

  if (!activeRevenueCatPackage) {
    // Attempt re-fetch if not cached
    const offering = await getOfferings();
    if (!offering || !activeRevenueCatPackage) {
      return { success: false, error: 'Store products could not be loaded. Please check your network connection and try again.' };
    }
  }

  useEntitlementStore.getState().setLoading(true);

  try {
    const { customerInfo } = await Purchases.default.purchasePackage(
      activeRevenueCatPackage as any
    );

    const entitlement = parseCustomerInfo(customerInfo);
    useEntitlementStore.getState().setEntitlement(entitlement);

    return { success: entitlement.isSelahGrace };
  } catch (err: any) {
    if (err?.userCancelled) {
      // User cancelled purchase — silent graceful return
      return { success: false, userCancelled: true };
    }

    const message =
      err?.message?.includes('network') || err?.message?.includes('Internet')
        ? 'Could not connect to the store. Please check your internet connection.'
        : err?.message || 'Unable to complete purchase at this time.';

    return { success: false, error: message };
  } finally {
    useEntitlementStore.getState().setLoading(false);
  }
}

/**
 * Restores previous store purchases.
 * Used when a user reinstalls the app or sets up a new device with the same store account.
 */
export async function restorePurchases(): Promise<{ success: boolean; error?: string }> {
  if (isExpoGo) {
    return { success: false, error: 'Store purchases cannot be restored in Expo Go sandbox.' };
  }

  const Purchases = getPurchasesModule();
  if (!Purchases) {
    return { success: false, error: 'In-app purchases module is not available.' };
  }

  const configured = await isPurchasesConfigured();
  if (!configured) {
    return { success: false, error: 'Could not connect to the store right now. Please try again when you are online.' };
  }

  useEntitlementStore.getState().setLoading(true);

  try {
    const customerInfo = await Purchases.default.restorePurchases();
    const entitlement = parseCustomerInfo(customerInfo, 'restored');
    useEntitlementStore.getState().setEntitlement(entitlement);

    return { success: entitlement.isSelahGrace };
  } catch (err: any) {
    const message =
      err?.message?.includes('network') || err?.message?.includes('Internet')
        ? 'Could not connect to the store right now. Please check your internet connection.'
        : err?.message || 'Unable to restore purchases at this time.';

    return { success: false, error: message };
  } finally {
    useEntitlementStore.getState().setLoading(false);
  }
}
