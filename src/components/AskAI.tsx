'use client';

import { useState, useEffect, useRef, ComponentProps } from 'react';
import { Loader2 as Loader, Sparkles, RotateCcw, CornerDownLeft, X, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from 'fumadocs-ui/utils/cn';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const API_URL =
  typeof window !== 'undefined' && window.location.hostname.includes('localhost')
    ? 'http://localhost:8787'
    : 'https://docs-ai-api.superwall.com';

const USE_DUMMY_API = false;
const FORCE_ERROR_STATE = false;

const SDK_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'expo', label: 'Expo' },
  { value: 'flutter', label: 'Flutter' },
  { value: 'react-native', label: 'React Native (Deprecated)' },
] as const;

const DUMMY_MARKDOWN = `
### Lorem Ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`;

type ChatHistoryItem = {
  id: string;
  question: string;
  answer: string;
  isError?: boolean;
  isIncomplete?: boolean;
  feedback?: {
    rating: 'positive' | 'negative';
    comment?: string;
    submitted?: boolean;
  };
};

interface AskAIProps extends ComponentProps<'div'> {
  initialQuery?: string | null;
}

export default function AskAI({
  className,
  initialQuery,
  ...props
}: AskAIProps) {
  const [query, setQuery] = useState('');
  const [answerMd, setAnswerMd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useLocalStorage<ChatHistoryItem[]>('superwall-ai-chat-history', []);
  const [selectedSdk, setSelectedSdk] = useLocalStorage<string>('superwall-ai-selected-sdk', '');
  const [showSdkDropdown, setShowSdkDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Effect to migrate old data without IDs
  useEffect(() => {
    setHistory(prev => prev.map((item, index) => 
      item.id ? item : { ...item, id: `migrated-${Date.now()}-${index}` }
    ));
  }, []);

  // Effect to fetch user session
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn && data.userInfo?.email) {
          setUserEmail(data.userInfo.email);
        }
      })
      .catch(err => console.error('Failed to fetch session:', err));
  }, []);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [retryQuery, setRetryQuery] = useState<string | null>(null);
  const [showAutofillPill, setShowAutofillPill] = useState(false);
  const [feedbackState, setFeedbackState] = useState<{[key: string]: {showInput: boolean, comment: string}}>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [focused, setFocused] = useState(false);

  const removeHistoryItem = (index: number) => {
    setHistory(prev => prev.filter((_, i) => i !== index));
  };

  const selectSdk = (sdkValue: string) => {
    setSelectedSdk(sdkValue);
    setShowSdkDropdown(false);
  };

  const getSelectedSdk = () => {
    const found = SDK_OPTIONS.find(opt => opt.value === selectedSdk);
    return found || SDK_OPTIONS[0]; // Default to "None" (first option)
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSdkDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const retryQuestion = (question: string, index: number) => {
    // Remove the failed item and set retry flag
    removeHistoryItem(index);
    setRetryQuery(question);
  };

  const handleFeedback = (cardId: string, rating: 'positive' | 'negative') => {
    const item = history.find(h => h.id === cardId);
    
    // Don't allow changes if feedback has been submitted
    if (item?.feedback?.submitted) {
      return;
    }
    
    // If clicking the same rating again, undo it (only if not submitted)
    if (item?.feedback?.rating === rating && !item.feedback.comment) {
      setHistory(prev => prev.map(item => 
        item.id === cardId ? { ...item, feedback: undefined } : item
      ));
      setFeedbackState(prev => ({
        ...prev,
        [cardId]: { showInput: false, comment: '' }
      }));
      return;
    }
    
    // Update the rating (allow switching between positive/negative)
    setHistory(prev => prev.map(item => 
      item.id === cardId ? { ...item, feedback: { rating, comment: feedbackState[cardId]?.comment || '' } } : item
    ));
    
    // Show comment input for this item
    setFeedbackState(prev => ({
      ...prev,
      [cardId]: { showInput: true, comment: '' }
    }));

    // Don't send to API yet - wait for user to submit
  };

  const submitFeedbackComment = (cardId: string) => {
    const comment = feedbackState[cardId]?.comment || '';
    const item = history.find(h => h.id === cardId);
    
    if (!item?.feedback) return;
    
    // Update the history item with the comment and mark as submitted
    setHistory(prev => prev.map(item => 
      item.id === cardId && item.feedback ? 
        { ...item, feedback: { ...item.feedback, comment, submitted: true } } : item
    ));

    // Hide the input
    setFeedbackState(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], showInput: false }
    }));

    // Send feedback with comment to API
    sendFeedbackToAPI(cardId, item.feedback.rating, comment);
  };

  const updateFeedbackComment = (cardId: string, comment: string) => {
    setFeedbackState(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], comment }
    }));
  };

  const sendFeedbackToAPI = async (cardId: string, rating: 'positive' | 'negative', comment: string) => {
    const item = history.find(h => h.id === cardId);
    if (!item) return;

    try {
      const response = await fetch('/docs/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai',
          question: item.question,
          answer: item.answer,
          rating,
          comment: comment || undefined,
          email: userEmail || undefined,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to send feedback:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Feedback sent successfully:', result);
    } catch (error) {
      console.error('Failed to send feedback:', error);
      // Could enhance this with toast notifications in the future
    }
  };

  // Effect to handle retry after history state update
  useEffect(() => {
    if (retryQuery) {
      runQuery(retryQuery);
      setRetryQuery(null);
    }
  }, [retryQuery, history]);

  // Effect to handle initial query from URL parameter
  useEffect(() => {
    if (initialQuery && !loading && !currentQuestion) {
      setShowAutofillPill(true);
      runQuery(initialQuery);
    }
  }, [initialQuery]);

  // handy “reset” helper
  const reset = () => {
    setQuery('');
    setAnswerMd(null);
    setCurrentQuestion(null);
    inputRef.current?.focus();
  };

  const runQuery = async (overrideQuery?: string) => {
    const q = overrideQuery || query.trim();
    if (!q || loading) return;
    setCurrentQuestion(q);
    if (!overrideQuery) {
      setQuery('');
      inputRef.current?.blur();
      setFocused(false);
    }
    setLoading(true);
    setAnswerMd(null);

    if (USE_DUMMY_API) {
      await new Promise((r) => setTimeout(r, 1000));
      if (FORCE_ERROR_STATE) {
        const errorId = Date.now().toString();
        setHistory(prev => [{ 
          id: errorId,
          question: q, 
          answer: '**Error** – please try again.',
          isError: true 
        }, ...prev]);
        
      } else {
        const responseId = Date.now().toString();
        setHistory(prev => [{ 
          id: responseId,
          question: q, 
          answer: DUMMY_MARKDOWN 
        }, ...prev]);
        
      }
      setLoading(false);
      setCurrentQuestion(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: q, 
          sdks: selectedSdk ? [selectedSdk] : undefined,
          email: userEmail || undefined 
        }),
      });
      if (!res.ok) throw new Error('Bad response');
      const text = await res.text();
      const responseId = Date.now().toString();
      setHistory(prev => [{ 
        id: responseId,
        question: q, 
        answer: text 
      }, ...prev]);
      
    } catch (err) {
      const errorId = Date.now().toString();
      setHistory(prev => [{ 
        id: errorId,
        question: q, 
        answer: '**Error** – please try again.',
        isError: true 
      }, ...prev]);
      console.error(err);
      
    } finally {
      setLoading(false);
      setCurrentQuestion(null);
      setShowAutofillPill(false);
    }
  };

  // ⏎ to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
        e.preventDefault();
        runQuery();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {/* Search input with SDK selector */}
      <div className="flex gap-2 w-full">
        {/* SDK selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowSdkDropdown(!showSdkDropdown)}
            disabled={loading}
            className={cn(
              'flex items-center justify-between px-3 text-sm border rounded-[var(--radius-lg)] bg-transparent whitespace-nowrap h-[44px]',
              'hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary',
              loading && 'opacity-50 cursor-not-allowed'
            )}
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <div className="flex items-center gap-2">
              <span>SDK</span>
              <div className="w-px h-4 bg-fd-border" />
              <span>{getSelectedSdk()?.label || 'None'}</span>
            </div>
            <ChevronDown className={cn(
              "ml-2 size-3 transition-transform",
              showSdkDropdown && "transform rotate-180"
            )} />
          </button>

          {showSdkDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-fd-background border border-fd-border rounded-[var(--radius-lg)] shadow-lg z-50">
              {SDK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectSdk(option.value)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-left text-sm hover:bg-fd-accent",
                    selectedSdk === option.value && "bg-fd-accent"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full border mr-2",
                    selectedSdk === option.value 
                      ? "bg-fd-primary border-fd-primary" 
                      : "border-fd-border"
                  )} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <input
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={answerMd ? 'Ask another question…' : 'Ask anything about Superwall...'}
              className={cn(
                  'w-full rounded-[var(--radius-lg)] border bg-transparent px-3 pl-8 pr-8 h-[44px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary',
                  loading && 'opacity-50 cursor-not-allowed'
              )}
              style={{ borderRadius: 'var(--radius-lg)' }}
              disabled={loading}
          />
          <Sparkles
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3 text-[#74F8F0]"
          />
          {focused && (
            <CornerDownLeft
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3 text-fd-muted-foreground"
            />
          )}
        </div>
      </div>

      {currentQuestion && (
        <div
          className="relative border p-4 space-y-1 mt-2"
          style={{
            borderRadius: 'var(--radius-lg)',
            borderColor: 'var(--color-fd-border)',
          }}
        >
          <div className="flex justify-between items-start text-sm text-fd-muted-foreground">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium break-words overflow-wrap-anywhere">{currentQuestion}</span>
              {showAutofillPill && (
                <span className="text-xs text-fd-muted-foreground border border-fd-border rounded px-2 py-1 flex-shrink-0">
                  AUTOFILLED
                </span>
              )}
            </div>
            {!loading && (
              <button
                onClick={reset}
                title="Cancel"
                className="cursor-pointer p-0 absolute right-3 top-3"
              >
                <X className="size-3 text-fd-muted-foreground" />
              </button>
            )}
          </div>
          <hr className="border-t my-1 mt-4 mb-4" style={{ borderColor: 'var(--color-fd-border)' }} />
          <div className="prose prose-sm dark:prose-invert max-w-none break-words overflow-wrap-anywhere [&_pre]:overflow-x-auto [&_code]:break-all [&_pre_code]:break-normal [&_table]:block [&_table]:overflow-x-auto">
            {loading ? (
              <p className="flex items-center gap-2 text-fd-muted-foreground">
                <Loader className="size-4 animate-spin" /> Loading…
              </p>
            ) : (
              <ReactMarkdown>{history[0].answer}</ReactMarkdown>
            )}
          </div>
        </div>
      )}

      {history.map((item, idx) => (
        <div
          key={idx}
          className="relative border p-4 space-y-1 mt-2"
          style={{
            borderRadius: 'var(--radius-lg)',
            borderColor: 'var(--color-fd-border)',
          }}
        >
          <div className="flex justify-between items-start text-sm text-fd-muted-foreground font-medium min-w-0 pr-8">
            <span className="break-words overflow-wrap-anywhere flex-1">{item.question}</span>
            <button
              onClick={() => removeHistoryItem(idx)}
              title="Remove"
              className="cursor-pointer p-1 hover:bg-fd-accent rounded absolute right-3 top-3"
            >
              <X className="size-3 text-fd-muted-foreground" />
            </button>
          </div>
          <hr className="border-t my-1 mt-4 mb-4" style={{ borderColor: 'var(--color-fd-border)' }} />
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {item.isError ? (
              <div className="flex items-center gap-2">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words overflow-wrap-anywhere [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_code]:break-all [&_pre_code]:break-normal [&_table]:block [&_table]:overflow-x-auto">
                  <ReactMarkdown>{item.answer}</ReactMarkdown>
                </div>
                <button
                  onClick={() => retryQuestion(item.question, idx)}
                  title="Retry"
                  className="cursor-pointer p-1 hover:bg-fd-accent rounded flex-shrink-0"
                >
                  <RotateCcw className="size-3 text-fd-muted-foreground" />
                </button>
              </div>
            ) : (
              <div>
                {/* Content with feedback buttons pinned to bottom right */}
                <div className="relative">
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words overflow-wrap-anywhere [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_code]:break-all [&_pre_code]:break-normal [&_table]:block [&_table]:overflow-x-auto">
                    <ReactMarkdown>{item.answer}</ReactMarkdown>
                  </div>
                  
                  {/* Feedback UI - pinned to bottom right corner */}
                  <div className="absolute bottom-0 right-0 flex items-center gap-1">
                    <button
                      onClick={() => handleFeedback(item.id, 'positive')}
                      title={
                        item.feedback?.submitted
                          ? "Feedback submitted"
                          : item.feedback?.rating === 'positive' 
                            ? "Click again to undo" 
                            : "Good response"
                      }
                      className={cn(
                        "p-1 rounded",
                        item.feedback?.submitted 
                          ? "cursor-default" 
                          : "cursor-pointer hover:bg-fd-accent",
                        item.feedback?.rating === 'positive' && "bg-green-100 dark:bg-green-900/30"
                      )}
                    >
                      <ThumbsUp className={cn(
                        "size-3",
                        item.feedback?.rating === 'positive' 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-fd-muted-foreground"
                      )} />
                    </button>
                    <button
                      onClick={() => handleFeedback(item.id, 'negative')}
                      title={
                        item.feedback?.submitted
                          ? "Feedback submitted"
                          : item.feedback?.rating === 'negative' 
                            ? "Click again to undo" 
                            : "Poor response"
                      }
                      className={cn(
                        "p-1 rounded",
                        item.feedback?.submitted 
                          ? "cursor-default" 
                          : "cursor-pointer hover:bg-fd-accent",
                        item.feedback?.rating === 'negative' && "bg-red-100 dark:bg-red-900/30"
                      )}
                    >
                      <ThumbsDown className={cn(
                        "size-3",
                        item.feedback?.rating === 'negative' 
                          ? "text-red-600 dark:text-red-400" 
                          : "text-fd-muted-foreground"
                      )} />
                    </button>
                  </div>
                </div>

                {/* Feedback comment input */}
                {feedbackState[item.id]?.showInput && (
                  <div className="mt-3 p-3 bg-fd-accent/10 rounded border">
                    <p className="text-sm text-fd-muted-foreground mb-2 mt-0">
                      Optional feedback (helps improve AI responses)
                    </p>
                    <div className="flex gap-2">
                      <textarea
                        placeholder="Tell us more..."
                        value={feedbackState[item.id]?.comment || ''}
                        onChange={(e) => updateFeedbackComment(item.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            submitFeedbackComment(item.id);
                          }
                        }}
                        rows={3}
                        className="flex-1 px-2 py-1 text-sm border border-fd-border rounded bg-fd-background focus:outline-none focus:ring-1 focus:ring-fd-primary resize-y"
                      />
                      <button
                        onClick={() => submitFeedbackComment(item.id)}
                        className="px-3 py-1 text-sm bg-fd-primary text-fd-primary-foreground rounded hover:bg-fd-primary/90 cursor-pointer self-start"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}