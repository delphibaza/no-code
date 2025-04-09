import { create } from "zustand";
import { NetlifyVercelStoreState } from "./netlify";

// Initialize with stored token if available
const storedToken = localStorage.getItem("vercel_token");

export const useVercelStore = create<NetlifyVercelStoreState>((set) => ({
  validatedToken: storedToken,
  isConnecting: false,
  // Actions
  setIsConnecting: (isConnecting: boolean) => set({ isConnecting }),
  setValidatedToken: (token: string) => {
    set({ validatedToken: token });
    localStorage.setItem("vercel_token", token);
  },
  removeToken: () => {
    set({ validatedToken: null });
    localStorage.removeItem("vercel_token");
  },
}));
