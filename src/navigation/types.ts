export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingName: undefined;
  OnboardingPhoto: undefined;
  OnboardingGame: undefined;
  OnboardingGameInfo: { gameId: string };
  OnboardingComplete: undefined;
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
