import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { GradientButton } from '../components/ui/GradientButton';
import { getSession, leaveQueue } from '../api/sessions';
import { useAuth } from '../store/authStore';
import { useSessionRoom } from '../hooks/useSessionRoom';
import { useMatchEvents } from '../hooks/useMatchEvents';
import { gradient } from '../theme/tokens';

function useSpinValue() {
  const [value] = useState(new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

export function QueueScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const sessionId = (route.params as { sessionId: string }).sessionId;
  const refreshMe = useAuth((s) => s.refreshMe);
  const [waitingCount, setWaitingCount] = useState<number | null>(null);
  const spin = useSpinValue();

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
    try {
      await leaveQueue(sessionId);
    } catch {
      // ignore
    } finally {
      await refreshMe();
      navigation.replace('Home');
    }
  };

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Screen>
      <BackgroundGlow />
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: rotation }],
            shadowColor: '#7B3FF2',
            shadowOpacity: 0.6,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <LinearGradient
            colors={gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 200, height: 200, borderRadius: 100, padding: 6 }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 100,
                backgroundColor: '#0A0A12',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white text-5xl font-bold">{waitingCount ?? '—'}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Text className="text-white text-2xl font-bold mt-10">{t('queue.title')}</Text>
        <Text className="text-ink-secondary mt-2 text-center px-8">{t('queue.subtitle')}</Text>
        {session ? (
          <Text className="text-ink-secondary mt-4">
            {session.title} · {session.gameName}
          </Text>
        ) : null}
      </View>

      <View className="pb-2">
        <GradientButton title={t('queue.leave')} onPress={onLeave} variant="secondary" />
      </View>
    </Screen>
  );
}
