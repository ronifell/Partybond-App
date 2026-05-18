import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BottomTabBar } from '../components/BottomTabBar';
import { GradientButton } from '../components/ui/GradientButton';
import { useMainTabs } from '../hooks/useMainTabs';
import { createGroup, fetchGroups } from '../api/social';
import { colors } from '../theme/tokens';

export function GroupsScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabs = useMainTabs(navigation, 'sessions');
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: groups = [], refetch, isRefetching } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });

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

  return (
    <Screen padded={false}>
      <View style={{ padding: 16, gap: 10 }}>
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
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
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
          <Text style={{ color: colors.ink.secondary, textAlign: 'center', marginTop: 24 }}>
            {t('groups.empty')}
          </Text>
        }
      />
      <BottomTabBar active="sessions" tabs={tabs} />
    </Screen>
  );
}
