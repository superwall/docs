'use client';

import { useEffect } from 'react';
import { ChatFAB } from './ChatFAB';
import { ChatSidebar } from './ChatSidebar';
import { useDialogState } from '@/hooks/useDialogState';

export function ChatWidget() {
  const { chatOpen, setChatOpen } = useDialogState();

  // Handle Cmd+I / Ctrl+I to toggle chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+I (Mac) or Ctrl+I (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        // Toggle chat (this will auto-close search via useDialogState)
        setChatOpen(!chatOpen);
      }

      // Esc to close chat when open
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatOpen, setChatOpen]);

  return (
    <>
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
      <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
