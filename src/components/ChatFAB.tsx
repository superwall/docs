'use client';

import { Sparkles } from 'lucide-react';
import { cn } from 'fumadocs-ui/utils/cn';

interface ChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatFAB({ onClick, isOpen }: ChatFABProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'size-12 rounded-full',
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
      <Sparkles className="size-5" />
    </button>
  );
}
