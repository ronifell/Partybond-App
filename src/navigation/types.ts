export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  OnboardingName: undefined;
  OnboardingPhoto: undefined;
  OnboardingGame: undefined;
  OnboardingGameInfo: { gameId: string };
};

export type AppStackParamList = {
  GameSelect: undefined;
  Home: undefined;
  CreateSession: undefined;
  Session: { sessionId: string };
  Queue: { sessionId: string };
  Match: { matchId: string };
  EditGameProfile: { gameId: string };
  EditProfile: undefined;
};
