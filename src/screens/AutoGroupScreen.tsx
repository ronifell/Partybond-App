import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { Avatar } from '../components/ui/Avatar';
import { colors, gradient } from '../theme/tokens';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { usePremium } from '../hooks/usePremium';
import {
  cancelAutoGroup,
  createAutoGroup,
  fetchAutoGroupRequest,
  type AutoGroupRequestDetail,
} from '../api/autoGroup';
import { getApiError } from '../api/client';
import type { PlayStyle, SessionMode, SessionSkillTier } from '../api/types';

const PLAYERS_OPTIONS = [2, 4, 6, 8, 10, 12, 16];
const SKILL_TIERS: SessionSkillTier[] = ['beginner', 'intermediate', 'advanced', 'veteran'];

export function AutoGroupScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const { isPremium, refresh: refreshPremium } = usePremium();

  const [requestId, setRequestId] = useState<string | null>(
    (route.params as { requestId?: string } | undefined)?.requestId ?? null,
  );
  const [name, setName] = useState('');
  const [playersNeeded, setPlayersNeeded] = useState(4);
  const [gameMode, setGameMode] = useState<SessionMode>('casual');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('relaxed');
  const [skillTier, setSkillTier] = useState<SessionSkillTier>('intermediate');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  const selectedGameId = user?.selectedGame ?? games.find((g) => g.status === 'active')?.id ?? null;
  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) ?? null,
    [games, selectedGameId],
  );

  const requestQuery = useQuery({
    queryKey: ['auto-group', requestId],
    queryFn: () => fetchAutoGroupRequest(requestId!),
    enabled: !!requestId,
    refetchInterval: 5_000,
  });
  const request: AutoGroupRequestDetail | undefined = requestQuery.data;

  useEffect(() => {
    void refreshPremium();
  }, [refreshPremium]);

  const onUpgrade = () => navigation.navigate('Premium');

  const onStart = useCallback(async () => {
    if (!isPremium) {
      onUpgrade();
      return;
    }
    if (!selectedGameId) {
      setError(t('autoGroup.errorPickGame'));
      return;
    }
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await createAutoGroup({
        name: name.trim() || t('autoGroup.defaultName'),
        gameId: selectedGameId,
        gameMode,
        playStyle,
        skillTier,
        playersNeeded,
      });
      setRequestId(result.id);
      await qc.invalidateQueries({ queryKey: ['groups'] });
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'premium_required') {
        onUpgrade();
        return;
      }
      if (apiErr.code === 'auto_group_already_pending') {
        setError(t('autoGroup.errorAlreadyPending'));
      } else {
        setError(apiErr.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    gameMode,
    isPremium,
    name,
    onUpgrade,
    playStyle,
    playersNeeded,
    qc,
    selectedGameId,
    skillTier,
    submitting,
    t,
  ]);

  const onCancel = useCallback(async () => {
    if (!requestId) return;
    Alert.alert(t('autoGroup.cancelConfirmTitle'), t('autoGroup.cancelConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('autoGroup.cancelYes'),
        style: 'destructive',
        onPress: async () => {
          await cancelAutoGroup(requestId);
          setRequestId(null);
          await qc.invalidateQueries({ queryKey: ['auto-group'] });
        },
      },
    ]);
  }, [qc, requestId, t]);

  const renderConfigurator = () => (
    <>
      {!isPremium ? (
        <Card variant="dark" padding={16} radius={20}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,77,166,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255,77,166,0.45)',
              }}
            >
              <Ionicons name="sparkles" size={20} color="#FF4DA6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: '800' }}>
                {t('autoGroup.premiumGateTitle')}
              </Text>
              <Text
                style={{
                  color: colors.ink.secondary,
                  fontSize: 12,
                  marginTop: 4,
                  lineHeight: 17,
                }}
              >
                {t('autoGroup.premiumGateBody')}
              </Text>
              <View style={{ marginTop: 12 }}>
                <GradientButton
                  title={t('autoGroup.premiumGateCta')}
                  size="sm"
                  fullWidth={false}
                  onPress={onUpgrade}
                  leftAdornment={<Ionicons name="rocket" size={14} color="white" />}
                />
              </View>
            </View>
          </View>
        </Card>
      ) : null}

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
          {t('autoGroup.formGame')}
        </Text>
        {selectedGame ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
          >
            <Ionicons name="game-controller" size={18} color={colors.brand.blue} />
            <Text style={{ color: 'white', fontWeight: '700', flex: 1 }}>{selectedGame.name}</Text>
            <Text style={{ color: colors.ink.secondary, fontSize: 12 }}>
              {t('autoGroup.maxPlayersHint', { count: selectedGame.maxPlayers })}
            </Text>
          </View>
        ) : (
          <Text style={{ color: colors.ink.secondary, fontSize: 13 }}>
            {t('autoGroup.errorPickGame')}
          </Text>
        )}
      </Card>

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
          {t('autoGroup.formName')}
        </Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t('autoGroup.formNamePlaceholder')}
          maxLength={60}
        />
      </Card>

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
          {t('autoGroup.formPlayers')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PLAYERS_OPTIONS.map((n) => {
            const selected = playersNeeded === n;
            return (
              <Pressable
                key={n}
                onPress={() => setPlayersNeeded(n)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selected
                    ? 'rgba(123,63,242,0.7)'
                    : 'rgba(255,255,255,0.12)',
                  backgroundColor: selected ? 'rgba(123,63,242,0.18)' : 'transparent',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

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
          {t('autoGroup.formPrefs')}
        </Text>
        <SegmentRow
          label={t('autoGroup.formMode')}
          options={[
            { id: 'casual', label: t('autoGroup.modeCasual') },
            { id: 'competitive', label: t('autoGroup.modeCompetitive') },
          ]}
          value={gameMode}
          onChange={(v) => setGameMode(v as SessionMode)}
        />
        <SegmentRow
          label={t('autoGroup.formStyle')}
          options={[
            { id: 'relaxed', label: t('autoGroup.styleRelaxed') },
            { id: 'focused', label: t('autoGroup.styleFocused') },
          ]}
          value={playStyle}
          onChange={(v) => setPlayStyle(v as PlayStyle)}
        />
        <SegmentRow
          label={t('autoGroup.formSkill')}
          options={SKILL_TIERS.map((tier) => ({
            id: tier,
            label: t(`matchPrefs.tierShort${cap(tier)}`),
          }))}
          value={skillTier}
          onChange={(v) => setSkillTier(v as SessionSkillTier)}
        />
      </Card>

      {error ? (
        <Text style={{ color: colors.status.error, fontSize: 13, paddingHorizontal: 4 }}>
          {error}
        </Text>
      ) : null}

      <GradientButton
        title={isPremium ? t('autoGroup.startCta') : t('autoGroup.upgradeCta')}
        loading={submitting}
        onPress={onStart}
        leftAdornment={
          <Ionicons name={isPremium ? 'flash' : 'rocket'} size={18} color="white" />
        }
      />
      <Text style={{ color: colors.ink.disabled, fontSize: 11, textAlign: 'center' }}>
        {t('autoGroup.helperText')}
      </Text>
    </>
  );

  const renderStatus = () => {
    if (!request) {
      return (
        <View style={{ paddingVertical: 36, alignItems: 'center' }}>
          <ActivityIndicator color={colors.brand.purple} />
        </View>
      );
    }
    const filled = request.confirmedCount;
    const total = request.playersNeeded;
    const percent = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
    const statusKey =
      request.status === 'fulfilled' ? 'fulfilled' :
      request.status === 'searching' ? 'searching' :
      request.status === 'expired' ? 'expired' :
      request.status === 'canceled' ? 'canceled' : 'ready';
    const statusColor =
      request.status === 'fulfilled'
        ? '#00C853'
        : request.status === 'searching'
          ? colors.brand.blue
          : '#FF9800';

    return (
      <>
        <Card variant="dark" padding={20} radius={22}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: `${statusColor}22`,
                borderWidth: 1,
                borderColor: `${statusColor}77`,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: statusColor,
                  fontSize: 11,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                {t(`autoGroup.statusLabel.${statusKey}`)}
              </Text>
            </View>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 36 }}>
              {filled}/{total}
            </Text>
            <Text style={{ color: colors.ink.secondary, fontSize: 13, marginTop: 4 }}>
              {t('autoGroup.statusPlayersJoined')}
            </Text>
            <View
              style={{
                width: '100%',
                marginTop: 18,
                height: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={[...gradient.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${percent}%`, height: '100%' }}
              />
            </View>
          </View>
        </Card>

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
            {t('autoGroup.confirmedMembers')}
          </Text>
          {request.members.length === 0 ? (
            <Text style={{ color: colors.ink.secondary, fontSize: 13 }}>
              {t('autoGroup.noMembersYet')}
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {request.members.map((m) => (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar uri={m.photoUrl} name={m.name} size={32} />
                  <Text style={{ color: 'white', fontWeight: '700', flex: 1 }}>{m.name}</Text>
                  {m.role === 'admin' ? (
                    <Ionicons name="ribbon" size={14} color={colors.brand.purple} />
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Card>

        {request.pendingInvites.length > 0 ? (
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
              {t('autoGroup.pendingInvitesTitle', {
                count: request.pendingInvites.length,
              })}
            </Text>
            <View style={{ gap: 8 }}>
              {request.pendingInvites.map((i) => (
                <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar uri={i.invitee.photoUrl} name={i.invitee.name} size={28} />
                  <Text style={{ color: colors.ink.secondary, fontWeight: '600', flex: 1 }}>
                    {i.invitee.name}
                  </Text>
                  <Text style={{ color: colors.ink.disabled, fontSize: 11 }}>
                    {t('autoGroup.pendingLabel')}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <GradientButton
          title={t('autoGroup.openGroupCta')}
          onPress={() => navigation.navigate('GroupDetail', { groupId: request.groupId })}
          leftAdornment={<Ionicons name="people" size={18} color="white" />}
        />
        {request.status === 'searching' || request.status === 'ready' ? (
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.6 : 1, paddingVertical: 12 })}
          >
            <Text style={{ color: colors.status.error, fontWeight: '700' }}>
              {t('autoGroup.cancelCta')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setRequestId(null)}
            style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.6 : 1, paddingVertical: 12 })}
          >
            <Text style={{ color: colors.brand.blue, fontWeight: '700' }}>
              {t('autoGroup.startNewCta')}
            </Text>
          </Pressable>
        )}
      </>
    );
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
              {t('autoGroup.headerTitle')}
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {requestId ? renderStatus() : renderConfigurator()}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function SegmentRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.ink.secondary, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: selected
                  ? 'rgba(123,63,242,0.7)'
                  : 'rgba(255,255,255,0.12)',
                backgroundColor: selected ? 'rgba(123,63,242,0.18)' : 'transparent',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
