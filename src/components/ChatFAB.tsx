'use client';

import { MessageCircle } from 'lucide-react';
import { cn } from 'fumadocs-ui/utils/cn';

interface ChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatFAB({ onClick, isOpen }: ChatFABProps) {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      <button
        onClick={onClick}
        className={cn(
          'h-[45px] w-[45px] rounded-full',
          'bg-fd-primary text-fd-primary-foreground',
          'shadow-lg hover:shadow-xl',
          'flex items-center justify-center',
          'transition-all duration-200',
          'hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-fd-primary focus:ring-offset-2'
        )}
        aria-label="Open AI Chat (⌘I)"
        title="Open AI Chat (⌘I)"
      >
        <MessageCircle className="size-5" fill="currentColor" />
      </button>
      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-1">
        <div className="rounded-md border border-fd-border bg-fd-popover px-2 py-1 text-xs text-fd-popover-foreground shadow-md">
          ⌘
        </div>
        <div className="rounded-md border border-fd-border bg-fd-popover px-2 py-1 text-xs text-fd-popover-foreground shadow-md">
          I
        </div>
      </div>
    </div>
  );
}
