import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TeamScreenBackground } from '../components/ui/TeamScreenBackground';
import { WordmarkPartybond } from '../components/ui/WordmarkPartybond';
import { resolvePhotoUri } from '../components/ui/Avatar';
import { getSession, leaveQueue } from '../api/sessions';
import { getMatchmakingQueueStatus, leaveMatchmakingQueue } from '../api/matchmaking';
import { useAuth } from '../store/authStore';
import { useSessionRoom } from '../hooks/useSessionRoom';
import { useMatchEvents } from '../hooks/useMatchEvents';
import { colors, gradient, radii } from '../theme/tokens';

const H_PAD = 16;
const VISUAL_SIZE = 300;
const RING_SIZE = 208;
const RING_BORDER = 10;
const SLOT_SIZE = 44;
const SLOT_CORNER = 13;
const SLOT_BORDER = 2;
const SLOT_COUNT = 6;
const SLOT_RADIUS = RING_SIZE / 2 + 30;

/** Per-orbit accent — each slot gets a distinct gradient ring. */
const SLOT_ACCENTS: ReadonlyArray<{ ring: [string, string]; glow: string; icon: string }> = [
  { ring: ['#FF4DA6', '#7B3FF2'], glow: '#FF4DA6', icon: 'rgba(255,77,166,0.9)' },
  { ring: ['#00D1FF', '#3B82F6'], glow: '#00D1FF', icon: 'rgba(0,209,255,0.9)' },
  { ring: ['#FF8A4D', '#FF4DA6'], glow: '#FF8A4D', icon: 'rgba(255,138,77,0.9)' },
  { ring: ['#7CECA1', '#00C853'], glow: '#7CECA1', icon: 'rgba(124,236,161,0.9)' },
  { ring: ['#FFD54F', '#FF8A4D'], glow: '#FFD54F', icon: 'rgba(255,213,79,0.9)' },
  { ring: ['#C5A8FF', '#5B8DEF'], glow: '#C5A8FF', icon: 'rgba(197,168,255,0.9)' },
];
/** Fast phase: 1.5 turns in 4s. Slow phase: 0.5 turn in 4s. Repeats (half prior speed). */
const ORBIT_PHASE_FAST_MS = 4000;
const ORBIT_PHASE_SLOW_MS = 4000;
const RING_GRADIENT_A = [...gradient.primary] as [string, string, string];
const RING_GRADIENT_B = [...gradient.primaryReverse] as [string, string, string];

type QueueSlot =
  | { kind: 'user'; name: string; photoUrl: string | null; isYou?: boolean }
  | { kind: 'empty' };

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function useRingBorderColorMix() {
  const mix = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const phase = Animated.sequence([
      Animated.timing(mix, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(mix, {
        toValue: 0,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(phase);
    loop.start();
    return () => loop.stop();
  }, [mix]);
  return mix;
}

function QueueRing({ children }: { children: React.ReactNode }) {
  const ringMix = useRingBorderColorMix();
  const innerRadius = (RING_SIZE - RING_BORDER * 2) / 2;

  return (
    <View style={queueStyles.ringOuter}>
      <LinearGradient
        colors={RING_GRADIENT_A}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: ringMix }]} pointerEvents="none">
        <LinearGradient
          colors={RING_GRADIENT_B}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[queueStyles.ringInner, { margin: RING_BORDER, borderRadius: innerRadius }]}>
        {children}
      </View>
    </View>
  );
}

/** Six slots evenly on the ring; index 0 = top (you), then teammates clockwise. */
function buildQueueSlots(
  me: { id: string; name: string; photoUrl: string | null } | null,
  waiting: Array<{ id: string; name: string; photoUrl: string | null }>,
): QueueSlot[] {
  const seen = new Set<string>();
  const slots: QueueSlot[] = [];

  if (me) {
    seen.add(me.id);
    slots.push({ kind: 'user', name: me.name, photoUrl: me.photoUrl, isYou: true });
  }

  for (const w of waiting) {
    if (slots.length >= SLOT_COUNT) break;
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    slots.push({ kind: 'user', name: w.name, photoUrl: w.photoUrl });
  }

  while (slots.length < SLOT_COUNT) {
    slots.push({ kind: 'empty' });
  }

  return slots.slice(0, SLOT_COUNT);
}

/**
 * Orbit alternates: 4s fast spin → 4s slow spin → repeat.
 * Uses 0→1 (fast) and 1→2 (slow) so loop reset stays visually seamless (multiples of 360°).
 */
function useVariableOrbitRotation() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cycle = Animated.sequence([
      Animated.timing(spin, {
        toValue: 1,
        duration: ORBIT_PHASE_FAST_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(spin, {
        toValue: 2,
        duration: ORBIT_PHASE_SLOW_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(cycle, { resetBeforeIteration: true });
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const orbitRotate = spin.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '540deg', '720deg'],
  });
  const counterRotate = spin.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '-540deg', '-720deg'],
  });

  return { orbitRotate, counterRotate };
}

function RotatingAvatarOrbit({ slots }: { slots: QueueSlot[] }) {
  const { orbitRotate, counterRotate } = useVariableOrbitRotation();
  const cx = VISUAL_SIZE / 2;
  const cy = VISUAL_SIZE / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: VISUAL_SIZE,
        height: VISUAL_SIZE,
        transform: [{ rotate: orbitRotate }],
      }}
    >
      {slots.map((slot, i) => {
        const angle = (2 * Math.PI * i) / SLOT_COUNT - Math.PI / 2;
        const left = cx + SLOT_RADIUS * Math.cos(angle) - SLOT_SIZE / 2;
        const top = cy + SLOT_RADIUS * Math.sin(angle) - SLOT_SIZE / 2;
        return (
          <Animated.View
            key={`orbit-slot-${i}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: SLOT_SIZE,
              height: SLOT_SIZE,
              transform: [{ rotate: counterRotate }],
            }}
          >
            <QueueAvatarSlot slot={slot} index={i} />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

function slotInitials(name: string): string {
  return name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Squircle orbit tile with a unique accent gradient per index. */
function QueueAvatarSlot({ slot, index }: { slot: QueueSlot; index: number }) {
  const accent = SLOT_ACCENTS[index % SLOT_ACCENTS.length]!;
  const isEmpty = slot.kind === 'empty';
  const resolvedUri =
    slot.kind === 'user' && slot.photoUrl ? resolvePhotoUri(slot.photoUrl) : null;

  return (
    <View
      style={[
        queueStyles.slotWrap,
        {
          shadowColor: accent.glow,
          shadowOpacity: isEmpty ? 0.35 : 0.55,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
      ]}
    >
      <LinearGradient
        colors={accent.ring}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={queueStyles.slotRing}
      >
        <View style={[queueStyles.slotInner, isEmpty && queueStyles.slotEmpty]}>
          {slot.kind === 'user' && resolvedUri ? (
            <Image
              source={{ uri: resolvedUri }}
              style={queueStyles.slotImage}
              resizeMode="cover"
            />
          ) : slot.kind === 'user' ? (
            <Text style={queueStyles.slotInitials}>{slotInitials(slot.name)}</Text>
          ) : (
            <Ionicons name="person" size={20} color={accent.icon} />
          )}
          {slot.kind === 'user' && slot.isYou ? (
            <View style={queueStyles.youBadge}>
              <Text style={queueStyles.youBadgeText}>YOU</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

function StatColumn({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={queueStyles.statCol}>
      <Ionicons name={icon} size={18} color={colors.brand.purple} style={{ marginBottom: 6 }} />
      <Text style={queueStyles.statLabel}>{label}</Text>
      <Text style={queueStyles.statValue}>{value}</Text>
    </View>
  );
}

type QueueParams =
  | { sessionId: string; progressive?: false }
  | { progressive: true; gameId?: string; sessionId?: never };

export function QueueScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const qc = useQueryClient();
  const params = route.params as QueueParams;
  const progressive = 'progressive' in params && params.progressive;
  const sessionId = !progressive ? params.sessionId : undefined;
  const user = useAuth((s) => s.user);
  const refreshMe = useAuth((s) => s.refreshMe);
  const [phase, setPhase] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useFocusEffect(
    useCallback(() => {
      return () => setLeaving(false);
    }, []),
  );

  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId && !progressive,
    refetchInterval: 5000,
  });

  const onQueueUpdate = useCallback(() => {
    if (sessionId) {
      void qc.invalidateQueries({ queryKey: ['session', sessionId] });
    }
  }, [qc, sessionId]);

  useSessionRoom(sessionId ?? '', onQueueUpdate);

  useEffect(() => {
    if (!progressive) return;
    const tick = async () => {
      const status = await getMatchmakingQueueStatus();
      if (status) setPhase(status.phase);
    };
    void tick();
    const id = setInterval(() => void tick(), 2000);
    return () => clearInterval(id);
  }, [progressive]);

  /** Real players in this session queue — never use the wait timer here. */
  const playersInQueue = useMemo(() => {
    if (progressive) return 1;
    return session?.waiting?.length ?? 0;
  }, [progressive, session?.waiting?.length]);

  useMatchEvents((p) => {
    if (progressive || p.sessionId === sessionId) {
      navigation.replace('Match', { matchId: p.matchId });
    }
  });

  const onLeave = async () => {
    setLeaving(true);
    try {
      if (progressive) await leaveMatchmakingQueue();
      else if (sessionId) await leaveQueue(sessionId);
    } catch {
      // ignore
    } finally {
      await refreshMe();
      navigation.replace('Home');
    }
  };

  const onHowItWorks = () => {
    Alert.alert(t('queue.howItWorks'), t('queue.howItWorksBody'));
  };

  const centerCountLabel =
    !progressive && !session ? '—' : String(playersInQueue);

  const slots = useMemo(() => {
    const me = user ? { id: user.id, name: user.name, photoUrl: user.photoUrl } : null;
    if (progressive || !session) {
      return buildQueueSlots(me, []);
    }
    return buildQueueSlots(me, session.waiting);
  }, [progressive, session, user]);

  const sessionTitle = session?.title?.toUpperCase() ?? t('queue.searchingMatch');
  const gameName = session?.gameName ?? '';
  const statPlayers = !progressive && !session ? '—' : String(playersInQueue);

  return (
    <TeamScreenBackground>
      <SafeAreaView style={queueStyles.safe} edges={['top', 'bottom']}>
        <View style={queueStyles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [queueStyles.headerSide, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>

          <View style={queueStyles.headerCenter} pointerEvents="none">
            <WordmarkPartybond size={22} letterSpacing={0.8} slant={-10} />
          </View>

          <Pressable
            onPress={onHowItWorks}
            style={({ pressed }) => [queueStyles.howBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="person-circle-outline" size={14} color={colors.ink.secondary} />
            <Text style={queueStyles.howBtnText} numberOfLines={1}>
              {t('queue.howItWorks')}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[queueStyles.scrollContent, { paddingHorizontal: H_PAD }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={queueStyles.gameInfo}>
            <View style={queueStyles.gameModeRow}>
              <Ionicons name="shield-checkmark" size={16} color={colors.brand.pink} />
              <Text style={queueStyles.gameModeText} numberOfLines={1}>
                {sessionTitle}
              </Text>
            </View>
            {gameName ? (
              <Text style={queueStyles.gameNameText} numberOfLines={1}>
                {gameName}
              </Text>
            ) : null}
          </View>

          <View style={[queueStyles.visualWrap, { width: Math.min(width - H_PAD * 2, 360) }]}>
            <View style={{ width: VISUAL_SIZE, height: VISUAL_SIZE, alignSelf: 'center' }}>
              <RotatingAvatarOrbit slots={slots} />

              <View style={queueStyles.ringCenter}>
                <QueueRing>
                  <Text style={queueStyles.centerCount}>{centerCountLabel}</Text>
                  {playersInQueue > 0 ? (
                    <Text style={queueStyles.centerFound}>
                      {t('queue.playerFound', { count: playersInQueue })}
                    </Text>
                  ) : null}
                  <Text style={queueStyles.centerSub}>
                    {progressive ? t('queue.searchingMatch') : t('queue.searchingMore')}
                  </Text>
                </QueueRing>
              </View>
            </View>
          </View>

          <View style={queueStyles.statsCard}>
            <StatColumn icon="people" label={t('queue.statPlayers')} value={statPlayers} />
            <View style={queueStyles.statDivider} />
            <StatColumn
              icon="time-outline"
              label={t('queue.statEstimated')}
              value={formatElapsed(elapsedSec)}
            />
            <View style={queueStyles.statDivider} />
            <StatColumn
              icon="flash"
              label={t('queue.statAvgMatch')}
              value={t('queue.avgMatchValue')}
            />
          </View>

          <View style={queueStyles.tipsCard}>
            <View style={queueStyles.tipsHeader}>
              <Ionicons name="star" size={14} color={colors.brand.purple} />
              <Text style={queueStyles.tipsTitle}>{t('queue.whileYouWait')}</Text>
            </View>
            <View style={queueStyles.tipRow}>
              <Ionicons name="locate-outline" size={16} color={colors.brand.purple} />
              <Text style={queueStyles.tipText}>{t('queue.tipQueueSize')}</Text>
            </View>
            <View style={queueStyles.tipRow}>
              <Ionicons name="people-outline" size={16} color={colors.brand.purple} />
              <Text style={queueStyles.tipText}>{t('queue.tipGameId')}</Text>
            </View>
            <View style={queueStyles.tipRow}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.brand.purple} />
              <Text style={queueStyles.tipText}>{t('queue.tipReady')}</Text>
            </View>
            <Ionicons
              name="game-controller-outline"
              size={72}
              color="rgba(123,63,242,0.12)"
              style={queueStyles.tipsWatermark}
            />
          </View>
        </ScrollView>

        <View style={[queueStyles.footer, { paddingHorizontal: H_PAD }]}>
          <Pressable
            onPress={onLeave}
            disabled={leaving}
            style={({ pressed }) => [
              queueStyles.leaveBtn,
              (pressed || leaving) && { opacity: 0.88, transform: [{ scale: 0.99 }] },
            ]}
          >
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={queueStyles.leaveGradient}
            >
              {leaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={queueStyles.leaveText}>{t('queue.leave').toUpperCase()}</Text>
                  <Ionicons name="exit-outline" size={22} color="#fff" />
                </>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={queueStyles.leaveHint}>{t('queue.leaveHint')}</Text>
        </View>
      </SafeAreaView>
    </TeamScreenBackground>
  );
}

const queueStyles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    paddingBottom: 8,
    minHeight: 44,
  },
  headerSide: {
    width: 44,
    zIndex: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  howBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(12,12,20,0.85)',
    maxWidth: 118,
    marginLeft: 'auto',
    zIndex: 2,
  },
  howBtnText: {
    color: colors.ink.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  gameModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  gameModeText: {
    color: colors.brand.pink,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  gameNameText: {
    color: colors.ink.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  visualWrap: {
    alignSelf: 'center',
    marginVertical: 12,
  },
  ringCenter: {
    position: 'absolute',
    left: (VISUAL_SIZE - RING_SIZE) / 2,
    top: (VISUAL_SIZE - RING_SIZE) / 2,
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.purple,
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    overflow: 'hidden',
  },
  ringInner: {
    flex: 1,
    backgroundColor: '#0A0A12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  centerCount: {
    color: '#fff',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 56,
  },
  centerFound: {
    color: colors.brand.purple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  centerSub: {
    color: colors.ink.disabled,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  slotWrap: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
  },
  slotRing: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: SLOT_CORNER + SLOT_BORDER,
    padding: SLOT_BORDER,
  },
  slotInner: {
    flex: 1,
    borderRadius: SLOT_CORNER,
    overflow: 'hidden',
    backgroundColor: '#12121C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  slotImage: {
    ...StyleSheet.absoluteFillObject,
  },
  slotInitials: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  slotEmpty: {
    backgroundColor: 'rgba(16,14,28,0.96)',
  },
  youBadge: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(123,63,242,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  youBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(20,20,28,0.92)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    color: colors.ink.disabled,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.ink.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 4,
  },
  tipsCard: {
    marginTop: 14,
    backgroundColor: 'rgba(18,18,26,0.94)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.35)',
    padding: 14,
    overflow: 'hidden',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tipsTitle: {
    color: colors.brand.purple,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    color: colors.ink.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  tipsWatermark: {
    position: 'absolute',
    right: -8,
    bottom: -12,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  leaveBtn: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    shadowColor: colors.brand.pink,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  leaveGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  leaveText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  leaveHint: {
    color: colors.ink.disabled,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 15,
  },
});
