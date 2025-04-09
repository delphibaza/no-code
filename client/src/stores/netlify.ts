import { create } from "zustand";

// Initialize with stored token if available
const storedToken = localStorage.getItem("netlify_token");

export interface NetlifyVercelStoreState {
  validatedToken: string | null;
  isConnecting: boolean;
  // Actions
  setIsConnecting: (isConnecting: boolean) => void;
  setValidatedToken: (token: string) => void;
  removeToken: () => void;
}

export const useNetlifyStore = create<NetlifyVercelStoreState>((set) => ({
  validatedToken: storedToken,
  isConnecting: false,
  // Actions
  setIsConnecting: (isConnecting: boolean) => set({ isConnecting }),
  setValidatedToken: (validatedToken: string) => {
    set({ validatedToken });
    // Persist to localStorage
    localStorage.setItem("netlify_token", validatedToken);
  },
  removeToken: () => {
    set({ validatedToken: null });
    localStorage.removeItem("netlify_token");
  },
}));
