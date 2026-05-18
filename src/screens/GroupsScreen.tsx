import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BottomTabBar } from '../components/BottomTabBar';
import { GradientButton } from '../components/ui/GradientButton';
import { GroupInviteCard } from '../components/GroupInviteCard';
import { useMainTabs } from '../hooks/useMainTabs';
import {
  createGroup,
  fetchGroups,
  fetchPendingGroupInvites,
  respondGroupInvite,
} from '../api/social';
import { colors } from '../theme/tokens';

export function GroupsScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabs = useMainTabs(navigation, 'sessions');
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: groups = [], refetch: refetchGroups, isRefetching } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });

  const {
    data: invites = [],
    refetch: refetchInvites,
    isRefetching: invitesRefetching,
  } = useQuery({
    queryKey: ['group-invites', 'pending'],
    queryFn: fetchPendingGroupInvites,
  });

  useFocusEffect(
    useCallback(() => {
      void refetchInvites();
      void refetchGroups();
    }, [refetchInvites, refetchGroups]),
  );

  const onRefresh = () => {
    void refetchGroups();
    void refetchInvites();
  };

  const onCreate = async () => {
    if (name.trim().length < 2) return;
    setCreating(true);
    try {
      const g = await createGroup(name.trim());
      setName('');
      await qc.invalidateQueries({ queryKey: ['groups'] });
      navigation.navigate('GroupDetail', { groupId: g.id });
    } finally {
      setCreating(false);
    }
  };

  const onRespondInvite = async (inviteId: string, accept: boolean, groupId?: string) => {
    const result = await respondGroupInvite(inviteId, accept);
    await qc.invalidateQueries({ queryKey: ['group-invites', 'pending'] });
    await qc.invalidateQueries({ queryKey: ['groups'] });
    if (accept) {
      const id = groupId ?? (result as { groupId?: string }).groupId;
      if (id) navigation.navigate('GroupDetail', { groupId: id });
    }
  };

  const listHeader = (
    <View style={{ gap: 14, marginBottom: 8 }}>
      {invites.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.brand.purple, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
            {t('groups.pendingInvites', { count: invites.length })}
          </Text>
          {invites.map((invite) => (
            <GroupInviteCard
              key={invite.id}
              invite={invite}
              onAccept={() => onRespondInvite(invite.id, true, invite.group.id)}
              onDecline={() => onRespondInvite(invite.id, false)}
            />
          ))}
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{t('groups.title')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('groups.namePlaceholder')}
          placeholderTextColor={colors.ink.disabled}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 12,
            color: 'white',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        />
        <GradientButton title={t('groups.create')} onPress={onCreate} loading={creating} size="md" />
      </View>
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 10 }}
        refreshing={isRefetching || invitesRefetching}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>{item.name}</Text>
            <Text style={{ color: colors.ink.secondary, marginTop: 4 }}>
              {t('groups.memberCount', { count: item.memberCount })}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          invites.length === 0 ? (
            <Text style={{ color: colors.ink.secondary, textAlign: 'center', marginTop: 24 }}>
              {t('groups.empty')}
            </Text>
          ) : null
        }
      />
      <BottomTabBar active="sessions" tabs={tabs} />
    </Screen>
  );
}
