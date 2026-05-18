import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { GradientButton } from '../components/ui/GradientButton';
import {
  createGroupSchedule,
  fetchGroup,
  fetchSquadFillSuggestions,
  inviteSquadFill,
  setSessionRsvp,
} from '../api/social';
import { colors } from '../theme/tokens';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function GroupDetailScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const groupId = (route.params as { groupId: string }).groupId;
  const qc = useQueryClient();
  const [suggestions, setSuggestions] = useState<Array<{ userId: string; name: string }>>([]);

  const { data: group, refetch } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId),
  });

  const onSchedule = async () => {
    const d = new Date();
    const day = d.getDay();
    await createGroupSchedule(groupId, { dayOfWeek: day === 0 ? 2 : day, timeLocal: '21:00' });
    await refetch();
  };

  const onSquadFill = async () => {
    const data = await fetchSquadFillSuggestions(groupId);
    setSuggestions(data.suggestions);
  };

  const onInvite = async (userId: string) => {
    await inviteSquadFill(groupId, userId, group?.nextSession?.id);
  };

  const onRsvp = async (status: 'confirmed' | 'declined') => {
    if (!group?.nextSession) return;
    await setSessionRsvp(group.nextSession.id, status);
    await refetch();
  };

  if (!group) {
    return (
      <Screen>
        <Text style={{ color: colors.ink.secondary }}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32, gap: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.brand.pink, fontWeight: '700' }}>{t('common.back')}</Text>
        </Pressable>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>{group.name}</Text>

        {group.nextSession ? (
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: 'rgba(123,63,242,0.15)' }}>
            <Text style={{ color: 'white', fontWeight: '800' }}>{t('groups.nextSession')}</Text>
            <Text style={{ color: colors.ink.secondary, marginTop: 4 }}>
              {new Date(group.nextSession.startsAt).toLocaleString()}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <GradientButton title={t('groups.confirm')} size="sm" onPress={() => onRsvp('confirmed')} />
              <GradientButton
                title={t('groups.decline')}
                size="sm"
                variant="secondary"
                onPress={() => onRsvp('declined')}
              />
            </View>
          </View>
        ) : null}

        <GradientButton title={t('groups.schedule')} onPress={onSchedule} size="md" />
        {group.conversationId ? (
          <GradientButton
            title={t('groups.openChat')}
            variant="secondary"
            onPress={() => navigation.navigate('Chat', { conversationId: group.conversationId })}
          />
        ) : null}
        <GradientButton title={t('groups.completeSquad')} onPress={onSquadFill} size="md" />

        {suggestions.map((s) => (
          <Pressable
            key={s.userId}
            onPress={() => onInvite(s.userId)}
            style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{s.name}</Text>
            <Text style={{ color: colors.brand.blue, fontSize: 12, marginTop: 4 }}>{t('groups.invite')}</Text>
          </Pressable>
        ))}

        <Text style={{ color: colors.ink.secondary, fontWeight: '700' }}>{t('groups.members')}</Text>
        {group.members.map((m) => (
          <Text key={m.id} style={{ color: 'white' }}>
            {m.name} {m.isOnline ? '· online' : ''}
          </Text>
        ))}

        {group.schedules.map((s) => (
          <Text key={s.id} style={{ color: colors.ink.secondary }}>
            {DAYS[s.dayOfWeek]} {s.timeLocal} ({s.frequency})
          </Text>
        ))}
      </ScrollView>
    </Screen>
  );
}
