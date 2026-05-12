import { useEffect } from 'react';
import { getSocket } from '../socket';

interface QueueUpdatePayload {
  sessionId: string;
  waitingCount: number;
}

export function useSessionRoom(
  sessionId: string | null,
  onQueueUpdate?: (payload: QueueUpdatePayload) => void,
): void {
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !sessionId) return;
    socket.emit('session:subscribe', sessionId);
    const handler = (payload: QueueUpdatePayload) => {
      if (payload.sessionId === sessionId) onQueueUpdate?.(payload);
    };
    socket.on('queue:update', handler);
    return () => {
      socket.off('queue:update', handler);
      socket.emit('session:unsubscribe', sessionId);
    };
  }, [sessionId, onQueueUpdate]);
}
