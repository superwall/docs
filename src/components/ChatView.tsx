'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  ArrowUp,
  HelpCircle,
  Loader2,
  LogIn,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from 'fumadocs-ui/utils/cn';
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { useCurrentPageMd } from '@/hooks/useCurrentPageMd';
import { clearMessages, loadMessages, saveMessages } from '@/lib/local-store';

type ChatViewProps = {
  showCloseButton?: boolean;
  onClose?: () => void;
  allowFullscreenToggle?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  autoFocus?: boolean;
  initialQuery?: string | null;
  initialQueryKey?: number | null;
} & HTMLAttributes<HTMLDivElement>;

export function ChatView({
  className,
  showCloseButton = false,
  onClose,
  allowFullscreenToggle = false,
  isFullscreen = false,
  onToggleFullscreen,
  autoFocus = false,
  initialQuery = null,
  initialQueryKey = null,
  ...props
}: ChatViewProps) {
  const { content: pageContent, pathname } = useCurrentPageMd();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestContextRef = useRef({ content: pageContent, pathname });
  const lastInitialQueryRef = useRef<string | null>(null);
  const lastInitialQueryKeyRef = useRef<number | null>(null);
  const pendingInitialQueryKeyRef = useRef<number | null>(null);

  const [input, setInput] = useState('');
  const [initialMessages] = useState(() => loadMessages());
  const [pendingInitialQuery, setPendingInitialQuery] = useState<string | null>(() =>
    initialQuery?.trim() ? initialQuery.trim() : null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(true);

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

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    latestContextRef.current = { content: pageContent, pathname };
  }, [pageContent, pathname]);

  // Fetch user session to check if logged in
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.isLoggedIn === 'boolean') {
          setIsLoggedIn(data.isLoggedIn);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch session:', err);
        // Default to logged in on error
        setIsLoggedIn(true);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!autoFocus) return undefined;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    } else {
      clearMessages();
    }
  }, [messages]);

  useEffect(() => {
    const normalizedQuery = initialQuery?.trim() ?? null;
    if (!normalizedQuery) {
      return;
    }

    const nextKey = initialQueryKey ?? null;
    const alreadyHandledKey =
      nextKey !== null && nextKey === lastInitialQueryKeyRef.current;
    const alreadyHandledValue =
      nextKey === null && normalizedQuery === lastInitialQueryRef.current;

    if (alreadyHandledKey || alreadyHandledValue) {
      return;
    }
    pendingInitialQueryKeyRef.current = nextKey;
    setPendingInitialQuery(normalizedQuery);
  }, [initialQuery, initialQueryKey]);

  useEffect(() => {
    if (!pendingInitialQuery) return;
    if (status !== 'ready') return;

    lastInitialQueryRef.current = pendingInitialQuery;
    lastInitialQueryKeyRef.current = pendingInitialQueryKeyRef.current;
    sendMessage({ text: pendingInitialQuery });
    setPendingInitialQuery(null);
    setInput('');
  }, [pendingInitialQuery, status, sendMessage]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || status !== 'ready') return;

    sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (input.trim() && status === 'ready') {
        sendMessage({ text: input.trim() });
        setInput('');
      }
    }
  };

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
          msg.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');

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

  const handleSupportClick = useCallback(() => {
    // Check if in development mode
    const isDev = process.env.NEXTJS_ENV === 'development' || process.env.NODE_ENV === 'development';

    // Always allow in dev, otherwise check auth
    if (!isDev && !isLoggedIn) {
      // Redirect to login
      window.location.href = '/api/auth/login';
      return;
    }

    // Close AI sidebar
    if (onClose) {
      onClose();
    }

    // Open Pylon chat
    if (typeof window !== 'undefined' && typeof window.Pylon === 'function') {
      try {
        window.Pylon('show');
      } catch (error) {
        console.error('Failed to open Pylon:', error);
      }
    } else {
      console.warn('Pylon is not loaded');
    }
  }, [onClose, isLoggedIn]);

  return (
    <div
      className={cn('flex h-full flex-col bg-fd-background', className)}
      {...props}
    >
      <div className="border-b border-fd-border">
        <div className="mx-auto flex w-full max-w-[960px] items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-fd-primary" />
            <h2 className="text-lg font-semibold">Ask AI</h2>
            {pageContent && (
              <span className="rounded bg-fd-accent px-2 py-1 text-xs text-fd-muted-foreground">
                Page context
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSupportClick}
              aria-label="Contact support"
            >
              <HelpCircle className="size-4" />
            </Button>
            {allowFullscreenToggle && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </Button>
            )}
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
            {showCloseButton && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close chat"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-[960px] flex-col space-y-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="py-12 text-center text-fd-muted-foreground">
              <p className="text-sm">Ask me anything about Superwall.</p>
              {pageContent && (
                <p className="mt-2 text-xs">I have the context of your current page.</p>
              )}
            </div>
          )}

          {messages.map((message) => (
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

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-fd-border">
        <div className="mx-auto w-full max-w-[960px] px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Superwall…"
              disabled={isLoading}
              rows={1}
              className={cn(
                'flex-1 resize-none rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-fd-primary',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'max-h-32 overflow-y-auto'
              )}
              style={{
                minHeight: '36px',
                height: 'auto',
                maxHeight: '128px',
              }}
              onInput={(event) => {
                const target = event.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className={cn(
                'flex size-8 items-center justify-center rounded-full transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                input.trim() && !isLoading
                  ? 'bg-fd-primary text-fd-primary-foreground hover:opacity-90'
                  : 'bg-fd-muted text-fd-muted-foreground'
              )}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
