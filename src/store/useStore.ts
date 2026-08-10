import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  theme_color?: string;
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

interface ChatState {
  messages: any[];
  setMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
  addMessage: (message: any) => void;
}

interface AIState {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  error: { message: string; action?: () => void } | null;
  setError: (error: { message: string; action?: () => void } | null) => void;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState & { subscriptionStatus: string; fetchSubscription: () => Promise<void> }>((set) => ({
  user: null,
  token: localStorage.getItem('v12_token'),
  loading: true,
  subscriptionStatus: 'free',
  setUser: (user, token) => {
    if (token) localStorage.setItem('v12_token', token);
    else localStorage.removeItem('v12_token');
    set({ user, token, loading: false });
  },
  logout: () => {
    localStorage.removeItem('v12_token');
    set({ user: null, token: null, subscriptionStatus: 'free' });
  },
  fetchMe: async () => {
    const token = localStorage.getItem('v12_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        set({ user: userData, subscriptionStatus: userData.subscription?.plan || 'free', loading: false });
      } else {
        localStorage.removeItem('v12_token');
        set({ user: null, token: null, loading: false });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      set({ loading: false });
    }
  },
  fetchSubscription: async () => {
    const token = localStorage.getItem('v12_token');
    if (!token) return;
    try {
      const response = await fetch('/api/billing/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const subData = await response.json();
        set({ subscriptionStatus: subData.plan });
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  }
}));

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setMessages: (messages) => set((state) => ({ 
    messages: typeof messages === 'function' ? messages(state.messages) : messages 
  })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));

export const useAIStore = create<AIState>((set) => ({
  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  error: null,
  setError: (error) => set({ error }),
  conversationId: null,
  setConversationId: (conversationId) => set({ conversationId }),
}));

// Initialize auth
useAuthStore.getState().fetchMe();
