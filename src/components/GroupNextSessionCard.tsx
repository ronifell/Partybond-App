import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { GroupDetail } from '../api/types';
import {
  getMyRsvpStatus,
  getSessionRsvpResponses,
  shouldShowRsvpActions,
} from '../utils/groupSession';
import { colors } from '../theme/tokens';

const CARD_BORDER = 'rgba(255,255,255,0.10)';

type Props = {
  group: GroupDetail;
  userId: string | undefined;
  onRsvp: (status: 'confirmed' | 'declined') => void;
};

export function GroupNextSessionCard({ group, userId, onRsvp }: Props) {
  const { t } = useTranslation();
  if (!group.nextSession) return null;

  const myRsvpStatus = getMyRsvpStatus(group, userId);
  const showActions = shouldShowRsvpActions(myRsvpStatus);
  const responses = getSessionRsvpResponses(group);

  return (
    <View style={styles.sessionCard}>
      <Text style={styles.sessionTitle}>{t('groups.nextSession')}</Text>
      <Text style={styles.sessionTime}>
        {new Date(group.nextSession.startsAt).toLocaleString()}
      </Text>

      {showActions ? (
        <View style={styles.sessionActions}>
          <Pressable
            onPress={() => onRsvp('confirmed')}
            style={[
              styles.sessionRsvpBtn,
              myRsvpStatus === 'confirmed' && styles.sessionRsvpBtnActive,
            ]}
          >
            <Text style={styles.sessionRsvpText}>{t('groups.confirm')}</Text>
          </Pressable>
          <Pressable
            onPress={() => onRsvp('declined')}
            style={[
              styles.sessionRsvpBtnOutline,
              myRsvpStatus === 'declined' && styles.sessionRsvpBtnDeclinedActive,
            ]}
          >
            <Text style={styles.sessionRsvpTextOutline}>{t('groups.decline')}</Text>
          </Pressable>
        </View>
      ) : null}

      {responses.length > 0 ? (
        <View style={styles.rsvpList}>
          <Text style={styles.rsvpListTitle}>{t('groups.sessionResponses')}</Text>
          {responses.map((entry) => {
            const confirmed = entry.status === 'confirmed';
            return (
              <View key={entry.userId} style={styles.rsvpRow}>
                <Ionicons
                  name={confirmed ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={confirmed ? colors.status.success : colors.brand.pink}
                />
                <Text style={styles.rsvpName} numberOfLines={1}>
                  {entry.name}
                </Text>
                <Text
                  style={[
                    styles.rsvpStatus,
                    confirmed ? styles.rsvpStatusConfirmed : styles.rsvpStatusDeclined,
                  ]}
                >
                  {confirmed ? t('groups.rsvpStatusConfirmed') : t('groups.rsvpStatusDeclined')}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: 'rgba(123,63,242,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.35)',
    padding: 14,
    marginBottom: 18,
  },
  sessionTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  sessionTime: {
    color: colors.ink.secondary,
    marginTop: 4,
    fontSize: 13,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sessionRsvpBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brand.purple,
    alignItems: 'center',
  },
  sessionRsvpBtnActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  sessionRsvpBtnDeclinedActive: {
    borderColor: colors.brand.pink,
    backgroundColor: 'rgba(255,77,166,0.15)',
  },
  sessionRsvpText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  sessionRsvpBtnOutline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
  },
  sessionRsvpTextOutline: {
    color: colors.ink.secondary,
    fontWeight: '700',
    fontSize: 13,
  },
  rsvpList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  rsvpListTitle: {
    color: colors.brand.pink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rsvpName: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  rsvpStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  rsvpStatusConfirmed: {
    color: colors.status.success,
  },
  rsvpStatusDeclined: {
    color: colors.brand.pink,
  },
});
