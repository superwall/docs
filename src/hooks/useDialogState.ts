/**
 * Simple global state for managing mutually exclusive dialogs (search and chat)
 * Uses a singleton pattern to avoid prop drilling
 */

type DialogStateListener = (state: DialogState) => void;

interface DialogState {
  searchOpen: boolean;
  chatOpen: boolean;
  chatWiggle: number; // Incrementing counter to trigger wiggle
}

class DialogStateManager {
  private state: DialogState = {
    searchOpen: false,
    chatOpen: false,
    chatWiggle: 0,
  };

  private listeners = new Set<DialogStateListener>();

  subscribe(listener: DialogStateListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  setSearchOpen(open: boolean) {
    this.state = {
      searchOpen: open,
      // Close chat when opening search
      chatOpen: open ? false : this.state.chatOpen,
      chatWiggle: this.state.chatWiggle,
    };
    this.notifyListeners();
  }

  setChatOpen(open: boolean) {
    this.state = {
      chatOpen: open,
      // Close search when opening chat
      searchOpen: open ? false : this.state.searchOpen,
      chatWiggle: this.state.chatWiggle,
    };
    this.notifyListeners();
  }

  triggerChatWiggle() {
    this.state = {
      ...this.state,
      chatWiggle: this.state.chatWiggle + 1,
    };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

// Singleton instance
export const dialogStateManager = new DialogStateManager();

// Hook for using dialog state in components
import { useEffect, useState } from 'react';

export function useDialogState() {
  const [state, setState] = useState(dialogStateManager.getState());

  useEffect(() => {
    return dialogStateManager.subscribe(setState);
  }, []);

  return {
    ...state,
    setSearchOpen: dialogStateManager.setSearchOpen.bind(dialogStateManager),
    setChatOpen: dialogStateManager.setChatOpen.bind(dialogStateManager),
    triggerChatWiggle: dialogStateManager.triggerChatWiggle.bind(dialogStateManager),
  };
}
