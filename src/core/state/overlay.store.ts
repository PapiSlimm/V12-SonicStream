import { create } from 'zustand';

interface OverlayState {
  isNotificationsOpen: boolean;
  isAuthModalOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isNotificationsOpen: false,
  isAuthModalOpen: false,
  setNotificationsOpen: (open) => set({ isNotificationsOpen: open }),
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
}));
