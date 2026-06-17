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
  googlePlayConfigured: boolean;
  /** True when the backend's mock billing provider is enabled (no real money). */
  mockEnabled: boolean;
  /** Days granted by a single mock purchase, used for the confirmation message. */
  mockDurationDays: number;
}

export async function fetchPremiumProducts(): Promise<BillingProducts> {
  const { data } = await api.get<BillingProducts>('/billing/products');
  return {
    premiumProductIds: data.premiumProductIds ?? [],
    playPackageName: data.playPackageName ?? '',
    googlePlayConfigured: !!data.googlePlayConfigured,
    mockEnabled: !!data.mockEnabled,
    mockDurationDays: Number(data.mockDurationDays ?? 30),
  };
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

/**
 * Mock purchase — pretends the store accepted the payment and credits premium.
 * Only callable while the backend has `BILLING_MOCK_ENABLED=true`. Used as a
 * stand-in until the real Play/App Store integration ships.
 */
export async function purchaseMockPremium(input?: {
  productId?: string;
  durationDays?: number;
}): Promise<{ status: PremiumStatus; subscription: SubscriptionRow }> {
  const { data } = await api.post<{
    status: PremiumStatus;
    subscription: SubscriptionRow;
  }>('/billing/mock/purchase', input ?? {});
  return data;
}
