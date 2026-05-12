import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { Avatar } from '../components/ui/Avatar';
import { GradientButton } from '../components/ui/GradientButton';
import { QuickActionChip } from '../components/ui/QuickActionChip';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
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

export function MatchScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const matchId = (route.params as { matchId: string }).matchId;
  const refreshMe = useAuth((s) => s.refreshMe);
  const fade = useFadeIn();
  const [copied, setCopied] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<InteractionType | null>(null);

  const { data: match, refetch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatch(matchId),
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onEnded = () => {
      void refreshMe();
      navigation.replace('Home');
    };
    const onInteraction = () => {
      void refetch();
    };
    socket.on('match:ended', onEnded);
    socket.on('match:interaction', onInteraction);
    return () => {
      socket.off('match:ended', onEnded);
      socket.off('match:interaction', onInteraction);
    };
  }, [navigation, refreshMe, refetch]);

  const expiresInMin = useMemo(() => {
    if (!match) return 0;
    return Math.max(0, Math.round((new Date(match.expiresAt).getTime() - Date.now()) / 60000));
  }, [match]);

  const onCopy = async () => {
    if (!match?.opponent.playerId) return;
    await Clipboard.setStringAsync(match.opponent.playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onAction = async (type: InteractionType) => {
    setLastInteraction(type);
    try {
      await sendInteraction(matchId, type);
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

  if (!match) {
    return (
      <Screen>
        <Text className="text-ink-secondary">{t('common.loading')}</Text>
      </Screen>
    );
  }

  const steps = t('match.guide', { returnObjects: true }) as string[];

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
        <View className="items-center pt-2">
          <Badge label={t('match.expiresIn', { minutes: expiresInMin })} variant="waiting" />
          <Text className="text-white text-3xl font-bold mt-4">{t('match.title')}</Text>
        </View>

        <View className="items-center my-8">
          <Avatar uri={match.opponent.photoUrl} name={match.opponent.name} size={120} />
          <Text className="text-white text-xl font-bold mt-4">{match.opponent.name}</Text>
          {match.opponent.nickname ? (
            <Text className="text-ink-secondary mt-1">@{match.opponent.nickname}</Text>
          ) : null}
        </View>

        <Card variant="tinted" padding={20} radius={20} glow style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: colors.ink.secondary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {t('match.playerIdLabel')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                color: 'white',
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.3,
                flex: 1,
              }}
              numberOfLines={1}
              selectable
            >
              {match.opponent.playerId ?? '—'}
            </Text>
            {copied ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={18} color="#00C853" />
                <Text style={{ color: colors.status.success, fontWeight: '700' }}>
                  {t('match.copied')}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        <Pressable onPress={onCopy} className="active:opacity-90">
          <LinearGradient
            colors={gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 64,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#7B3FF2',
              shadowOpacity: 0.55,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Ionicons name={copied ? 'checkmark' : 'copy'} size={22} color="white" />
            <Text className="text-white text-lg font-bold">
              {copied ? t('match.copied') : t('match.copyId')}
            </Text>
          </LinearGradient>
        </Pressable>

        <Card padding={20} radius={20} style={{ marginTop: 24 }}>
          <Text
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: -0.2,
              marginBottom: 14,
            }}
          >
            {t('match.guideTitle')}
          </Text>
          {steps.map((step, i) => (
            <View
              key={step}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: i < steps.length - 1 ? 12 : 0,
              }}
            >
              <LinearGradient
                colors={gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  shadowColor: '#7B3FF2',
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>{i + 1}</Text>
              </LinearGradient>
              <Text style={{ color: 'white', flex: 1, fontSize: 15, fontWeight: '500' }}>
                {step}
              </Text>
            </View>
          ))}
        </Card>

        <Text className="text-ink-secondary text-sm mt-6 mb-3">{t('common.appName')}</Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {ACTIONS.map(({ type, key }) => (
            <QuickActionChip
              key={type}
              label={t(labelKeys[key])}
              selected={lastInteraction === type}
              onPress={() => onAction(type)}
            />
          ))}
        </View>

        <GradientButton title={t('match.endMatch')} onPress={onEnd} variant="secondary" />
        <View className="h-6" />
      </Animated.View>
    </Screen>
  );
}
