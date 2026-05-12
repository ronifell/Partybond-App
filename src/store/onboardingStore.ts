import { create } from 'zustand';

interface OnboardingState {
  photoUri: string | null;
  selectedGameId: string | null;
  setPhotoUri: (uri: string | null) => void;
  setSelectedGameId: (id: string | null) => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  photoUri: null,
  selectedGameId: null,
  setPhotoUri: (photoUri) => set({ photoUri }),
  setSelectedGameId: (selectedGameId) => set({ selectedGameId }),
  reset: () => set({ photoUri: null, selectedGameId: null }),
}));
