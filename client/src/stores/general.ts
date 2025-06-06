import type { ActionAlert } from "@/services/action-runner";
import { FileItem } from "@repo/common/types";
import { create } from "zustand";

function reasoningFromLocalStorage() {
  return localStorage.getItem("reasoning") === "true";
}
function wordWrapFromLocalStorage() {
  return localStorage.getItem("wordWrap") === "true";
}

export interface GeneralStoreState {
  currentTab: "code" | "preview";
  showTerminal: boolean;
  wordWrap: boolean;
  reasoning: boolean;
  actionAlert: ActionAlert | null;
  attachments: FileItem[];
  // Actions
  setCurrentTab: (tab: "code" | "preview") => void;
  setShowTerminal: (showTerminal: boolean) => void;
  setWordWrap: (wordWrap: boolean) => void;
  setReasoning: (reasoning: boolean) => void;
  setActionAlert: (alert: ActionAlert | null) => void;
  setAttachments: (attachments: FileItem[]) => void;
}

export const useGeneralStore = create<GeneralStoreState>((set) => ({
  currentTab: "code",
  showTerminal: true,
  wordWrap: wordWrapFromLocalStorage(),
  reasoning: reasoningFromLocalStorage(),
  actionAlert: null,
  attachments: [],
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setShowTerminal: (showTerminal) => set({ showTerminal: showTerminal }),
  setWordWrap: (wordWrap) => {
    set({ wordWrap: wordWrap });
    localStorage.setItem("wordWrap", wordWrap.toString());
  },
  setReasoning: (reasoning) => {
    set({ reasoning: reasoning });
    localStorage.setItem("reasoning", reasoning.toString());
  },
  setActionAlert: (alert) => set({ actionAlert: alert }),
  setAttachments: (attachments) => set({ attachments: attachments }),
}));
