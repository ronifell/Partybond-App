import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { GradientButton } from '../components/ui/GradientButton';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { getSession, joinQueue } from '../api/sessions';
import { useAuth } from '../store/authStore';
import { useSessionRoom } from '../hooks/useSessionRoom';
import { useMatchEvents } from '../hooks/useMatchEvents';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

export function SessionScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const sessionId = (route.params as { sessionId: string }).sessionId;
  const refreshMe = useAuth((s) => s.refreshMe);
  const qc = useQueryClient();
  const [joining, setJoining] = useState(false);

  const { data: session, refetch } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
  });

  useSessionRoom(sessionId, () => {
    void refetch();
  });

  useMatchEvents((p) => {
    if (p.sessionId === sessionId) navigation.replace('Match', { matchId: p.matchId });
  });

  const onJoin = async () => {
    setJoining(true);
    try {
      await joinQueue(sessionId);
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigation.replace('Queue', { sessionId });
    } catch (err) {
      console.warn('Join failed', getApiError(err));
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen scroll>
      <BackgroundGlow />

      <View className="flex-row items-center mb-4">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2 active:opacity-70">
          <Ionicons name="chevron-back" size={26} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-bold ml-2">{t('session.title')}</Text>
      </View>

      {session ? (
        <>
          <Card variant="tinted" padding={22} radius={22} glow style={{ marginBottom: 24 }}>
            <Badge
              label={session.status === 'active' ? t('home.now') : t('home.startsIn', { minutes: 0 })}
              variant={session.status === 'active' ? 'active' : 'scheduled'}
            />
            <Text
              style={{
                color: 'white',
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.4,
                marginTop: 12,
                marginBottom: 6,
              }}
            >
              {session.title}
            </Text>
            <Text style={{ color: colors.ink.secondary, fontSize: 14, fontWeight: '500' }}>
              {session.gameName} · {t(`createSession.${session.gameMode}`)} · {session.playersNeeded}P
            </Text>
          </Card>

          <Text
            style={{
              color: colors.ink.secondary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 14,
              marginLeft: 4,
            }}
          >
            {t('session.playersInQueue')}
          </Text>
          {session.waiting.length === 0 ? (
            <Card padding={20}>
              <Text style={{ color: colors.ink.secondary, textAlign: 'center' }}>
                {t('home.empty')}
              </Text>
            </Card>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {session.waiting.map((u) => (
                <View key={u.id} style={{ alignItems: 'center', width: 80 }}>
                  <Avatar uri={u.photoUrl} name={u.name} size={56} />
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '600',
                      marginTop: 8,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {u.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={{ color: colors.ink.secondary }}>{t('common.loading')}</Text>
      )}

      <View className="mt-auto pt-10">
        <GradientButton title={t('session.joinQueue')} onPress={onJoin} loading={joining} />
      </View>
    </Screen>
  );
}
