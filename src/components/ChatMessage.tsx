'use client';

import type { UIMessage } from 'ai';
import React, { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from 'fumadocs-ui/utils/cn';
import {
  Brain,
  Check,
  Copy,
  Loader2,
  TriangleAlert,
  Workflow,
  ThumbsDown,
  ThumbsUp,
  Search,
  FileText,
  Server,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

// Flag to control thinking duration display
const SHOW_THINKING_DURATION = false;

type ToolLikePart = {
  type: string;
  state?: string;
  toolName?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: unknown;
  preliminary?: boolean;
};

type ReasoningPart = {
  type: 'reasoning';
  text: string;
  providerOptions?: {
    openai?: {
      itemId?: string;
      reasoningTokens?: number;
    };
  };
};

const TOOL_PREFIX = 'tool-';

const extractText = (message: UIMessage) =>
  message.parts
    .filter(part => part.type === 'text')
    .map(part => ('text' in part ? part.text : ''))
    .join('')
    .trim();

const extractReasoning = (message: UIMessage): { content: string; tokens?: number } => {
  const reasoningParts = message.parts.filter(part => part.type === 'reasoning') as ReasoningPart[];

  if (reasoningParts.length === 0) {
    return { content: '' };
  }

  const content = reasoningParts
    .map(part => part.text)
    .join('\n')
    .trim();

  // Get token count from the last reasoning part if available
  const lastPart = reasoningParts[reasoningParts.length - 1];
  const tokens = lastPart?.providerOptions?.openai?.reasoningTokens;

  return { content, tokens };
};

const extractToolParts = (message: UIMessage) =>
  message.parts.filter(part => {
    if (!part || typeof part !== 'object') {
      return false;
    }

    const type = (part as { type?: string }).type;
    return type === 'dynamic-tool' || (type ? type.startsWith(TOOL_PREFIX) : false);
  }) as ToolLikePart[];

const getToolName = (part: ToolLikePart) => {
  if (part.type === 'dynamic-tool') {
    return part.toolName ?? 'tool';
  }

  return part.type.startsWith(TOOL_PREFIX)
    ? part.type.slice(TOOL_PREFIX.length)
    : 'tool';
};

const isToolRunning = (part: ToolLikePart) =>
  part.state === 'input-streaming' || part.state === 'input-available';

const isToolComplete = (part: ToolLikePart) =>
  part.state === 'output-available' || part.state === 'output-error';

const getToolDisplayInfo = (toolName: string, isRunning: boolean, output?: unknown, hasError?: boolean, input?: unknown) => {
  const toolMap: Record<string, { loading: string; complete: string; icon: typeof Search }> = {
    mcp_search: { loading: 'Searching docs', complete: 'Searched docs', icon: Search },
    page_context: { loading: 'Reading', complete: 'Read', icon: FileText },
  };

  const info = toolMap[toolName];

  // Extract result info from output
  let resultInfo = '';
  let isError = hasError;

  // For page_context, extract the docId from input to show what page was read
  if (toolName === 'page_context' && input && typeof input === 'object' && 'docId' in input) {
    const docId = (input as { docId?: string }).docId;
    if (docId) {
      // Clean up the docId: remove /docs/ prefix, .md extension, and http URLs
      let cleanDocId = docId;
      if (cleanDocId.startsWith('http')) {
        try {
          const url = new URL(cleanDocId);
          cleanDocId = url.pathname.replace(/^\/docs\//, '').replace(/\.md$/, '');
        } catch {
          // If URL parsing fails, just use the docId as-is
        }
      } else {
        cleanDocId = cleanDocId.replace(/^\/docs\//, '').replace(/\.md$/, '');
      }
      resultInfo = ` ${cleanDocId}`;
    }
  }

  if (output && typeof output === 'object') {
    // Handle both wrapped and unwrapped output formats
    const value = ('type' in output && output.type === 'json' && 'value' in output)
      ? (output.value as any)
      : output;

    if (value?.error) {
      resultInfo = ` - ${value.error}`;
      isError = true;
    } else if (value?.results && Array.isArray(value.results)) {
      resultInfo = ` (${value.results.length} result${value.results.length !== 1 ? 's' : ''})`;
    }
  }

  if (info) {
    return {
      label: isRunning ? `${info.loading}${resultInfo}` : `${info.complete}${resultInfo}`,
      Icon: info.icon,
      isError,
    };
  }

  // Fallback to tool name
  return {
    label: `${toolName}${resultInfo}`,
    Icon: Server,
    isError,
  };
};

const summariseOutput = (output: unknown) => {
  if (output == null) return null;

  if (typeof output === 'string') {
    return output.length > 320 ? `${output.slice(0, 317)}…` : output;
  }

  try {
    const asJson = JSON.stringify(output, null, 2);
    return asJson.length > 320 ? `${asJson.slice(0, 317)}…` : asJson;
  } catch (error) {
    return String(output);
  }
};

interface ChatMessageProps {
  message: UIMessage;
  onFeedback?: (rating: 'positive' | 'negative', comment?: string) => void;
  onRetry?: () => void;
  isStreaming?: boolean;
  thinkingDuration?: number;
}

export function ChatMessage({ message, onFeedback, onRetry, isStreaming, thinkingDuration }: ChatMessageProps) {
  const role = message.role;

  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);

  const textContent = useMemo(() => extractText(message), [message]);
  const reasoningData = useMemo(() => extractReasoning(message), [message]);
  const toolParts = useMemo(() => extractToolParts(message), [message]);

  const hasToolInFlight = toolParts.some(part => isToolRunning(part));
  const isStreamingText = message.parts.some(
    part => part.type === 'text' && 'state' in part && part.state === 'streaming'
  );
  const showThinkingPlaceholder =
    role === 'assistant' && !textContent && (isStreamingText || hasToolInFlight);

  // Show thinking indicator after tools complete but before text starts
  const hasCompletedTools = toolParts.some(part => isToolComplete(part));
  const showThinkingAfterTools = role === 'assistant' && hasCompletedTools && !textContent && !hasToolInFlight;

  // Show thinking summary when we have reasoning and text (completed state)
  const showThinkingSummary = role === 'assistant' && reasoningData.content && textContent && reasoningData.tokens;

  // Only show feedback when message is complete (has text and no tools running)
  const isMessageComplete = textContent && !hasToolInFlight && !isStreamingText;

  const handleFeedback = (rating: 'positive' | 'negative') => {
    if (feedback === rating) {
      setFeedback(null);
      setShowCommentInput(false);
      return;
    }

    setFeedback(rating);
    setShowCommentInput(true);
  };

  const submitFeedback = () => {
    if (feedback && onFeedback) {
      onFeedback(feedback, comment || undefined);
      setShowCommentInput(false);
    }
  };

  const handleCopy = useCallback(async () => {
    const textToCopy = [textContent, reasoningData.content]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy response', error);
    }
  }, [textContent, reasoningData]);

  if (role === 'system') {
    return null;
  }

  if (role === 'user') {
    const userText = textContent || '…';
    const [userCopied, setUserCopied] = useState(false);

    const handleUserCopy = useCallback(async () => {
      if (!userText) return;

      try {
        await navigator.clipboard.writeText(userText);
        setUserCopied(true);
        setTimeout(() => setUserCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy message', error);
      }
    }, [userText]);

    return (
      <div className="group mb-4 flex flex-col items-end gap-1">
        <div className="max-w-[80%] rounded-lg bg-fd-accent/30 px-4 py-3">
          <p className="text-sm whitespace-pre-wrap">{userText}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Copy message"
            onClick={handleUserCopy}
          >
            {userCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
          {onRetry && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Retry message"
              onClick={onRetry}
            >
              <RotateCcw className="size-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show thinking state (only if flag is enabled)
  const showThinking = SHOW_THINKING_DURATION && role === 'assistant' && (isStreaming || !textContent || thinkingDuration !== undefined);
  const isCurrentlyThinking = isStreaming && !textContent;

  return (
    <div className="mb-4 space-y-2">
      {/* Thinking state - show "Thinking..." with spinner or "Thought for X seconds" */}
      {showThinking && (
        <div className="flex items-center gap-2 text-xs text-fd-muted-foreground">
          {isCurrentlyThinking ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              <span>Thinking...</span>
            </>
          ) : thinkingDuration !== undefined && textContent ? (
            <>
              <Brain className="size-3" />
              <span>Thought for {thinkingDuration.toFixed(1)}s</span>
            </>
          ) : null}
        </div>
      )}

      {/* Thinking and tool calls section - always in "loading" style */}
      {(showThinkingPlaceholder || showThinkingAfterTools || toolParts.length > 0 || showThinkingSummary || reasoningData.content) && (
        <div className="space-y-2">
          {/* Thinking indicator - show during loading */}
          {showThinkingPlaceholder && !isCurrentlyThinking && (
            <div className="flex items-center gap-2 text-sm text-fd-muted-foreground">
              <Brain className="size-4 animate-pulse" />
              <span>Thinking…</span>
            </div>
          )}

          {/* Tool calls - compact style */}
          {toolParts.length > 0 && (
            <div className="space-y-1.5 text-xs">
              {toolParts.map((part, index) => {
                const toolName = getToolName(part);
                const isRunning = isToolRunning(part);
                const hasError = part.state === 'output-error';
                const displayInfo = getToolDisplayInfo(toolName, isRunning, part.output, hasError, part.input);

                return (
                  <div
                    key={`${part.toolCallId ?? toolName}-${index}`}
                    className={cn(
                      "flex items-center gap-2 transition-opacity duration-200",
                      displayInfo.isError ? "text-red-500" : "text-fd-muted-foreground"
                    )}
                  >
                    {isRunning ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : displayInfo.isError ? (
                      <TriangleAlert className="size-3" />
                    ) : (
                      <displayInfo.Icon className="size-3" />
                    )}
                    <span>{displayInfo.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show completed thinking summary when done (not during loading) */}
          {showThinkingSummary && (
            <div className="flex items-center gap-2 text-xs text-fd-muted-foreground">
              <Brain className="size-3" />
              <span>Thought ({reasoningData.tokens} tokens)</span>
            </div>
          )}

          {/* Reasoning - collapsed by default, only when text is available */}
          {reasoningData.content && textContent && (
            <details className="text-xs text-fd-muted-foreground">
              <summary className="cursor-pointer flex items-center gap-1.5">
                <Brain className="size-3" />
                <span>View reasoning</span>
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words rounded border border-dashed border-fd-border/60 bg-fd-background p-2 text-[11px] leading-tight">
                {reasoningData.content}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Message content section - no bubble, just prose */}
      {textContent && (
        <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <ReactMarkdown>{textContent}</ReactMarkdown>
        </div>
      )}

      {(onFeedback && isMessageComplete || textContent) && (
        <div className="group/actions mt-1 flex flex-wrap items-center gap-1 opacity-0 transition-opacity hover:opacity-100">
          {textContent && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Copy answer"
              onClick={handleCopy}
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            </Button>
          )}

          {onFeedback && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'h-6 w-6',
                  feedback === 'positive' &&
                    'bg-green-100/80 text-green-600 dark:bg-green-900/40 dark:text-green-300'
                )}
                aria-label={feedback === 'positive' ? 'Remove positive feedback' : 'Mark as helpful'}
                onClick={() => handleFeedback('positive')}
              >
                <ThumbsUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'h-6 w-6',
                  feedback === 'negative' &&
                    'bg-red-100/80 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                )}
                aria-label={feedback === 'negative' ? 'Remove negative feedback' : 'Mark as unhelpful'}
                onClick={() => handleFeedback('negative')}
              >
                <ThumbsDown className="size-3" />
              </Button>
            </>
          )}

          {showCommentInput && (
            <div className="ml-1 flex flex-1 items-center gap-2">
              <input
                type="text"
                placeholder="Optional feedback…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitFeedback();
                  }
                }}
                className="flex-1 rounded border border-fd-border bg-fd-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-fd-primary"
              />
              <Button type="button" size="sm" onClick={submitFeedback}>
                Submit
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
