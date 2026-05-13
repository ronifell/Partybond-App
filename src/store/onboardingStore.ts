import { create } from 'zustand';

interface OnboardingState {
  photoUri: string | null;
  selectedGameId: string | null;
  /** When true, keep showing the onboarding stack so the celebration screen can appear after profile is complete. */
  celebrationPending: boolean;
  setPhotoUri: (uri: string | null) => void;
  setSelectedGameId: (id: string | null) => void;
  setCelebrationPending: (pending: boolean) => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  photoUri: null,
  selectedGameId: null,
  celebrationPending: false,
  setPhotoUri: (photoUri) => set({ photoUri }),
  setSelectedGameId: (selectedGameId) => set({ selectedGameId }),
  setCelebrationPending: (celebrationPending) => set({ celebrationPending }),
  reset: () => set({ photoUri: null, selectedGameId: null, celebrationPending: false }),
}));
