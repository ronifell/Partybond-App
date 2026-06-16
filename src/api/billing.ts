import { api } from './client';

export interface PremiumStatus {
  isPremium: boolean;
  premiumUntil: string | null;
  isStale: boolean;
}

export interface SubscriptionRow {
  id: string;
  platform: 'google_play' | 'app_store' | 'manual';
  productId: string;
  status:
    | 'active'
    | 'trial'
    | 'grace'
    | 'on_hold'
    | 'paused'
    | 'canceled'
    | 'expired'
    | 'refunded';
  autoRenewing: boolean;
  currentPeriodEnd: string;
  isEntitling: boolean;
}

export interface BillingProducts {
  premiumProductIds: string[];
  playPackageName: string;
}

export async function fetchPremiumProducts(): Promise<BillingProducts> {
  const { data } = await api.get<BillingProducts>('/billing/products');
  return data;
}

export async function fetchPremiumStatus(): Promise<{
  status: PremiumStatus;
  subscriptions: SubscriptionRow[];
}> {
  const { data } = await api.get<{ status: PremiumStatus; subscriptions: SubscriptionRow[] }>(
    '/billing/me',
  );
  return data;
}

export async function refreshPremiumStatus(): Promise<{
  status: PremiumStatus;
  subscriptions: SubscriptionRow[];
}> {
  const { data } = await api.post<{ status: PremiumStatus; subscriptions: SubscriptionRow[] }>(
    '/billing/refresh',
  );
  return data;
}

/** Send the Google Play purchase token to the server for verification + entitlement. */
export async function verifyGooglePlayPurchase(input: {
  productId: string;
  purchaseToken: string;
}): Promise<{ status: PremiumStatus; subscription: SubscriptionRow }> {
  const { data } = await api.post<{
    status: PremiumStatus;
    subscription: SubscriptionRow;
  }>('/billing/google-play/verify', input);
  return data;
}
