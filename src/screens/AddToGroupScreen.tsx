import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { fetchGroups, inviteToGroup } from '../api/social';
import { colors } from '../theme/tokens';

export function AddToGroupScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const { userId, name } = route.params as { userId: string; name: string };
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });

  const onPick = async (groupId: string) => {
    await inviteToGroup(groupId, userId);
    navigation.goBack();
  };

  return (
    <Screen>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>
        {t('recent.addToGroupFor', { name })}
      </Text>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        style={{ marginTop: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item.id)}
            style={{
              padding: 14,
              marginBottom: 8,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.ink.secondary, marginTop: 20 }}>{t('groups.empty')}</Text>
        }
      />
      <Pressable onPress={() => navigation.navigate('Groups')} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.brand.blue, fontWeight: '700' }}>{t('groups.createNew')}</Text>
      </Pressable>
    </Screen>
  );
}
