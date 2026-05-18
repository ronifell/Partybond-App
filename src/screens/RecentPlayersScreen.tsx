import React from 'react';
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BottomTabBar } from '../components/BottomTabBar';
import { useMainTabs } from '../hooks/useMainTabs';
import { fetchRecentPlayers } from '../api/social';
import { colors } from '../theme/tokens';

export function RecentPlayersScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabs = useMainTabs(navigation, 'matches');
  const { data: players = [], refetch, isRefetching } = useQuery({
    queryKey: ['recent-players'],
    queryFn: fetchRecentPlayers,
  });

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{t('recent.title')}</Text>
        <Text style={{ color: colors.ink.secondary, marginTop: 4 }}>{t('recent.subtitle')}</Text>
      </View>
      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Pressable onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#2a2040' }} />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>{item.nickname}</Text>
                  <Text style={{ color: colors.ink.secondary, marginTop: 2 }}>{item.gameName}</Text>
                  <Text style={{ color: colors.ink.secondary, fontSize: 12, marginTop: 2 }}>
                    {new Date(item.lastPlayedAt).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: item.isOnline ? '#7CECA1' : colors.ink.disabled,
                  }}
                />
              </View>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable
                onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
                style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: 'rgba(123,63,242,0.2)' }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700', fontSize: 12 }}>
                  {t('recent.viewProfile')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('AddToGroup', { userId: item.userId, name: item.nickname })}
                style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: 'rgba(0,209,255,0.15)' }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700', fontSize: 12 }}>
                  {t('recent.addToGroup')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.ink.secondary, textAlign: 'center', marginTop: 40 }}>
            {t('recent.empty')}
          </Text>
        }
      />
      <BottomTabBar active="matches" tabs={tabs} />
    </Screen>
  );
}
