import { create } from 'zustand';

interface NotificationState {
  topToastMessage: string | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  showTopToast: (message: string, durationMs?: number) => void;
  hideTopToast: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  topToastMessage: null,
  timeoutId: null,

  showTopToast: (message, durationMs = 3000) => {
    const prev = get().timeoutId;
    if (prev) clearTimeout(prev);

    const timeoutId = setTimeout(() => {
      set({ topToastMessage: null, timeoutId: null });
    }, durationMs);

    set({ topToastMessage: message, timeoutId });
  },

  hideTopToast: () => {
    const current = get().timeoutId;
    if (current) clearTimeout(current);
    set({ topToastMessage: null, timeoutId: null });
  },
}));
