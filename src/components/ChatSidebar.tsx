'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Loader2, RotateCcw, Send, X } from 'lucide-react';
import { cn } from 'fumadocs-ui/utils/cn';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { useCurrentPageMd } from '@/hooks/useCurrentPageMd';
import { clearMessages, loadMessages, saveMessages } from '@/lib/local-store';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WIDTH_STORAGE_KEY = 'chat:sidebar-width';
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;

const computeMaxWidth = (viewportWidth: number) =>
  Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, viewportWidth - 80));

const clampWidth = (value: number, viewportWidth: number) => {
  const maxWidth = computeMaxWidth(viewportWidth);
  return Math.min(Math.max(value, MIN_WIDTH), maxWidth);
};

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const { content: pageContent, pathname } = useCurrentPageMd();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestContextRef = useRef({ content: pageContent, pathname });

  const [input, setInput] = useState('');
  const [initialMessages] = useState(() => loadMessages());
  const [isDesktop, setIsDesktop] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_WIDTH;
    }

    const stored = window.localStorage.getItem(WIDTH_STORAGE_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : DEFAULT_WIDTH;
    return clampWidth(Number.isNaN(parsed) ? DEFAULT_WIDTH : parsed, window.innerWidth);
  });

  const widthRef = useRef(width);
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    latestContextRef.current = { content: pageContent, pathname };
  }, [pageContent, pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    updateIsDesktop();
    window.addEventListener('resize', updateIsDesktop);
    return () => window.removeEventListener('resize', updateIsDesktop);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  }, [width]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (isOpen && isDesktop) {
      root.style.setProperty('--sw-chat-width', `${width}px`);
    } else {
      root.style.setProperty('--sw-chat-width', '0px');
    }

    return () => {
      root.style.setProperty('--sw-chat-width', '0px');
    };
  }, [isOpen, isDesktop, width]);

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.cursor = '';
    }
  }, [isResizing]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/docs/api/ai',
        body: () => {
          const { content, pathname: currentPath } = latestContextRef.current;
          const href = typeof window !== 'undefined' ? window.location.href : undefined;

          let debug = false;
          if (typeof window !== 'undefined') {
            try {
              const params = new URLSearchParams(window.location.search);
              debug = params.has('ai-debug') || window.localStorage.getItem('sw-ai-debug') === '1';
            } catch (error) {
              console.warn('Failed to evaluate AI debug flag on client', error);
            }
          }

          return {
            currentPageContent: content ?? undefined,
            currentPagePath: currentPath ?? undefined,
            currentPageUrl: href,
            debug: debug || undefined,
          };
        },
      }),
    []
  );

  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({
    transport,
    id: 'superwall-ai-chat-v2',
    messages: initialMessages,
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: ({ messages: finishedMessages, isError }) => {
      if (!isError) {
        saveMessages(finishedMessages);
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleFeedback = useCallback(
    async (
      messageId: string,
      rating: 'positive' | 'negative',
      comment?: string
    ) => {
      try {
        const message = messages.find((m) => m.id === messageId);
        if (!message) return;

        const extractText = (msg: typeof message) =>
          msg.parts.map(p => (p.type === 'text' ? p.text : '')).join('');

        const prevMessage = messages.find((m, i) => messages[i + 1]?.id === messageId);

        await fetch('/docs/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ai',
            question: prevMessage ? extractText(prevMessage) : '',
            answer: extractText(message),
            rating,
            comment,
          }),
        });
      } catch (error) {
        console.error('Failed to send feedback:', error);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    if (confirm('Reset the current conversation?')) {
      setMessages([]);
      clearMessages();
    }
  }, [setMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    } else {
      clearMessages();
    }
  }, [messages]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || status !== 'ready') return;

    sendMessage({ text: input.trim() });
    setInput('');
  };

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    event.preventDefault();
    setIsResizing(true);

    const startX = event.clientX;
    const startWidth = widthRef.current;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const viewportWidth = window.innerWidth;
      const nextWidth = clampWidth(startWidth + delta, viewportWidth);
      setWidth(nextWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const resetWidth = () => {
    if (typeof window === 'undefined') return;
    const viewportWidth = window.innerWidth;
    setWidth(clampWidth(DEFAULT_WIDTH, viewportWidth));
  };

  const isLoading = status === 'submitted' || status === 'streaming';
  const pendingToolNames = useMemo(() => {
    const names = new Set<string>();
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role !== 'assistant') continue;

      message.parts.forEach(part => {
        if (!part || typeof part !== 'object') return;
        const type = (part as { type?: string }).type;
        if (!type) return;

        const state = (part as { state?: string }).state;
        const isToolPart = type === 'dynamic-tool' || type.startsWith('tool-');
        if (!isToolPart) return;
        if (state === 'output-available' || state === 'output-error') return;

        const toolName =
          type === 'dynamic-tool'
            ? (part as { toolName?: string }).toolName ?? 'tool'
            : type.replace(/^tool-/, '');
        names.add(toolName);
      });

      break;
    }

    return Array.from(names);
  }, [messages]);

  const showSpinner = isLoading || pendingToolNames.length > 0;
  const spinnerLabel = pendingToolNames.length > 0
    ? `Running ${pendingToolNames.join(', ')}`
    : status === 'submitted'
      ? 'Sending…'
      : 'Thinking…';

  const sidebarStyle = isDesktop
    ? { width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }
    : undefined;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          'fixed top-0 right-0 z-50 flex h-full flex-col border-l border-fd-border bg-fd-background transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          'w-full lg:max-w-[720px]'
        )}
        style={sidebarStyle}
      >
        <div
          className={cn(
            'absolute left-0 top-0 hidden h-full w-1 cursor-ew-resize lg:block',
            isResizing ? 'bg-fd-primary/40' : 'bg-transparent'
          )}
          onMouseDown={startResize}
          onDoubleClick={resetWidth}
          aria-label="Resize chat panel"
          role="separator"
        />

        <div className="flex items-center justify-between border-b border-fd-border p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Ask AI</h2>
            {pageContent && (
              <span className="rounded bg-fd-accent px-2 py-1 text-xs text-fd-muted-foreground">
                Page context
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearChat}
                aria-label="Reset conversation"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close chat"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-fd-muted-foreground">
              <p className="text-sm">Ask me anything about Superwall.</p>
              {pageContent && (
                <p className="mt-2 text-xs">I have the context of your current page.</p>
              )}
            </div>
          )}

          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              onFeedback={
                message.role === 'assistant'
                  ? (rating, comment) => handleFeedback(message.id, rating, comment)
                  : undefined
              }
            />
          ))}

          {showSpinner && (
            <div className="flex items-center gap-2 text-sm text-fd-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{spinnerLabel}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-fd-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about Superwall…"
              disabled={isLoading}
              className={cn(
                'flex-1 rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-fd-primary',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
