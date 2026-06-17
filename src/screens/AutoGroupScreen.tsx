import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
import { GradientButton } from '../components/ui/GradientButton';
import { Avatar } from '../components/ui/Avatar';
import { colors, gradient } from '../theme/tokens';
import { fetchGames } from '../api/games';
import { getGameImage } from '../theme/assets';
import { useAuth } from '../store/authStore';
import { usePremium } from '../hooks/usePremium';
import {
  cancelAutoGroup,
  createAutoGroup,
  fetchAutoGroupRequest,
  type AutoGroupRequestDetail,
} from '../api/autoGroup';
import { getApiError } from '../api/client';
import type { Game, PlayStyle, SessionMode, SessionSkillTier } from '../api/types';

// Brand colors used throughout the configurator. Defined once so the border /
// chip / button accents stay visually consistent.
const ACCENT = {
  pink: '#FF4DA6',
  purple: '#7B3FF2',
  blue: '#00D1FF',
};
const SURFACE = '#0D0D12';

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
  const [helpOpen, setHelpOpen] = useState(false);

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  const activeGames = useMemo(() => games.filter((g) => g.status === 'active'), [games]);

  // Tracks the user's picked game while on this screen. Defaults to their
  // profile-level `selectedGame`, falling back to the first active game.
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  useEffect(() => {
    if (selectedGameId && activeGames.some((g) => g.id === selectedGameId)) return;
    const fallback =
      activeGames.find((g) => g.id === user?.selectedGame)?.id ?? activeGames[0]?.id ?? null;
    if (fallback !== selectedGameId) setSelectedGameId(fallback);
  }, [activeGames, selectedGameId, user?.selectedGame]);

  const selectedGame = useMemo(
    () => activeGames.find((g) => g.id === selectedGameId) ?? null,
    [activeGames, selectedGameId],
  );

  // Auto-clamp `playersNeeded` to whatever the picked game supports so the
  // user can't submit "16 players" for a 5-player title.
  useEffect(() => {
    if (!selectedGame) return;
    if (playersNeeded > selectedGame.maxPlayers) {
      const fallback =
        [...PLAYERS_OPTIONS].reverse().find((n) => n <= selectedGame.maxPlayers) ??
        Math.max(2, selectedGame.maxPlayers);
      setPlayersNeeded(fallback);
    }
  }, [playersNeeded, selectedGame]);

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
      // Backend requires name length >= 2, so treat 1-char input as "empty"
      // and fall back to the localized default instead of surfacing a zod 400.
      const trimmed = name.trim();
      const finalName = trimmed.length >= 2 ? trimmed : t('autoGroup.defaultName');
      const result = await createAutoGroup({
        name: finalName,
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
          // Invalidate both the single-request query (this screen) and the
          // requests list (My Groups tile) so the "auto-search in progress"
          // badge clears immediately instead of after the next refetch.
          await Promise.all([
            qc.invalidateQueries({ queryKey: ['auto-group'] }),
            qc.invalidateQueries({ queryKey: ['auto-groups'] }),
          ]);
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
              <Ionicons name="sparkles" size={20} color={ACCENT.pink} />
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

      <HelpCard
        open={helpOpen}
        onToggle={() => setHelpOpen((v) => !v)}
        title={t('autoGroup.helpTitle')}
        subtitle={t(helpOpen ? 'autoGroup.helpSubtitleOpen' : 'autoGroup.helpSubtitleClosed')}
        steps={[
          { key: 'pick',   icon: 'game-controller' as const },
          { key: 'prefs',  icon: 'options'         as const },
          { key: 'invite', icon: 'paper-plane'     as const },
          { key: 'join',   icon: 'people'          as const },
        ].map((s, idx) => ({
          number: idx + 1,
          icon: s.icon,
          title: t(`autoGroup.helpSteps.${s.key}.title`),
          body: t(`autoGroup.helpSteps.${s.key}.body`),
        }))}
        tipsTitle={t('autoGroup.helpTipsTitle')}
        tips={[
          t('autoGroup.helpTips.duration'),
          t('autoGroup.helpTips.oneAtATime'),
          t('autoGroup.helpTips.control'),
          t('autoGroup.helpTips.premium'),
        ]}
      />

      <SectionLabel>{t('autoGroup.formGame')}</SectionLabel>
      {activeGames.length === 0 ? (
        <Text style={{ color: colors.ink.secondary, fontSize: 13, paddingHorizontal: 4 }}>
          {t('autoGroup.errorPickGame')}
        </Text>
      ) : (
        <GameDropdown
          games={activeGames}
          selectedId={selectedGameId}
          onSelect={(id) => setSelectedGameId(id)}
          changeHint={t('autoGroup.gameChangeHint')}
          placeholder={t('autoGroup.errorPickGame')}
          maxPlayersHint={(count) => t('autoGroup.maxPlayersHint', { count })}
        />
      )}

      <SectionLabel>{t('autoGroup.formName')}</SectionLabel>
      <GradientBorder radius={16}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 4,
            minHeight: 56,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(123,63,242,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(123,63,242,0.45)',
            }}
          >
            <Ionicons name="people" size={16} color={ACCENT.purple} />
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('autoGroup.formNamePlaceholder')}
            placeholderTextColor={colors.ink.disabled}
            maxLength={60}
            style={{
              flex: 1,
              color: 'white',
              fontWeight: '600',
              fontSize: 15,
              paddingVertical: 14,
            }}
          />
        </View>
      </GradientBorder>

      <SectionLabel>{t('autoGroup.formPlayers')}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 2 }}>
        {PLAYERS_OPTIONS.map((n) => {
          const selected = playersNeeded === n;
          const disabled = !!selectedGame && n > selectedGame.maxPlayers;
          return (
            <PillChip
              key={n}
              label={String(n)}
              selected={selected}
              disabled={disabled}
              onPress={() => setPlayersNeeded(n)}
              minWidth={48}
            />
          );
        })}
      </View>

      <View
        style={{
          marginTop: 4,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(123,63,242,0.32)',
          backgroundColor: SURFACE,
          padding: 16,
          gap: 14,
        }}
      >
        <SectionLabel noMargin>{t('autoGroup.formPrefs')}</SectionLabel>
        <PrefsRow
          label={t('autoGroup.formMode')}
          options={[
            { id: 'casual', label: t('autoGroup.modeCasual') },
            { id: 'competitive', label: t('autoGroup.modeCompetitive') },
          ]}
          value={gameMode}
          onChange={(v) => setGameMode(v as SessionMode)}
        />
        <PrefsRow
          label={t('autoGroup.formStyle')}
          options={[
            { id: 'relaxed', label: t('autoGroup.styleRelaxed') },
            { id: 'focused', label: t('autoGroup.styleFocused') },
          ]}
          value={playStyle}
          onChange={(v) => setPlayStyle(v as PlayStyle)}
        />
        <PrefsRow
          label={t('autoGroup.formSkill')}
          options={SKILL_TIERS.map((tier) => ({
            id: tier,
            label: t(`matchPrefs.tierShort${cap(tier)}`),
          }))}
          value={skillTier}
          onChange={(v) => setSkillTier(v as SessionSkillTier)}
        />
      </View>

      {error ? (
        <Text style={{ color: colors.status.error, fontSize: 13, paddingHorizontal: 4 }}>
          {error}
        </Text>
      ) : null}

      <GradientButton
        title={isPremium ? t('autoGroup.startCta') : t('autoGroup.upgradeCta')}
        loading={submitting}
        onPress={onStart}
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

        {request.status === 'searching' || request.status === 'ready' ? (
          <StatusHelpTip
            title={t('autoGroup.statusHelpTitle')}
            body={t('autoGroup.statusHelpBody')}
          />
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
            <Text
              style={{
                color: 'white',
                fontWeight: '800',
                fontSize: 13,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {t('autoGroup.headerTitle')}
            </Text>
          </View>
          {!requestId ? (
            <Pressable
              onPress={() => setHelpOpen((v) => !v)}
              hitSlop={8}
              accessibilityLabel={t('autoGroup.helpTitle')}
              accessibilityHint={t(helpOpen ? 'autoGroup.helpSubtitleOpen' : 'autoGroup.helpSubtitleClosed')}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: helpOpen
                  ? 'rgba(123,63,242,0.18)'
                  : 'rgba(255,255,255,0.06)',
                borderWidth: helpOpen ? 1 : 0,
                borderColor: helpOpen ? 'rgba(123,63,242,0.55)' : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={helpOpen ? ACCENT.purple : 'white'}
              />
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {requestId ? renderStatus() : renderConfigurator()}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Pink uppercase section heading used above each input row. */
function SectionLabel({
  children,
  noMargin,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <Text
      style={{
        color: ACCENT.pink,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginTop: noMargin ? 0 : 4,
        marginBottom: noMargin ? 4 : 8,
        marginLeft: 4,
      }}
    >
      {children}
    </Text>
  );
}

/**
 * Wraps any control in a 1.2px brand-gradient outline (pink → purple → blue),
 * matching the GAME / SQUAD NAME pill style in the design reference.
 */
function GradientBorder({
  children,
  radius = 16,
  intensity = 0.7,
}: {
  children: React.ReactNode;
  radius?: number;
  intensity?: number;
}) {
  return (
    <LinearGradient
      colors={[
        `rgba(255,77,166,${intensity})`,
        `rgba(123,63,242,${intensity})`,
        `rgba(0,209,255,${intensity * 0.85})`,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius + 1, padding: 1.2 }}
    >
      <View
        style={{
          borderRadius: radius,
          backgroundColor: SURFACE,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

/**
 * Reusable pill — used for player counts and the preference segment options.
 * Selected state gets a pink → purple gradient fill; unselected stays
 * transparent with a hairline border.
 */
function PillChip({
  label,
  selected,
  onPress,
  disabled,
  minWidth,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  minWidth?: number;
}) {
  const inner = (
    <View
      style={{
        paddingVertical: 9,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth,
      }}
    >
      <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>{label}</Text>
    </View>
  );

  if (selected) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => ({
          opacity: disabled ? 0.3 : pressed ? 0.9 : 1,
          borderRadius: 999,
          overflow: 'hidden',
          shadowColor: ACCENT.purple,
          shadowOpacity: 0.55,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        })}
      >
        <LinearGradient
          colors={[ACCENT.pink, ACCENT.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 999 }}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        opacity: disabled ? 0.3 : pressed ? 0.85 : 1,
      })}
    >
      {inner}
    </Pressable>
  );
}

/** A labelled row of pill-chips (Game mode / Play style / Skill level). */
function PrefsRow({
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
    <View>
      <Text style={{ color: colors.ink.secondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => (
          <PillChip
            key={opt.id}
            label={opt.label}
            selected={value === opt.id}
            onPress={() => onChange(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Pill-shaped game picker with a square thumbnail, gradient outline, and a
 * tap-to-expand list of every active game. Stays inline (no modal) so it
 * lives inside the page's scroll view.
 */
function GameDropdown({
  games,
  selectedId,
  onSelect,
  placeholder,
  changeHint,
  maxPlayersHint,
}: {
  games: Game[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  placeholder: string;
  changeHint: string;
  maxPlayersHint: (count: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const selected = games.find((g) => g.id === selectedId) ?? null;

  return (
    <View>
      <GradientBorder radius={16}>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 12,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <GameThumbnail game={selected} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ color: 'white', fontWeight: '800', fontSize: 16 }}
              numberOfLines={1}
            >
              {selected ? selected.name : placeholder}
            </Text>
            <Text style={{ color: colors.ink.disabled, fontSize: 12, marginTop: 2 }}>
              {changeHint}
            </Text>
          </View>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.ink.secondary}
          />
        </Pressable>
      </GradientBorder>

      {open ? (
        <View
          style={{
            marginTop: 8,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(123,63,242,0.32)',
            backgroundColor: SURFACE,
            overflow: 'hidden',
          }}
        >
          {games.map((g, idx) => {
            const isSelected = g.id === selectedId;
            return (
              <Pressable
                key={g.id}
                onPress={() => {
                  onSelect(g.id);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: isSelected
                    ? 'rgba(123,63,242,0.16)'
                    : pressed
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: 'rgba(255,255,255,0.05)',
                })}
              >
                <GameThumbnail game={g} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: 'white', fontWeight: '700' }} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text style={{ color: colors.ink.disabled, fontSize: 11, marginTop: 2 }}>
                    {maxPlayersHint(g.maxPlayers)}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark" size={18} color={ACCENT.purple} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** 40×40 rounded thumbnail. Renders the game's art if available, else an icon. */
function GameThumbnail({ game }: { game: Game | null }) {
  const src = game ? getGameImage(game.id) : null;
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: 'rgba(123,63,242,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(123,63,242,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? (
        <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <Ionicons name="game-controller" size={18} color={ACCENT.blue} />
      )}
    </View>
  );
}

interface HelpStep {
  number: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

/**
 * Collapsible "How it works" card shown above the configurator. Helps
 * first-time users understand the auto-matching flow without dominating the
 * screen — collapsed by default, expandable via either the card header itself
 * or the help button in the screen's nav bar.
 */
function HelpCard({
  open,
  onToggle,
  title,
  subtitle,
  steps,
  tipsTitle,
  tips,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  steps: HelpStep[];
  tipsTitle: string;
  tips: string[];
}) {
  return (
    <GradientBorder radius={18} intensity={open ? 0.85 : 0.55}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 14,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,77,166,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255,77,166,0.45)',
          }}
        >
          <Ionicons name="sparkles" size={18} color={ACCENT.pink} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>{title}</Text>
          <Text style={{ color: colors.ink.disabled, fontSize: 12, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.ink.secondary}
        />
      </Pressable>

      {open ? (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 16,
            paddingTop: 2,
            gap: 14,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <View style={{ gap: 14, paddingTop: 12 }}>
            {steps.map((s) => (
              <View
                key={s.number}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(123,63,242,0.20)',
                    borderWidth: 1,
                    borderColor: 'rgba(123,63,242,0.50)',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>
                    {s.number}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <Ionicons name={s.icon} size={14} color={ACCENT.blue} />
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>
                      {s.title}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 12,
                      marginTop: 4,
                      lineHeight: 17,
                    }}
                  >
                    {s.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(0,209,255,0.30)',
              backgroundColor: 'rgba(0,209,255,0.06)',
              padding: 12,
              gap: 6,
            }}
          >
            <Text
              style={{
                color: ACCENT.blue,
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {tipsTitle}
            </Text>
            {tips.map((tip, idx) => (
              <View
                key={idx}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
              >
                <Text
                  style={{ color: ACCENT.blue, fontSize: 12, lineHeight: 17 }}
                  selectable={false}
                >
                  •
                </Text>
                <Text
                  style={{
                    color: colors.ink.secondary,
                    fontSize: 12,
                    flex: 1,
                    lineHeight: 17,
                  }}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </GradientBorder>
  );
}

/**
 * Small dimmed tip card shown beside the live status header so the user can
 * tell at a glance what "Confirmed" vs "Pending" mean while they wait.
 */
function StatusHelpTip({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,209,255,0.28)',
        backgroundColor: 'rgba(0,209,255,0.06)',
        padding: 12,
      }}
    >
      <Ionicons name="information-circle" size={18} color={ACCENT.blue} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{title}</Text>
        <Text
          style={{
            color: colors.ink.secondary,
            fontSize: 12,
            marginTop: 3,
            lineHeight: 17,
          }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}
