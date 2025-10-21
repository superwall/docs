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
} from 'lucide-react';

import { Button } from '@/components/ui/button';

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

const TOOL_PREFIX = 'tool-';

const extractText = (message: UIMessage) =>
  message.parts
    .filter(part => part.type === 'text')
    .map(part => ('text' in part ? part.text : ''))
    .join('')
    .trim();

const extractReasoning = (message: UIMessage) =>
  message.parts
    .filter(part => part.type === 'reasoning')
    .map(part => ('text' in part ? part.text : ''))
    .join('\n')
    .trim();

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
}

export function ChatMessage({ message, onFeedback }: ChatMessageProps) {
  const role = message.role;

  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);

  const textContent = useMemo(() => extractText(message), [message]);
  const reasoningContent = useMemo(() => extractReasoning(message), [message]);
  const toolParts = useMemo(() => extractToolParts(message), [message]);

  const hasToolInFlight = toolParts.some(part => isToolRunning(part));
  const isStreamingText = message.parts.some(
    part => part.type === 'text' && 'state' in part && part.state === 'streaming'
  );
  const showThinkingPlaceholder =
    role === 'assistant' && !textContent && (isStreamingText || hasToolInFlight);

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
    const textToCopy = [textContent, reasoningContent]
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
  }, [textContent, reasoningContent]);

  if (role === 'system') {
    return null;
  }

  if (role === 'user') {
    const userText = textContent || '…';

    return (
      <div className="mb-4 flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-fd-primary px-4 py-2 text-fd-primary-foreground">
          <p className="text-sm whitespace-pre-wrap">{userText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="rounded-lg bg-fd-accent/30 px-4 py-3">
        <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {toolParts.length > 0 && (
            <div className="mb-3 space-y-2 text-xs">
              {toolParts.map((part, index) => {
                const toolName = getToolName(part);
                const isRunning = isToolRunning(part);
                const isComplete = isToolComplete(part);

                const Icon = (() => {
                  if (isRunning) return Workflow;
                  if (part.state === 'output-error') return TriangleAlert;
                  return Check;
                })();

                const statusLabel = (() => {
                  switch (part.state) {
                    case 'input-streaming':
                      return `Preparing ${toolName}…`;
                    case 'input-available':
                      return `Calling ${toolName}…`;
                    case 'output-available':
                      return `${toolName} finished`;
                    case 'output-error':
                      return `${toolName} failed`;
                    default:
                      return `${toolName}`;
                  }
                })();

                const outputPreview = summariseOutput(part.output);

                return (
                  <div
                    key={`${part.toolCallId ?? toolName}-${index}`}
                    className="rounded-md border border-fd-border bg-fd-background/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {isRunning ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Icon className="size-3" />
                      )}
                      <span>{statusLabel}</span>
                      {part.preliminary && (
                        <span className="text-[10px] uppercase text-amber-600 dark:text-amber-400">preview</span>
                      )}
                    </div>

                    {outputPreview && (
                      <div className="mt-2 whitespace-pre-wrap break-words rounded border border-dashed border-fd-border/60 bg-fd-background p-2 text-[11px] leading-tight">
                        {outputPreview}
                      </div>
                    )}

                    {part.state === 'output-error' && (
                      <div className="mt-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-500">
                        {typeof part.errorText === 'string'
                          ? part.errorText
                          : 'The tool reported an error.'}
                      </div>
                    )}

                    {!isComplete && !isRunning && (
                      <div className="mt-2 text-[11px] text-fd-muted-foreground">
                        Awaiting response…
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showThinkingPlaceholder && (
            <div className="mb-3 flex items-center gap-2 text-sm text-fd-muted-foreground">
              <Brain className="size-4 animate-pulse" />
              <span>Thinking…</span>
            </div>
          )}

          {textContent && <ReactMarkdown>{textContent}</ReactMarkdown>}

          {reasoningContent && (
            <details className="mt-3 text-xs text-fd-muted-foreground">
              <summary className="cursor-pointer">Show reasoning</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words rounded border border-dashed border-fd-border/60 bg-fd-background p-2 text-[11px] leading-tight">
                {reasoningContent}
              </pre>
            </details>
          )}
        </div>
      </div>

      {(onFeedback || textContent) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fd-muted-foreground">
          {textContent && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Copy answer"
              onClick={handleCopy}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          )}

          {onFeedback && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={feedback === 'positive' ? 'Remove positive feedback' : 'Mark as helpful'}
                onClick={() => handleFeedback('positive')}
                className={cn(
                  feedback === 'positive' &&
                    'bg-green-100/80 text-green-600 dark:bg-green-900/40 dark:text-green-300'
                )}
              >
                <ThumbsUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={feedback === 'negative' ? 'Remove negative feedback' : 'Mark as unhelpful'}
                onClick={() => handleFeedback('negative')}
                className={cn(
                  feedback === 'negative' &&
                    'bg-red-100/80 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                )}
              >
                <ThumbsDown className="size-4" />
              </Button>
            </div>
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
