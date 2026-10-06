import { create } from 'zustand';

interface UIState {
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  // Add more global UI states here
}

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
}));
