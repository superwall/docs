'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChatFAB } from './ChatFAB';
import { ChatSidebar } from './ChatSidebar';
import { useDialogState } from '@/hooks/useDialogState';

export function ChatWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { chatOpen, setChatOpen } = useDialogState();
  const [isPylonOpen, setIsPylonOpen] = useState(false);

  if (pathname?.startsWith('/ai') || pathname?.startsWith('/docs/ai')) {
    return null;
  }

  // Open chat if ?ai=true is in the URL (only once on mount)
  useEffect(() => {
    const aiParam = searchParams?.get('ai');
    if (aiParam === 'true' && !chatOpen) {
      setChatOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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

  // Toggle global layout state for chat-open styling
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    if (chatOpen) {
      root.classList.add('chat-open');
    } else {
      root.classList.remove('chat-open');
    }

    return () => {
      root.classList.remove('chat-open');
    };
  }, [chatOpen]);

  // Track Pylon open/closed state and manage bubble visibility
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for Pylon to load
    const checkPylon = setInterval(() => {
      if (typeof window.Pylon === 'function') {
        clearInterval(checkPylon);
        try {
          // Always hide the chat bubble initially
          window.Pylon('hideChatBubble');

          // Set up callbacks to track Pylon state
          window.Pylon('onShow', () => {
            setIsPylonOpen(true);
          });

          window.Pylon('onHide', () => {
            setIsPylonOpen(false);
            // Hide bubble again when Pylon closes
            window.Pylon('hideChatBubble');
          });
        } catch (error) {
          console.error('Error setting up Pylon callbacks:', error);
        }
      }
    }, 100);

    return () => {
      clearInterval(checkPylon);
      if (typeof window.Pylon === 'function') {
        try {
          // Remove callbacks
          window.Pylon('onShow', null);
          window.Pylon('onHide', null);
        } catch (error) {
          console.error('Error cleaning up Pylon callbacks:', error);
        }
      }
    };
  }, []);

  return (
    <>
      {!isPylonOpen && <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />}
      <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
