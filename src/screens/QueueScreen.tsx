import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { GradientButton } from '../components/ui/GradientButton';
import { getSession, leaveQueue } from '../api/sessions';
import { useAuth } from '../store/authStore';
import { useSessionRoom } from '../hooks/useSessionRoom';
import { useMatchEvents } from '../hooks/useMatchEvents';
import { colors, gradient } from '../theme/tokens';

/** Ring border: crossfade between these gradients (animated opacity). */
const RING_GRADIENT_A = [...gradient.primary] as [string, string, string];
const RING_GRADIENT_B = [...gradient.primaryReverse] as [string, string, string];

const ORBIT_FAST_MS = 900;
const ORBIT_SLOW_MS = 4800;

const ORBIT_SIZE = 268;
const RING_SIZE = 200;
const ORBIT_CX = ORBIT_SIZE / 2;
const ORBIT_CY = ORBIT_SIZE / 2;
/** Distance from center to each orbiting icon (between ring edge and outer frame). */
const ORBIT_RADIUS = RING_SIZE / 2 + 22;
const ORBIT_ICON = 26;
const ORBIT_ICON_HALF = ORBIT_ICON / 2;

const ORBIT_USER_ICONS: ReadonlyArray<{
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { name: 'person', color: colors.brand.pink },
  { name: 'people', color: colors.brand.purple },
  { name: 'person-circle', color: colors.brand.blue },
  { name: 'person-add', color: '#C5A8FF' },
  { name: 'people-circle', color: '#FF8A4D' },
  { name: 'body', color: '#7CECA1' },
];

const COUNT_FONT_SIZE = 48;
const COUNT_SVG_WIDTH = 160;
const COUNT_SVG_HEIGHT = 72;
const COUNT_BASELINE_Y = 54;

let queueGradientIdCounter = 0;

function useGradientBlinkOpacity() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
}

/**
 * One full turn split into three arcs: fast → slow → fast (same angle each third).
 */
function useVariableOrbitRotation() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const oneTurn = Animated.sequence([
      Animated.timing(spin, {
        toValue: 1 / 3,
        duration: ORBIT_FAST_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(spin, {
        toValue: 2 / 3,
        duration: ORBIT_SLOW_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(spin, {
        toValue: 1,
        duration: ORBIT_FAST_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(oneTurn, { resetBeforeIteration: true });
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const orbitRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const iconCounterRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  return { orbitRotate, iconCounterRotate };
}

function useRingBorderColorMix() {
  const mix = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const phase = Animated.sequence([
      Animated.timing(mix, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(mix, {
        toValue: 0,
        duration: 2000,
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

function AnimatedRingBorder({ children }: { children: React.ReactNode }) {
  const ringMix = useRingBorderColorMix();
  const innerRadius = (RING_SIZE - 12) / 2;

  return (
    <View style={styles.ringClip}>
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
      <View
        style={[
          styles.ringInner,
          {
            borderRadius: innerRadius,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringClip: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    overflow: 'hidden',
  },
  ringInner: {
    position: 'absolute',
    left: 6,
    top: 6,
    right: 6,
    bottom: 6,
    backgroundColor: '#0A0A12',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function OrbitingUserIcons() {
  const { orbitRotate, iconCounterRotate } = useVariableOrbitRotation();
  const n = ORBIT_USER_ICONS.length;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: ORBIT_SIZE,
        height: ORBIT_SIZE,
        transform: [{ rotate: orbitRotate }],
      }}
    >
      {ORBIT_USER_ICONS.map((item, i) => {
        const θ = (2 * Math.PI * i) / n - Math.PI / 2;
        const left = ORBIT_CX + ORBIT_RADIUS * Math.cos(θ) - ORBIT_ICON_HALF;
        const top = ORBIT_CY + ORBIT_RADIUS * Math.sin(θ) - ORBIT_ICON_HALF;
        return (
          <Animated.View
            key={`${String(item.name)}-${i}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: ORBIT_ICON,
              height: ORBIT_ICON,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: iconCounterRotate }],
            }}
          >
            <Ionicons name={item.name} size={22} color={item.color} />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

function QueueCountNumber({ value }: { value: string }) {
  const blinkOpacity = useGradientBlinkOpacity();
  const gradientId = useMemo(() => `queueCountGrad_${++queueGradientIdCounter}`, []);
  const [pink, mid, blue] = gradient.primary;

  const cx = COUNT_SVG_WIDTH / 2;

  return (
    <View
      style={{
        width: COUNT_SVG_WIDTH,
        height: COUNT_SVG_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Base numeral — soft neutral so the blink reads as color shift */}
      <Text
        style={{
          position: 'absolute',
          fontSize: COUNT_FONT_SIZE,
          fontWeight: '800',
          color: 'rgba(232, 232, 248, 0.92)',
          letterSpacing: -1,
        }}
      >
        {value}
      </Text>
      {/* Pulsing gradient layer on top */}
      <Animated.View style={{ position: 'absolute', opacity: blinkOpacity }}>
        <Svg width={COUNT_SVG_WIDTH} height={COUNT_SVG_HEIGHT}>
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={pink} />
              <Stop offset="48%" stopColor={mid} />
              <Stop offset="100%" stopColor={blue} />
            </SvgLinearGradient>
          </Defs>
          <SvgText
            x={cx}
            y={COUNT_BASELINE_Y}
            fill={`url(#${gradientId})`}
            textAnchor="middle"
            fontSize={COUNT_FONT_SIZE}
            fontWeight="800"
            letterSpacing={-1}
          >
            {value}
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
}

export function QueueScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const sessionId = (route.params as { sessionId: string }).sessionId;
  const refreshMe = useAuth((s) => s.refreshMe);
  const [waitingCount, setWaitingCount] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setLeaving(false);
      };
    }, []),
  );

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
  });

  useEffect(() => {
    if (session) setWaitingCount(session.waiting.length);
  }, [session]);

  useSessionRoom(sessionId, (payload) => setWaitingCount(payload.waitingCount));

  useMatchEvents((p) => {
    if (p.sessionId === sessionId) navigation.replace('Match', { matchId: p.matchId });
  });

  const onLeave = async () => {
    setLeaving(true);
    try {
      await leaveQueue(sessionId);
    } catch {
      // ignore
    } finally {
      await refreshMe();
      navigation.replace('Home');
    }
  };

  const countLabel = waitingCount === null ? '—' : String(waitingCount);

  return (
    <Screen>
      <BackgroundGlow />
      <View className="flex-1 items-center justify-center">
        <View
          style={{
            width: ORBIT_SIZE,
            height: ORBIT_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <OrbitingUserIcons />
          <View
            style={{
              width: RING_SIZE,
              height: RING_SIZE,
              borderRadius: RING_SIZE / 2,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7B3FF2',
              shadowOpacity: 0.6,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <AnimatedRingBorder>
              <QueueCountNumber value={countLabel} />
            </AnimatedRingBorder>
          </View>
        </View>

        <Text className="text-white text-2xl font-bold mt-10">{t('queue.title')}</Text>
        <Text className="text-ink-secondary mt-2 text-center px-8">{t('queue.subtitle')}</Text>
        {session ? (
          <Text className="text-ink-secondary mt-4">
            {session.title} · {session.gameName}
          </Text>
        ) : null}
      </View>

      <View className="pb-2">
        <GradientButton
          title={t('queue.leave')}
          onPress={onLeave}
          variant="secondary"
          loading={leaving}
        />
      </View>
    </Screen>
  );
}
