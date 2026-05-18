import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BottomTabBar } from '../components/BottomTabBar';
import { useMainTabs } from '../hooks/useMainTabs';
import { fetchConversations } from '../api/social';
import { colors } from '../theme/tokens';

export function ChatsScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabs = useMainTabs(navigation, 'messages');
  const { data: conversations = [], refetch, isRefetching } = useQuery({
    queryKey: ['chats'],
    queryFn: fetchConversations,
  });

  return (
    <Screen padded={false}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{t('chats.title')}</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 8 }}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('Chat', { conversationId: item.id, title: item.title })}
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>
              {item.title ?? item.peer?.name ?? t('chats.unnamed')}
            </Text>
            {item.lastMessage ? (
              <Text style={{ color: colors.ink.secondary, marginTop: 4 }} numberOfLines={1}>
                {item.lastMessage.body}
              </Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.ink.secondary, textAlign: 'center', marginTop: 40 }}>
            {t('chats.empty')}
          </Text>
        }
      />
      <BottomTabBar active="messages" tabs={tabs} />
    </Screen>
  );
}
