import { Platform } from 'react-native';

/**
 * Thin wrapper around `react-native-iap`. We import lazily and guard every call
 * because:
 *
 *  1. `react-native-iap` only works in installed APKs — Expo Go / iOS Simulator
 *     don't ship the native module and importing it eagerly would crash the JS
 *     bundle on startup.
 *  2. We want to keep all the platform-specific Google Play purchase logic in
 *     one place so screens stay declarative.
 */

export interface IapPlan {
  productId: string;
  title: string;
  description: string;
  /** Localized price (e.g. "$4.99"). May be empty on Android until offers load. */
  localizedPrice: string;
  /** Raw price (Android subscriptions report the first phase price). */
  price: string;
  /** Subscription offer token required by Google Play Billing v5+. Android only. */
  offerToken?: string;
}

export interface IapPurchaseResult {
  productId: string;
  /** Google Play purchase token. Send this to the backend to verify entitlement. */
  purchaseToken: string;
  /** Apple originalTransactionId (only present on iOS). */
  originalTransactionId?: string;
}

let cachedModule: typeof import('react-native-iap') | null = null;
let connectionPromise: Promise<boolean> | null = null;

function getModule(): typeof import('react-native-iap') | null {
  if (cachedModule) return cachedModule;
  try {
    // Lazy require so Expo Go (which has no IAP native module) doesn't crash on import.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedModule = require('react-native-iap');
    return cachedModule;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[IAP] react-native-iap unavailable in this build', err);
    return null;
  }
}

async function ensureConnection(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  if (!connectionPromise) {
    connectionPromise = mod
      .initConnection()
      .then(() => true)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[IAP] initConnection failed', err);
        connectionPromise = null;
        return false;
      });
  }
  return connectionPromise;
}

export async function shutdownIap(): Promise<void> {
  const mod = getModule();
  if (!mod) return;
  try {
    await mod.endConnection();
    connectionPromise = null;
  } catch {
    // ignored
  }
}

/**
 * Loads the subscription product details for the given SKUs.
 * On Android picks the cheapest subscription offer per product (good default).
 */
export async function loadSubscriptionProducts(skus: string[]): Promise<IapPlan[]> {
  if (skus.length === 0) return [];
  if (Platform.OS !== 'android') {
    // iOS handled via separate getSubscriptions; left unimplemented for now since the
    // backend only verifies Google Play purchases in this pass.
    return [];
  }
  const ok = await ensureConnection();
  const mod = getModule();
  if (!ok || !mod) return [];
  try {
    const products = await mod.getSubscriptions({ skus });
    return products.map((p) => normalizeAndroidSubscription(p));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[IAP] getSubscriptions failed', err);
    return [];
  }
}

interface AndroidPricingPhase {
  formattedPrice?: string;
  priceAmountMicros?: string;
  priceCurrencyCode?: string;
}

interface AndroidSubscriptionOffer {
  offerId?: string | null;
  offerToken: string;
  basePlanId?: string | null;
  pricingPhases?: { pricingPhaseList?: AndroidPricingPhase[] };
}

interface AndroidSubscriptionProduct {
  productId: string;
  title?: string;
  name?: string;
  description?: string;
  subscriptionOfferDetails?: AndroidSubscriptionOffer[];
}

function normalizeAndroidSubscription(raw: unknown): IapPlan {
  const p = raw as AndroidSubscriptionProduct;
  const offers = p.subscriptionOfferDetails ?? [];

  // Pick the offer whose first paid phase is cheapest.
  let bestOffer: AndroidSubscriptionOffer | undefined;
  let bestPriceMicros = Number.POSITIVE_INFINITY;
  let bestFormattedPrice = '';
  for (const offer of offers) {
    const phases = offer.pricingPhases?.pricingPhaseList ?? [];
    const paid = phases.find((ph) => Number(ph.priceAmountMicros ?? '0') > 0) ?? phases[0];
    const micros = Number(paid?.priceAmountMicros ?? '0');
    if (micros < bestPriceMicros) {
      bestPriceMicros = micros;
      bestOffer = offer;
      bestFormattedPrice = paid?.formattedPrice ?? '';
    }
  }

  return {
    productId: p.productId,
    title: p.title || p.name || p.productId,
    description: p.description ?? '',
    localizedPrice: bestFormattedPrice,
    price: bestFormattedPrice,
    offerToken: bestOffer?.offerToken,
  };
}

/**
 * Triggers Google Play's purchase sheet for a premium subscription, waits for the
 * resulting purchase, and returns the purchase token so the caller can hand it to
 * the backend for verification.
 *
 * Returns `null` when the user dismisses the sheet (gracefully).
 */
export async function buyPremiumSubscription(productId: string): Promise<IapPurchaseResult | null> {
  if (Platform.OS !== 'android') {
    throw new Error('Google Play Billing is only available on Android.');
  }
  const mod = getModule();
  if (!mod) {
    throw new Error('In-app purchases are not available in this build.');
  }
  const ok = await ensureConnection();
  if (!ok) {
    throw new Error('Could not connect to Google Play Billing.');
  }

  const products = await loadSubscriptionProducts([productId]);
  const plan = products[0];
  if (!plan?.offerToken) {
    throw new Error('Subscription offer not available — check Play Console configuration.');
  }

  return new Promise<IapPurchaseResult | null>((resolve, reject) => {
    let settled = false;

    const updateSub = mod.purchaseUpdatedListener(async (purchase: unknown) => {
      if (settled) return;
      const typed = purchase as {
        productId?: string;
        purchaseToken?: string;
        transactionId?: string;
      };
      if (!typed.purchaseToken) return;

      settled = true;
      try {
        // Acknowledge / finish so Google doesn't auto-refund after 3 days. Subscriptions
        // are NOT consumable.
        await mod.finishTransaction({ purchase: purchase as never, isConsumable: false });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[IAP] finishTransaction failed', err);
      } finally {
        updateSub.remove();
        errorSub.remove();
        resolve({
          productId: typed.productId ?? productId,
          purchaseToken: typed.purchaseToken,
          originalTransactionId: typed.transactionId,
        });
      }
    });

    const errorSub = mod.purchaseErrorListener((err: unknown) => {
      if (settled) return;
      settled = true;
      updateSub.remove();
      errorSub.remove();
      const e = err as { code?: string; message?: string };
      if (e.code === 'E_USER_CANCELLED') {
        resolve(null);
        return;
      }
      reject(new Error(e.message ?? 'Purchase failed'));
    });

    mod
      .requestSubscription({
        sku: productId,
        subscriptionOffers: [{ sku: productId, offerToken: plan.offerToken! }],
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        updateSub.remove();
        errorSub.remove();
        const e = err as { code?: string; message?: string };
        if (e.code === 'E_USER_CANCELLED') {
          resolve(null);
        } else {
          reject(new Error(e.message ?? 'Purchase failed'));
        }
      });
  });
}
