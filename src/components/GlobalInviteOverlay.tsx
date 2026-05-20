import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { fetchPendingGroupInvites, respondGroupInvite } from '../api/social';
import { useNotificationStore } from '../store/notificationStore';
import { colors } from '../theme/tokens';

const CARD_BG = 'rgba(18,18,26,0.97)';
const CARD_BORDER = 'rgba(123,63,242,0.45)';

export function GlobalInviteOverlay() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toastMessage = useNotificationStore((s) => s.topToastMessage);
  const hideToast = useNotificationStore((s) => s.hideTopToast);
  const [busyAction, setBusyAction] = React.useState<'accept' | 'decline' | null>(null);

  const { data: invites = [] } = useQuery({
    queryKey: ['group-invites', 'pending'],
    queryFn: fetchPendingGroupInvites,
    refetchInterval: 8000,
    refetchOnReconnect: true,
  });

  const topInvite = invites[0];
  const showInviteCard = !!topInvite;
  const showToast = !!toastMessage;

  const onRespond = async (accept: boolean) => {
    if (!topInvite || busyAction) return;
    setBusyAction(accept ? 'accept' : 'decline');
    try {
      await respondGroupInvite(topInvite.id, accept);
      await qc.invalidateQueries({ queryKey: ['group-invites', 'pending'] });
      await qc.invalidateQueries({ queryKey: ['groups'] });
      await qc.invalidateQueries({ queryKey: ['chats'] });
    } finally {
      setBusyAction(null);
    }
  };

  if (!showToast && !showInviteCard) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={[styles.box, { marginTop: insets.top + 8 }]}>
        {showToast ? (
          <Pressable onPress={hideToast} style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Pressable>
        ) : null}

        {showInviteCard && topInvite ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t('groups.inviteLabel')}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {topInvite.group.name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {t('groups.inviteFrom', { name: topInvite.inviter.name })}
            </Text>

            <View style={styles.actions}>
              <Pressable
                disabled={!!busyAction}
                onPress={() => void onRespond(false)}
                style={({ pressed }) => [
                  styles.declineBtn,
                  (pressed || !!busyAction) && styles.btnDim,
                ]}
              >
                {busyAction === 'decline' ? (
                  <ActivityIndicator color={colors.ink.secondary} size="small" />
                ) : (
                  <Text style={styles.declineText}>{t('groups.inviteDecline')}</Text>
                )}
              </Pressable>

              <Pressable
                disabled={!!busyAction}
                onPress={() => void onRespond(true)}
                style={({ pressed }) => [
                  styles.acceptBtn,
                  (pressed || !!busyAction) && styles.btnDim,
                ]}
              >
                {busyAction === 'accept' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.acceptText}>{t('groups.inviteAccept')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  box: {
    marginHorizontal: 12,
    gap: 8,
  },
  toast: {
    backgroundColor: 'rgba(0, 209, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastText: {
    color: '#041019',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    padding: 12,
  },
  label: {
    color: colors.brand.purple,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: colors.ink.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  declineBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.purple,
  },
  declineText: {
    color: colors.ink.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  btnDim: {
    opacity: 0.75,
  },
});
