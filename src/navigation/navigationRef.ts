import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateToQueue(sessionId: string) {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(StackActions.replace('Queue', { sessionId }));
}

export function navigateToMatch(matchId: string) {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(StackActions.replace('Match', { matchId }));
}

export function navigateToEditGameProfile(gameId: string) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('EditGameProfile', { gameId });
}
