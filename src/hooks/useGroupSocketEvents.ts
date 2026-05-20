import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getSocket } from '../socket';
import { useNotificationStore } from '../store/notificationStore';

type GroupSessionRsvpPayload = {
  groupId: string;
  groupName: string;
  sessionId: string;
  userId: string;
  userName: string;
  status: 'confirmed' | 'declined';
};

export function useGroupSocketEvents() {
  const { t } = useTranslation();
  const showTopToast = useNotificationStore((s) => s.showTopToast);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onRsvp = (payload: GroupSessionRsvpPayload) => {
      const message =
        payload.status === 'confirmed'
          ? t('groups.rsvpConfirmedBroadcast', {
              name: payload.userName,
              group: payload.groupName,
            })
          : t('groups.rsvpDeclinedBroadcast', {
              name: payload.userName,
              group: payload.groupName,
            });
      showTopToast(message, 4500);
    };

    socket.on('group:session-rsvp', onRsvp);
    return () => {
      socket.off('group:session-rsvp', onRsvp);
    };
  }, [showTopToast, t]);
}
