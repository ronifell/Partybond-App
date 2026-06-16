import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { Avatar } from '../components/ui/Avatar';
import { GradientButton } from '../components/ui/GradientButton';
import { colors, gradient } from '../theme/tokens';
import { fetchMyInviteLink, fetchReferralHistory, type ReferralRow } from '../api/referrals';

export function InviteFriendsScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);

  const {
    data: invite,
    isLoading: inviteLoading,
    refetch: refetchInvite,
  } = useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: fetchMyInviteLink,
  });
  const {
    data: history = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
    isRefetching,
  } = useQuery<ReferralRow[]>({
    queryKey: ['referrals', 'history'],
    queryFn: fetchReferralHistory,
  });

  const shareUrl = invite?.url ?? '';
  const code = invite?.code ?? '';

  const shareMessage = useMemo(
    () => t('invite.shareMessage', { code, url: shareUrl }),
    [code, shareUrl, t],
  );

  const copy = useCallback(async (kind: 'code' | 'url') => {
    const value = kind === 'code' ? code : shareUrl;
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopied(kind);
    setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1500);
  }, [code, shareUrl]);

  const onShare = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await Share.share(
        {
          message: shareMessage,
          url: shareUrl,
        },
        { dialogTitle: t('invite.shareDialogTitle') },
      );
    } catch (err) {
      Alert.alert(t('common.error') ?? 'Error', (err as Error).message);
    }
  }, [shareMessage, shareUrl, t]);

  const stats = invite?.stats;
  const isLoading = inviteLoading || historyLoading;

  const onRefresh = () => {
    void refetchInvite();
    void refetchHistory();
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
              {t('invite.headerTitle')}
            </Text>
          </View>
          <Pressable
            onPress={onRefresh}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="refresh" size={18} color={colors.ink.secondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <LinearGradient
              colors={[...gradient.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22, gap: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="rocket" size={22} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: -0.4 }}>
                  {t('invite.heroTitle')}
                </Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 }}>
                {t('invite.heroBody', {
                  days: stats?.rewardDaysPerInvite ?? 7,
                })}
              </Text>
            </LinearGradient>
          </View>

          {/* Code + URL block */}
          <Card variant="dark" padding={16} radius={20}>
            {isLoading || !code ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color={colors.brand.purple} />
              </View>
            ) : (
              <>
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
                  {t('invite.yourCode')}
                </Text>

                <Pressable
                  onPress={() => void copy('code')}
                  style={({ pressed }) => ({
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: 'rgba(123,63,242,0.5)',
                    backgroundColor: 'rgba(123,63,242,0.1)',
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 26,
                      fontWeight: '900',
                      letterSpacing: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {code}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <Ionicons
                      name={copied === 'code' ? 'checkmark-circle' : 'copy-outline'}
                      size={14}
                      color={copied === 'code' ? '#00C853' : colors.brand.blue}
                    />
                    <Text
                      style={{
                        color: copied === 'code' ? '#00C853' : colors.brand.blue,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {copied === 'code' ? t('invite.copied') : t('invite.tapToCopy')}
                    </Text>
                  </View>
                </Pressable>

                <View style={{ marginTop: 14, gap: 8 }}>
                  <Text style={{ color: colors.ink.secondary, fontSize: 12, fontWeight: '700' }}>
                    {t('invite.shareLinkLabel')}
                  </Text>
                  <Pressable
                    onPress={() => void copy('url')}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.10)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons name="link-outline" size={16} color={colors.brand.blue} />
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, color: 'white', fontSize: 13, fontWeight: '600' }}
                    >
                      {shareUrl}
                    </Text>
                    <Ionicons
                      name={copied === 'url' ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color={copied === 'url' ? '#00C853' : colors.ink.secondary}
                    />
                  </Pressable>
                </View>

                <View style={{ marginTop: 16 }}>
                  <GradientButton
                    title={t('invite.shareCta')}
                    onPress={onShare}
                    leftAdornment={<Ionicons name="share-social" size={18} color="white" />}
                  />
                </View>
              </>
            )}
          </Card>

          {/* Stats */}
          {stats ? (
            <Card variant="dark" padding={16} radius={20}>
              <Text
                style={{
                  color: colors.brand.pink,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                {t('invite.statsTitle')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <StatTile
                  icon="people"
                  color={colors.brand.purple}
                  label={t('invite.statInvited')}
                  value={String(stats.totalInvites)}
                />
                <StatTile
                  icon="trophy"
                  color={colors.brand.blue}
                  label={t('invite.statRewarded')}
                  value={String(stats.rewardedInvites)}
                />
                <StatTile
                  icon="time"
                  color="#FFC44D"
                  label={t('invite.statDaysEarned')}
                  value={String(stats.daysEarned)}
                />
              </View>
            </Card>
          ) : null}

          {/* History */}
          <Card variant="dark" padding={16} radius={20}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: colors.brand.pink,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {t('invite.historyTitle')}
              </Text>
              {isRefetching ? <ActivityIndicator color={colors.brand.purple} /> : null}
            </View>
            {history.length === 0 ? (
              <Text style={{ color: colors.ink.secondary, fontSize: 13 }}>
                {t('invite.historyEmpty')}
              </Text>
            ) : (
              history.map((r) => <ReferralRowItem key={r.id} row={r} t={t} />)
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function StatTile({
  icon,
  color,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${color}55`,
        backgroundColor: `${color}11`,
        alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, marginTop: 4 }}>{value}</Text>
      <Text
        style={{
          color: colors.ink.secondary,
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ReferralRowItem({
  row,
  t,
}: {
  row: ReferralRow;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const date = row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '';
  const isRewarded = row.status === 'rewarded';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        gap: 12,
      }}
    >
      {row.invitee?.photoUrl ? (
        <Image
          source={{ uri: row.invitee.photoUrl }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
        />
      ) : (
        <Avatar uri={row.invitee?.photoUrl ?? null} name={row.invitee?.name ?? '?'} size={36} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'white', fontWeight: '700' }} numberOfLines={1}>
          {row.invitee?.name ?? t('invite.unknownInvitee')}
        </Text>
        <Text style={{ color: colors.ink.secondary, fontSize: 12, marginTop: 2 }}>{date}</Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: isRewarded ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.06)',
        }}
      >
        <Text
          style={{
            color: isRewarded ? '#00C853' : colors.ink.secondary,
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase',
          }}
        >
          {isRewarded ? `+${row.rewardDays}d` : t(`invite.status.${row.status}`)}
        </Text>
      </View>
    </View>
  );
}
