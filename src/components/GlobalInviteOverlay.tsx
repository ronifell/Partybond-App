import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { fetchPendingGroupInvites, respondGroupInvite } from '../api/social';
import {
  fetchPendingSessionSquadInvites,
  respondSessionSquadInvite,
} from '../api/sessions';
import { getApiError } from '../api/client';
import { useAuth } from '../store/authStore';
import {
  navigateToEditGameProfile,
  navigateToMatch,
  navigateToQueue,
} from '../navigation/navigationRef';
import { useNotificationStore } from '../store/notificationStore';
import { colors } from '../theme/tokens';

const CARD_BG = 'rgba(18,18,26,0.97)';
const CARD_BORDER = 'rgba(123,63,242,0.45)';
const SQUAD_BORDER = 'rgba(0,209,255,0.45)';

export function GlobalInviteOverlay() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toastMessage = useNotificationStore((s) => s.topToastMessage);
  const hideToast = useNotificationStore((s) => s.hideTopToast);
  const showTopToast = useNotificationStore((s) => s.showTopToast);
  const refreshMe = useAuth((s) => s.refreshMe);
  const [busyAction, setBusyAction] = React.useState<'accept' | 'decline' | null>(null);

  const { data: groupInvites = [] } = useQuery({
    queryKey: ['group-invites', 'pending'],
    queryFn: fetchPendingGroupInvites,
    refetchInterval: 8000,
    refetchOnReconnect: true,
  });

  const { data: squadInvites = [] } = useQuery({
    queryKey: ['session-squad-invites', 'pending'],
    queryFn: fetchPendingSessionSquadInvites,
    refetchInterval: 8000,
    refetchOnReconnect: true,
  });

  const squadInvite = squadInvites[0];
  const groupInvite = groupInvites[0];
  const showSquadCard = !!squadInvite;
  const showGroupCard = !showSquadCard && !!groupInvite;
  const showInviteCard = showSquadCard || showGroupCard;
  const showToast = !!toastMessage;

  const onRespondGroup = async (accept: boolean) => {
    if (!groupInvite || busyAction) return;
    setBusyAction(accept ? 'accept' : 'decline');
    try {
      await respondGroupInvite(groupInvite.id, accept);
      await qc.invalidateQueries({ queryKey: ['group-invites', 'pending'] });
      await qc.invalidateQueries({ queryKey: ['groups'] });
      await qc.invalidateQueries({ queryKey: ['chats'] });
    } finally {
      setBusyAction(null);
    }
  };

  const onRespondSquad = async (accept: boolean) => {
    if (!squadInvite || busyAction) return;
    setBusyAction(accept ? 'accept' : 'decline');
    const gameId = squadInvite.session.gameId;
    const sessionId = squadInvite.sessionId;
    try {
      if (!accept) {
        await respondSessionSquadInvite(squadInvite.id, false);
        await qc.invalidateQueries({ queryKey: ['session-squad-invites', 'pending'] });
        return;
      }

      const result = await respondSessionSquadInvite(squadInvite.id, true);
      await qc.invalidateQueries({ queryKey: ['session-squad-invites', 'pending'] });
      await qc.invalidateQueries({ queryKey: ['sessions'] });
      await qc.invalidateQueries({ queryKey: ['session', sessionId] });
      await refreshMe();

      const user = useAuth.getState().user;
      if (user?.state === 'in_match' && user.currentMatchId) {
        navigateToMatch(user.currentMatchId);
      } else if (result.joinedQueue || user?.currentSessionId === result.sessionId) {
        navigateToQueue(result.sessionId);
      } else {
        showTopToast(t('createSquad.inviteAcceptNoQueue'), 4000);
      }
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'no_game_profile' && gameId) {
        navigateToEditGameProfile(gameId);
      } else {
        showTopToast(apiErr.message, 4000);
      }
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

        {showSquadCard && squadInvite ? (
          <View style={[styles.card, styles.squadCard]}>
            <Text style={[styles.label, styles.squadLabel]}>{t('createSquad.inviteLabel')}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {squadInvite.session.gameName}
            </Text>
            <Text style={styles.subtitle} numberOfLines={3}>
              {t('createSquad.inviteBody', {
                name: squadInvite.inviter.name,
                game: squadInvite.session.gameName,
              })}
            </Text>

            <View style={styles.actions}>
              <Pressable
                disabled={!!busyAction}
                onPress={() => void onRespondSquad(false)}
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
                onPress={() => void onRespondSquad(true)}
                style={({ pressed }) => [
                  styles.acceptBtn,
                  styles.squadAcceptBtn,
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

        {showGroupCard && groupInvite ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t('groups.inviteLabel')}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {groupInvite.group.name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {t('groups.inviteFrom', { name: groupInvite.inviter.name })}
            </Text>

            <View style={styles.actions}>
              <Pressable
                disabled={!!busyAction}
                onPress={() => void onRespondGroup(false)}
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
                onPress={() => void onRespondGroup(true)}
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
  squadCard: {
    borderColor: SQUAD_BORDER,
  },
  label: {
    color: colors.brand.purple,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  squadLabel: {
    color: colors.brand.blue,
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
  squadAcceptBtn: {
    backgroundColor: colors.brand.blue,
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
