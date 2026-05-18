import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { fetchMessages, markChatRead, sendChatMessage } from '../api/social';
import { getSocket } from '../socket';
import { colors } from '../theme/tokens';
import { useAuth } from '../store/authStore';

export function ChatScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { conversationId, title } = route.params as { conversationId: string; title?: string };
  const [text, setText] = useState('');
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  useEffect(() => {
    void markChatRead(conversationId);
    const socket = getSocket();
    if (!socket) return;
    const onMessage = () => qc.invalidateQueries({ queryKey: ['chat', conversationId] });
    socket.on('chat:message', onMessage);
    socket.on('chat:read', onMessage);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:read', onMessage);
    };
  }, [conversationId, qc]);

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    await sendChatMessage(conversationId, body);
    await qc.invalidateQueries({ queryKey: ['chat', conversationId] });
    await qc.invalidateQueries({ queryKey: ['chats'] });
  };

  const messages = data?.messages ?? [];

  return (
    <Screen padded={false}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.brand.pink }}>{t('common.back')}</Text>
        </Pressable>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginTop: 8 }}>
          {title ?? t('chats.title')}
        </Text>
        {data?.pinned?.[0] ? (
          <Text style={{ color: colors.brand.blue, marginTop: 6, fontSize: 12 }}>
            📌 {data.pinned[0].body}
          </Text>
        ) : null}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: mine ? 'rgba(123,63,242,0.35)' : 'rgba(255,255,255,0.08)',
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: 'white' }}>{item.body}</Text>
              </View>
            );
          }}
        />
        <View style={{ flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('chats.placeholder')}
            placeholderTextColor={colors.ink.disabled}
            style={{
              flex: 1,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />
          <Pressable
            onPress={onSend}
            style={{
              backgroundColor: colors.brand.purple,
              borderRadius: 12,
              paddingHorizontal: 16,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>{t('chats.send')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
