import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getSocket } from '../socket';
import { navigateToMatch } from '../navigation/navigationRef';
import { useMatchEvents } from './useMatchEvents';

/**
 * Global squad-invite + match handlers so accept → queue → match works from any screen.
 */
export function useSessionSquadRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onSquadInvite = () => {
      void qc.invalidateQueries({ queryKey: ['session-squad-invites', 'pending'] });
    };

    socket.on('session:squad-invite', onSquadInvite);
    return () => {
      socket.off('session:squad-invite', onSquadInvite);
    };
  }, [qc]);

  const onMatchCreated = useCallback(
    (payload: { matchId: string; sessionId: string }) => {
      navigateToMatch(payload.matchId);
    },
    [],
  );

  useMatchEvents(onMatchCreated);
}
