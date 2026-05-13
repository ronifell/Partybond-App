import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { Avatar } from '../components/ui/Avatar';
import { getMatch, sendInteraction, finishMatch, type InteractionType } from '../api/matches';
import { useAuth } from '../store/authStore';
import { gradient, colors } from '../theme/tokens';
import { getSocket } from '../socket';

const ACTIONS: Array<{ type: InteractionType; key: keyof typeof labelKeys }> = [
  { type: 'add_me', key: 'addMe' },
  { type: 'already_added', key: 'alreadyAdded' },
  { type: 'enter_lobby', key: 'enterLobby' },
  { type: 'waiting', key: 'waiting' },
  { type: 'did_not_work', key: 'didntWork' },
];

const labelKeys = {
  addMe: 'match.quick.addMe',
  alreadyAdded: 'match.quick.alreadyAdded',
  enterLobby: 'match.quick.enterLobby',
  waiting: 'match.quick.waiting',
  didntWork: 'match.quick.didntWork',
} as const;

const TYPE_TO_QUICK_KEY: Record<InteractionType, keyof typeof labelKeys> = {
  add_me: 'addMe',
  already_added: 'alreadyAdded',
  enter_lobby: 'enterLobby',
  waiting: 'waiting',
  did_not_work: 'didntWork',
};

const ACTION_STYLE: Record<
  InteractionType,
  { icon: React.ComponentProps<typeof Ionicons>['name']; border: string; iconColor: string }
> = {
  add_me: { icon: 'person-add-outline', border: colors.brand.blue, iconColor: colors.brand.blue },
  already_added: {
    icon: 'checkmark-circle-outline',
    border: colors.status.success,
    iconColor: colors.status.success,
  },
  enter_lobby: { icon: 'game-controller-outline', border: colors.brand.purple, iconColor: '#C5A8FF' },
  waiting: { icon: 'time-outline', border: '#FFB300', iconColor: '#FFB300' },
  did_not_work: { icon: 'warning-outline', border: colors.status.error, iconColor: colors.status.error },
};

const STEP_ICONS: Array<React.ComponentProps<typeof Ionicons>['name']> = [
  'copy-outline',
  'phone-portrait-outline',
  'person-add-outline',
  'log-in-outline',
];

type GuideStep = { title: string; body: string };

const INTERACTION_TYPES: InteractionType[] = [
  'add_me',
  'already_added',
  'enter_lobby',
  'waiting',
  'did_not_work',
];

type InteractionSocketPayload = {
  matchId: string;
  fromUserId: string;
  type: InteractionType;
  at?: string;
};

function isInteractionPayload(x: unknown): x is InteractionSocketPayload {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.matchId === 'string' &&
    typeof o.fromUserId === 'string' &&
    typeof o.type === 'string' &&
    (INTERACTION_TYPES as readonly string[]).includes(o.type)
  );
}

function useFadeIn() {
  const [v] = useState(new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v]);
  return v;
}

function GradientBorderBox({
  children,
  radius = 22,
}: {
  children: React.ReactNode;
  radius?: number;
}) {
  const innerR = radius - 2;
  return (
    <LinearGradient
      colors={[...gradient.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius, padding: 2 }}
    >
      <View
        style={{
          borderRadius: innerR,
          backgroundColor: 'rgba(10, 10, 18, 0.94)',
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

function GradientHeroTitle({ text, width }: { text: string; width: number }) {
  const fontSize = text.length > 22 ? 20 : 26;
  const height = Math.ceil(fontSize * 1.45);
  const gradId = 'matchHeroTitleGrad';
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="50%" x2="100%" y2="50%">
          <Stop offset="0%" stopColor="#FF00CC" />
          <Stop offset="48%" stopColor="#7B3FF2" />
          <Stop offset="100%" stopColor="#3366FF" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradId})`}
        fontSize={fontSize}
        fontWeight="800"
        fontStyle="italic"
        x={width / 2}
        y={height * 0.72}
        textAnchor="middle"
      >
        {text}
      </SvgText>
    </Svg>
  );
}

function GradientCountdown({ value, width }: { value: string; width: number }) {
  const gradId = 'matchTimerGrad';
  const fontSize = 40;
  const height = 52;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF4DA6" />
          <Stop offset="55%" stopColor="#7B3FF2" />
          <Stop offset="100%" stopColor="#00D1FF" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradId})`}
        fontSize={fontSize}
        fontWeight="900"
        x={width / 2}
        y={height * 0.78}
        textAnchor="middle"
      >
        {value}
      </SvgText>
    </Svg>
  );
}

function MatchQuickPill({
  label,
  icon,
  borderColor,
  iconColor,
  selected,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  borderColor: string;
  iconColor: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: selected ? `${borderColor}22` : 'rgba(22, 22, 34, 0.85)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: '100%',
        opacity: pressed ? 0.88 : 1,
        // Never set `transform: undefined` — RN's processTransform may call forEach on null.
        ...(pressed ? { transform: [{ scale: 0.98 }] } : {}),
      })}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={{ color: colors.ink.primary, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MatchScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const { width: windowW } = useWindowDimensions();
  const contentW = Math.min(windowW - 40, 400);
  const matchId = (route.params as { matchId: string }).matchId;
  const refreshMe = useAuth((s) => s.refreshMe);
  const fade = useFadeIn();
  const [copied, setCopied] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<InteractionType | null>(null);
  const [tick, setTick] = useState(0);
  const [partnerBannerType, setPartnerBannerType] = useState<InteractionType | null>(null);

  const { data: match, refetch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatch(matchId),
  });

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!partnerBannerType) return;
    const id = setTimeout(() => setPartnerBannerType(null), 4200);
    return () => clearTimeout(id);
  }, [partnerBannerType]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onEnded = () => {
      void refreshMe();
      navigation.replace('Home');
    };
    const onInteraction = (payload: unknown) => {
      if (!isInteractionPayload(payload)) return;
      if (payload.matchId !== matchId) return;
      void refetch();
      const uid = useAuth.getState().user?.id;
      if (uid && payload.fromUserId !== uid) {
        setPartnerBannerType(payload.type);
      }
    };
    socket.on('match:ended', onEnded);
    socket.on('match:interaction', onInteraction);
    return () => {
      socket.off('match:ended', onEnded);
      socket.off('match:interaction', onInteraction);
    };
  }, [navigation, refreshMe, refetch, matchId]);

  const remainingSec = useMemo(() => {
    if (!match) return 0;
    return Math.max(0, Math.floor((new Date(match.expiresAt).getTime() - Date.now()) / 1000));
  }, [match, tick]);

  const countdownLabel = useMemo(() => {
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [remainingSec]);

  const onCopy = async () => {
    if (!match?.opponent.playerId) return;
    await Clipboard.setStringAsync(match.opponent.playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const onAction = async (type: InteractionType) => {
    setLastInteraction(type);
    try {
      await sendInteraction(matchId, type);
      await refetch();
    } catch {
      // best-effort
    }
  };

  const onEnd = async () => {
    try {
      await finishMatch(matchId);
    } catch {
      // ignore
    } finally {
      await refreshMe();
      navigation.replace('Home');
    }
  };

  const onBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Home');
  };

  if (!match) {
    return (
      <Screen>
        <Text style={{ color: colors.ink.secondary }}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  const rawGuide = t('match.guideSteps', { returnObjects: true });
  const guideSteps: GuideStep[] =
    Array.isArray(rawGuide) &&
    rawGuide.length > 0 &&
    typeof (rawGuide[0] as GuideStep).title === 'string'
      ? (rawGuide as GuideStep[])
      : ((t('match.guide', { returnObjects: true }) as string[]) ?? []).map((title) => ({
          title,
          body: '',
        }));
  const displayName = match.opponent.nickname?.trim() || match.opponent.name;
  const nicknameValue = match.opponent.nickname?.trim() || '—';
  const playerIdValue = match.opponent.playerId ?? '—';
  const interactions = match.interactions ?? [];

  const labelMuted: TextStyle = {
    color: 'rgba(180, 180, 200, 0.75)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  };

  return (
    <Screen scroll>
      <BackgroundGlow />
      <Animated.View
        style={{
          opacity: fade,
          transform: [
            {
              translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
            },
          ],
        }}
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 4 })}
          >
            <Ionicons name="chevron-back" size={28} color={colors.ink.primary} />
          </Pressable>
          <View style={{ opacity: 0.9 }}>
            <Ionicons name="shield-checkmark" size={26} color={colors.brand.purple} />
          </View>
        </View>

        {/* Hero */}
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <GradientHeroTitle text={t('match.heroTitle')} width={contentW} />
          <Text
            style={{
              color: colors.ink.secondary,
              fontSize: 14,
              fontWeight: '500',
              marginTop: 10,
              textAlign: 'center',
              paddingHorizontal: 8,
            }}
          >
            {t('match.subtitle')}
          </Text>
        </View>

        {partnerBannerType ? (
          <View style={{ marginTop: 14, width: '100%' }}>
            <LinearGradient
              colors={['rgba(123,63,242,0.45)', 'rgba(0,209,255,0.28)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.22)',
                paddingVertical: 12,
                paddingHorizontal: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="flash-outline" size={22} color="#E8D8FF" />
                <Text style={{ color: colors.ink.primary, fontSize: 14, fontWeight: '700', flex: 1 }}>
                  {t('match.partnerToast', {
                    name: displayName,
                    action: t(labelKeys[TYPE_TO_QUICK_KEY[partnerBannerType]]),
                  })}
                </Text>
              </View>
            </LinearGradient>
          </View>
        ) : null}

        {/* Teammate card */}
        <View style={{ marginTop: 22 }}>
          <GradientBorderBox>
            <View style={{ padding: 16 }}>
              <View style={{ alignItems: 'center', marginBottom: 14 }}>
                <LinearGradient
                  colors={['rgba(123,63,242,0.95)', 'rgba(90,40,200,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ color: '#F0E8FF', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
                    {t('match.teammateBadge').toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <View style={{ alignItems: 'center', width: 100 }}>
                  <Avatar uri={match.opponent.photoUrl} name={match.opponent.name} size={88} />
                  <Text style={[labelMuted, { marginTop: 8 }]}>{t('match.nicknameFieldLabel')}</Text>
                </View>

                <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text
                      style={{
                        color: colors.ink.primary,
                        fontSize: 20,
                        fontWeight: '800',
                        letterSpacing: -0.3,
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.status.success,
                        }}
                      />
                      <Text style={{ color: colors.status.success, fontSize: 12, fontWeight: '700' }}>
                        {t('match.online')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Ionicons name="star" size={16} color="#FFB300" />
                    <Text style={{ color: colors.ink.secondary, fontSize: 14, fontWeight: '600' }}>
                      {t('match.teammateReady')}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={labelMuted}>{t('match.nicknameFieldLabel')}</Text>
                      <Text
                        style={{
                          color: colors.ink.primary,
                          fontSize: 15,
                          fontWeight: '700',
                          marginTop: 4,
                        }}
                        numberOfLines={1}
                      >
                        {nicknameValue}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={labelMuted}>{t('match.playerIdLabel')}</Text>
                      <Text
                        style={{
                          color: colors.ink.primary,
                          fontSize: 15,
                          fontWeight: '700',
                          marginTop: 4,
                          fontVariant: ['tabular-nums'],
                        }}
                        numberOfLines={1}
                        selectable
                      >
                        {playerIdValue}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable onPress={onCopy} style={{ marginTop: 18 }} className="active:opacity-92">
                <LinearGradient
                  colors={[...gradient.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    shadowColor: '#7B3FF2',
                    shadowOpacity: 0.45,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }}
                >
                  <Ionicons name="copy-outline" size={22} color="white" />
                  <Text style={{ color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 0.8 }}>
                    {t('match.copyPlayerId')}
                  </Text>
                </LinearGradient>
              </Pressable>

              {copied ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
                  <Text style={{ color: colors.status.success, fontWeight: '700', fontSize: 13 }}>
                    {t('match.copiedToast')}
                  </Text>
                </View>
              ) : null}
            </View>
          </GradientBorderBox>
        </View>

        {/* What to do next */}
        <View
          style={{
            marginTop: 22,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(18, 18, 30, 0.72)',
            padding: 16,
          }}
        >
          <Text
            style={{
              color: colors.ink.primary,
              fontSize: 17,
              fontWeight: '800',
              letterSpacing: -0.2,
              marginBottom: 14,
            }}
          >
            {t('match.guideTitle')}
          </Text>
          {guideSteps.map((step, i) => (
            <View
              key={`${step.title}-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: i < guideSteps.length - 1 ? 16 : 0,
              }}
            >
              <LinearGradient
                colors={[...gradient.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name={STEP_ICONS[i] ?? 'ellipse-outline'} size={18} color="white" />
              </LinearGradient>
              <View style={{ width: 26, alignItems: 'center', marginRight: 6, marginTop: 2 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: 'rgba(123,63,242,0.35)',
                    borderWidth: 1,
                    borderColor: 'rgba(123,63,242,0.6)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#E8D8FF', fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: colors.ink.primary, fontSize: 15, fontWeight: '700' }}>{step.title}</Text>
                <Text style={{ color: colors.ink.secondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                  {step.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Live activity from quick actions (both players) */}
        <View
          style={{
            marginTop: 22,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(14, 14, 24, 0.78)',
            padding: 16,
          }}
        >
          <Text
            style={{
              color: colors.ink.primary,
              fontSize: 17,
              fontWeight: '800',
              letterSpacing: -0.2,
              marginBottom: 12,
            }}
          >
            {t('match.activityTitle')}
          </Text>
          {interactions.length === 0 ? (
            <Text style={{ color: colors.ink.secondary, fontSize: 13, lineHeight: 19 }}>
              {t('match.activityEmpty')}
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {interactions.map((row) => {
                const isMe = row.userId === match.me.id;
                const who = isMe ? t('match.activityYou') : displayName;
                const actionLabel = t(labelKeys[TYPE_TO_QUICK_KEY[row.type]]);
                const time = new Date(row.createdAt).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const meta = ACTION_STYLE[row.type];
                return (
                  <View
                    key={row.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Ionicons name={meta.icon} size={20} color={meta.iconColor} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: colors.ink.primary, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>
                        <Text style={{ color: colors.ink.secondary, fontWeight: '600' }}>{time} · </Text>
                        {who}: {actionLabel}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick actions */}
        <Text
          style={{
            color: colors.ink.primary,
            fontSize: 17,
            fontWeight: '800',
            marginTop: 22,
            marginBottom: 12,
          }}
        >
          {t('match.quickActionsTitle')}
        </Text>
        <View style={{ gap: 10, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            {ACTIONS.slice(0, 3).map(({ type, key }) => {
              const meta = ACTION_STYLE[type];
              return (
                <View key={type} style={{ flex: 1, minWidth: '28%' }}>
                  <MatchQuickPill
                    label={t(labelKeys[key])}
                    icon={meta.icon}
                    borderColor={meta.border}
                    iconColor={meta.iconColor}
                    selected={lastInteraction === type}
                    onPress={() => onAction(type)}
                  />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {ACTIONS.slice(3).map(({ type, key }) => {
              const meta = ACTION_STYLE[type];
              return (
                <View key={type} style={{ flex: 1, maxWidth: '48%' }}>
                  <MatchQuickPill
                    label={t(labelKeys[key])}
                    icon={meta.icon}
                    borderColor={meta.border}
                    iconColor={meta.iconColor}
                    selected={lastInteraction === type}
                    onPress={() => onAction(type)}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Expiry + leave */}
        <View style={{ marginTop: 14, marginBottom: 28 }}>
          <GradientBorderBox radius={20}>
            <View style={{ paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.ink.primary, fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                {t('match.expiresPrefix')}
              </Text>
              <GradientCountdown value={countdownLabel} width={contentW - 48} />
            </View>
          </GradientBorderBox>

          <Pressable
            onPress={onEnd}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 20,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.status.error} />
            <Text style={{ color: colors.status.error, fontSize: 16, fontWeight: '800' }}>
              {t('match.endMatch')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}
