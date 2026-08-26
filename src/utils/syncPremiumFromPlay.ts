import { PREMIUM_PRODUCT_IDS, PRIMARY_PREMIUM_PRODUCT_ID } from '../config/env';
import { verifyGooglePlayPurchase } from '../api/billing';
import { restorePremiumPurchases } from './iap';

/**
 * Pulls owned Google Play subscriptions and verifies them with the Partybond API
 * so `user.isPremium` matches what Play already billed.
 *
 * @returns true when the backend now reports an active premium entitlement
 */
export async function syncOwnedPremiumFromPlay(): Promise<boolean> {
  const restored = await restorePremiumPurchases(PREMIUM_PRODUCT_IDS);
  if (restored.length === 0) return false;

  let entitled = false;
  for (const purchase of restored) {
    try {
      const result = await verifyGooglePlayPurchase({
        productId: purchase.productId || PRIMARY_PREMIUM_PRODUCT_ID,
        purchaseToken: purchase.purchaseToken,
      });
      if (result.status.isPremium) entitled = true;
    } catch {
      // Wrong SKU or token already bound — try remaining purchases.
    }
  }
  return entitled;
}

export function isAlreadyOwnedPurchaseError(message: string): boolean {
  return /already own|item.?already.?owned|já tem uma assinatura|já possui/i.test(message);
}
