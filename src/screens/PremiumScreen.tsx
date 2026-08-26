import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientButton } from '../components/ui/GradientButton';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { colors } from '../theme/tokens';
import { PREMIUM_PRODUCT_IDS, PRIMARY_PREMIUM_PRODUCT_ID } from '../config/env';
import {
  fetchPremiumProducts,
  purchaseMockPremium,
  verifyGooglePlayPurchase,
  type BillingProducts,
} from '../api/billing';
import { usePremium } from '../hooks/usePremium';
import {
  buyPremiumSubscription,
  loadSubscriptionProducts,
  type IapPlan,
} from '../utils/iap';
import {
  isAlreadyOwnedPurchaseError,
  syncOwnedPremiumFromPlay,
} from '../utils/syncPremiumFromPlay';

const BENEFITS: Array<{ icon: keyof typeof Ionicons.glyphMap; key: string }> = [
  { icon: 'sparkles', key: 'autoGroup' },
  { icon: 'options', key: 'advancedFilters' },
  { icon: 'flash', key: 'priority' },
  { icon: 'shield-checkmark', key: 'badge' },
];

export function PremiumScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const { isPremium, premiumUntil, subscriptions, refresh, reload } = usePremium();

  const [plans, setPlans] = useState<IapPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<BillingProducts | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // True whenever the backend reports the mock provider is on. While in mock
  // mode we skip Google Play entirely so the flow works on iOS, Android, and
  // Expo Go alike — clicking Upgrade goes straight to the server stub.
  const mockEnabled = !!products?.mockEnabled;

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setError(null);
    try {
      const productsResp = await fetchPremiumProducts().catch(() => null);
      if (mounted.current) setProducts(productsResp);

      // In mock mode there are no real Play products to look up — build a
      // synthetic plan list so the UI still shows a "Monthly" card and price.
      if (productsResp?.mockEnabled) {
        if (!mounted.current) return;
        setPlans(
          (productsResp.premiumProductIds.length > 0
            ? productsResp.premiumProductIds
            : [PRIMARY_PREMIUM_PRODUCT_ID]
          ).map((productId) => ({
            productId,
            title: t('premium.planMonthly'),
            description: t('premium.mockPlanDescription', {
              days: productsResp.mockDurationDays,
            }),
            localizedPrice: t('premium.mockPriceLabel'),
            price: '0',
            currency: 'TEST',
          })),
        );
        return;
      }

      const result = await loadSubscriptionProducts(PREMIUM_PRODUCT_IDS);
      if (!mounted.current) return;
      setPlans(result);
    } catch (err) {
      if (!mounted.current) return;
      setError(t('premium.errorLoadProducts'));
      // eslint-disable-next-line no-console
      console.warn('[Premium] load products failed', err);
    } finally {
      if (mounted.current) setPlansLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const onUpgrade = useCallback(async () => {
    if (purchasing) return;
    setPurchasing(true);
    setError(null);
    try {
      const productId = plans[0]?.productId ?? PRIMARY_PREMIUM_PRODUCT_ID;

      // Mock provider: pretend Play accepted the purchase and call the
      // server-side stub. Same downstream effect (Subscription row + premium).
      if (mockEnabled) {
        await purchaseMockPremium({ productId });
        await refresh();
        Alert.alert(t('premium.successTitle'), t('premium.successBody'));
        return;
      }

      // Real provider: Google Play → server verification.
      const purchase = await buyPremiumSubscription(productId);
      if (!purchase) {
        setPurchasing(false);
        return;
      }
      await verifyGooglePlayPurchase({
        productId: purchase.productId ?? productId,
        purchaseToken: purchase.purchaseToken,
      });
      await refresh();
      Alert.alert(t('premium.successTitle'), t('premium.successBody'));
    } catch (err) {
      const message = (err as Error).message ?? t('premium.errorPurchase');
      if (/cancel/i.test(message) || /E_USER_CANCELLED/.test(message)) {
        setPurchasing(false);
        return;
      }
      if (isAlreadyOwnedPurchaseError(message)) {
        try {
          const entitled = await syncOwnedPremiumFromPlay();
          await refresh();
          if (entitled) {
            Alert.alert(t('premium.successTitle'), t('premium.restoreSuccessBody'));
            setPurchasing(false);
            return;
          }
          setError(t('premium.restoreEmpty'));
        } catch (restoreErr) {
          setError((restoreErr as Error).message || t('premium.errorRestore'));
        }
        setPurchasing(false);
        return;
      }
      setError(message);
    } finally {
      if (mounted.current) setPurchasing(false);
    }
  }, [plans, purchasing, refresh, t, mockEnabled]);

  const onRestore = useCallback(async () => {
    if (purchasing) return;
    setPurchasing(true);
    setError(null);
    try {
      if (mockEnabled) {
        await refresh();
        await reload();
        return;
      }
      const entitled = await syncOwnedPremiumFromPlay();
      await refresh();
      await reload();
      if (entitled) {
        Alert.alert(t('premium.restoreSuccessTitle'), t('premium.restoreSuccessBody'));
      } else {
        setError(t('premium.restoreEmpty'));
      }
    } catch (err) {
      setError((err as Error).message || t('premium.errorRestore'));
    } finally {
      if (mounted.current) setPurchasing(false);
    }
  }, [mockEnabled, purchasing, refresh, reload, t]);

  const formatExpiry = (iso: string | null): string | null => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const formatPrice = (plan: IapPlan | undefined): string => {
    if (!plan) return '—';
    return plan.localizedPrice || plan.price || '';
  };

  return (
    <Screen padded={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.06)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
              {t('premium.headerTitle')}
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {mockEnabled ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,193,7,0.55)',
                backgroundColor: 'rgba(255,193,7,0.08)',
                padding: 12,
                flexDirection: 'row',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Ionicons name="construct" size={18} color="#FFC107" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFC107', fontWeight: '800', fontSize: 12 }}>
                  {t('premium.mockBannerTitle')}
                </Text>
                <Text style={{ color: colors.ink.secondary, fontSize: 12, marginTop: 2 }}>
                  {t('premium.mockBannerBody', {
                    days: products?.mockDurationDays ?? 30,
                  })}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Hero */}
          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <LinearGradient
              colors={['#2a0d4a', '#0f0a1f']}
              style={{ padding: 22, gap: 12 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  backgroundColor: 'rgba(255,77,166,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,77,166,0.45)',
                }}
              >
                <Text style={{ color: '#FFA1C9', fontWeight: '800', fontSize: 11 }}>
                  {t('premium.heroBadge')}
                </Text>
              </View>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 26, letterSpacing: -0.5 }}>
                {t('premium.heroTitle')}
              </Text>
              <Text style={{ color: '#B8B8CC', fontSize: 14, lineHeight: 20 }}>
                {t('premium.heroBody')}
              </Text>
              {isPremium ? (
                <View
                  style={{
                    marginTop: 6,
                    borderRadius: 12,
                    backgroundColor: 'rgba(0,200,83,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(0,200,83,0.35)',
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#00C853" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: '700' }}>
                      {t('premium.activeBadge')}
                    </Text>
                    {premiumUntil ? (
                      <Text style={{ color: colors.ink.secondary, fontSize: 12, marginTop: 2 }}>
                        {t('premium.renewsOn', { date: formatExpiry(premiumUntil) ?? '' })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </LinearGradient>
          </View>

          {/* Benefits */}
          <Card variant="dark" padding={16} radius={20}>
            <Text
              style={{
                color: colors.brand.pink,
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {t('premium.benefitsTitle')}
            </Text>
            <View style={{ gap: 12 }}>
              {BENEFITS.map((b) => (
                <View key={b.key} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(123,63,242,0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(123,63,242,0.35)',
                    }}
                  >
                    <Ionicons name={b.icon} size={18} color={colors.brand.purple} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                      {t(`premium.benefits.${b.key}.title`)}
                    </Text>
                    <Text
                      style={{
                        color: colors.ink.secondary,
                        fontSize: 12,
                        marginTop: 2,
                        lineHeight: 17,
                      }}
                    >
                      {t(`premium.benefits.${b.key}.body`)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Plan / CTA — shown on Android, or on any platform when mock billing is on. */}
          {Platform.OS === 'android' || mockEnabled ? (
            <Card variant="dark" padding={16} radius={20}>
              <Text
                style={{
                  color: colors.brand.pink,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {t('premium.planTitle')}
              </Text>
              {plansLoading ? (
                <ActivityIndicator color={colors.brand.purple} />
              ) : plans.length === 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.ink.secondary, fontSize: 13 }}>
                    {t('premium.noPlans')}
                  </Text>
                  <Pressable onPress={() => void loadPlans()} hitSlop={6}>
                    <Text style={{ color: colors.brand.blue, fontSize: 13, fontWeight: '700' }}>
                      {t('common.retry')}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {plans.map((p) => (
                    <View
                      key={p.productId}
                      style={{
                        borderWidth: 1,
                        borderColor: 'rgba(123,63,242,0.4)',
                        backgroundColor: 'rgba(123,63,242,0.08)',
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
                        {p.title || t('premium.planMonthly')}
                      </Text>
                      <Text
                        style={{
                          color: colors.brand.blue,
                          fontWeight: '900',
                          fontSize: 22,
                          marginTop: 6,
                        }}
                      >
                        {formatPrice(p)}
                      </Text>
                      {p.description ? (
                        <Text
                          style={{
                            color: colors.ink.secondary,
                            fontSize: 12,
                            marginTop: 4,
                            lineHeight: 16,
                          }}
                        >
                          {p.description}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
              {error ? (
                <Text style={{ color: colors.status.error, marginTop: 10, fontSize: 13 }}>
                  {error}
                </Text>
              ) : null}
              <View style={{ marginTop: 16, gap: 8 }}>
                <GradientButton
                  title={isPremium ? t('premium.ctaManage') : t('premium.ctaUpgrade')}
                  onPress={onUpgrade}
                  loading={purchasing}
                  disabled={plansLoading || plans.length === 0}
                  leftAdornment={<Ionicons name="rocket" size={18} color="white" />}
                />
                <Pressable onPress={onRestore} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                  <Text
                    style={{
                      color: colors.brand.blue,
                      textAlign: 'center',
                      fontWeight: '700',
                      paddingVertical: 8,
                    }}
                  >
                    {t('premium.restorePurchase')}
                  </Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <Card variant="dark" padding={16} radius={20}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Ionicons name="information-circle" size={20} color={colors.brand.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>{t('premium.iosTitle')}</Text>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 13,
                      marginTop: 6,
                      lineHeight: 18,
                    }}
                  >
                    {t('premium.iosBody')}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Existing subscription rows */}
          {subscriptions.length > 0 ? (
            <Card variant="dark" padding={14} radius={18}>
              <Text
                style={{
                  color: colors.brand.pink,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {t('premium.yourSubscriptions')}
              </Text>
              {subscriptions.map((s) => (
                <View
                  key={s.id}
                  style={{
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700' }}>{s.productId}</Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: s.isEntitling ? 'rgba(0,200,83,0.15)' : 'rgba(255,82,82,0.15)',
                      }}
                    >
                      <Text
                        style={{
                          color: s.isEntitling ? '#00C853' : '#FF5252',
                          fontSize: 10,
                          fontWeight: '800',
                          textTransform: 'uppercase',
                        }}
                      >
                        {s.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.ink.secondary, fontSize: 12, marginTop: 4 }}>
                    {t('premium.until')} {formatExpiry(s.currentPeriodEnd)}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}

          <Text style={{ color: colors.ink.disabled, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
            {t('premium.disclaimer')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}
