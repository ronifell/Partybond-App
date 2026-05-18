import React, { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type { GroupInvite } from '../api/types';
import { colors } from '../theme/tokens';

interface Props {
  invite: GroupInvite;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}

export function GroupInviteCard({ invite, onAccept, onDecline }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  const run = async (action: 'accept' | 'decline', fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const inviterPhoto = invite.inviter.photoUrl;
  const groupPhoto = invite.group.photoUrl;

  return (
    <View
      style={{
        padding: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(123, 63, 242, 0.12)',
        borderWidth: 1.5,
        borderColor: 'rgba(123, 63, 242, 0.35)',
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#2a2040',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {groupPhoto ? (
            <Image source={{ uri: groupPhoto }} style={{ width: 44, height: 44 }} />
          ) : (
            <Ionicons name="people" size={22} color={colors.brand.purple} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.ink.secondary, fontSize: 11, fontWeight: '700' }}>
            {t('groups.inviteLabel')}
          </Text>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }} numberOfLines={1}>
            {invite.group.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            {inviterPhoto ? (
              <Image source={{ uri: inviterPhoto }} style={{ width: 18, height: 18, borderRadius: 9 }} />
            ) : (
              <Ionicons name="person-circle-outline" size={18} color={colors.ink.secondary} />
            )}
            <Text style={{ color: colors.ink.secondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
              {t('groups.inviteFrom', { name: invite.inviter.name })}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => run('decline', onDecline)}
          disabled={!!busy}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 11,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.18)',
            backgroundColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
            opacity: pressed || busy ? 0.75 : 1,
          })}
        >
          {busy === 'decline' ? (
            <ActivityIndicator color={colors.ink.secondary} size="small" />
          ) : (
            <Text style={{ color: colors.ink.primary, fontWeight: '700', fontSize: 14 }}>
              {t('groups.inviteDecline')}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => run('accept', onAccept)}
          disabled={!!busy}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 11,
            borderRadius: 12,
            backgroundColor: colors.brand.purple,
            alignItems: 'center',
            opacity: pressed || busy ? 0.85 : 1,
          })}
        >
          {busy === 'accept' ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>
              {t('groups.inviteAccept')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
