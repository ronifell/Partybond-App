import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../store/authStore';
import {
  fetchPremiumStatus,
  refreshPremiumStatus,
  type PremiumStatus,
  type SubscriptionRow,
} from '../api/billing';

/**
 * Reactive premium-status hook. Reads the cached `user.isPremium` instantly and
 * silently refreshes from the server in the background. Use `refresh()` after a
 * purchase completes to pull the freshly verified entitlement.
 */
export function usePremium() {
  const user = useAuth((s) => s.user);
  const refreshMe = useAuth((s) => s.refreshMe);

  const [status, setStatus] = useState<PremiumStatus>(() => ({
    isPremium: !!user?.isPremium,
    premiumUntil: user?.premiumUntil ?? null,
    isStale: false,
  }));
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { remote?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const data = opts?.remote
          ? await refreshPremiumStatus()
          : await fetchPremiumStatus();
        setStatus(data.status);
        setSubscriptions(data.subscriptions);
        // Keep the global user object in sync so badges everywhere stay fresh.
        if (data.status.isPremium !== !!user?.isPremium) {
          void refreshMe();
        }
      } catch (err) {
        setError((err as Error).message ?? 'Failed to load premium status');
      } finally {
        setLoading(false);
      }
    },
    [refreshMe, user?.isPremium],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (user) {
      setStatus((prev) => ({
        ...prev,
        isPremium: !!user.isPremium,
        premiumUntil: user.premiumUntil,
      }));
    }
  }, [user?.isPremium, user?.premiumUntil, user]);

  return {
    isPremium: status.isPremium,
    premiumUntil: status.premiumUntil,
    subscriptions,
    loading,
    error,
    refresh: () => load({ remote: true }),
    reload: () => load(),
  };
}
