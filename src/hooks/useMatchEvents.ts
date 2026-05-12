import { useEffect } from 'react';
import { getSocket } from '../socket';

interface MatchCreatedPayload {
  matchId: string;
  sessionId: string;
}

export function useMatchEvents(onMatchCreated: (payload: MatchCreatedPayload) => void): void {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (payload: MatchCreatedPayload) => onMatchCreated(payload);
    socket.on('match:created', handler);
    return () => {
      socket.off('match:created', handler);
    };
  }, [onMatchCreated]);
}
