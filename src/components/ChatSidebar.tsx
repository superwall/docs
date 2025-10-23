'use client';

import { cn } from 'fumadocs-ui/utils/cn';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import { ChatView } from './ChatView';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WIDTH_STORAGE_KEY = 'chat:sidebar-width';
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 320;
const COLLAPSE_THRESHOLD = 180;
const FULLSCREEN_MARGIN = 40;

const clampWidth = (value: number, viewportWidth: number) => {
  const maxWidth = Math.max(MIN_WIDTH, viewportWidth);
  return Math.min(Math.max(value, MIN_WIDTH), maxWidth);
};

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? MIN_WIDTH : window.innerWidth
  );
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth >= 1024
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_WIDTH;
    }

    const stored = window.localStorage.getItem(WIDTH_STORAGE_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : DEFAULT_WIDTH;
    const safeWidth = Number.isNaN(parsed) ? DEFAULT_WIDTH : parsed;
    return clampWidth(safeWidth, window.innerWidth);
  });

  const widthRef = useRef(width);
  const previousWidthRef = useRef<number | null>(null);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isFullscreen) return;

    window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  }, [width, isFullscreen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (isOpen && isDesktop && !isFullscreen) {
      root.style.setProperty('--sw-chat-width', `${width}px`);
    } else {
      root.style.setProperty('--sw-chat-width', '0px');
    }

    return () => {
      root.style.setProperty('--sw-chat-width', '0px');
    };
  }, [isOpen, isDesktop, isFullscreen, width]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.cursor = isResizing ? 'col-resize' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const nextViewportWidth = window.innerWidth;
      setViewportWidth(nextViewportWidth);

      const desktop = nextViewportWidth >= 1024;
      setIsDesktop(desktop);

      if (!desktop) {
        setIsFullscreen(false);
      }

      setWidth((prevWidth) => {
        if (isFullscreen) {
          return nextViewportWidth;
        }
        return clampWidth(prevWidth, nextViewportWidth);
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  const resetWidth = useCallback(() => {
    if (typeof window === 'undefined') return;
    const viewport = window.innerWidth;
    setIsFullscreen(false);
    previousWidthRef.current = null;
    setWidth(clampWidth(DEFAULT_WIDTH, viewport));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof window === 'undefined') return;

    const viewport = window.innerWidth;
    if (isFullscreen) {
      setIsFullscreen(false);
      const fallbackWidth = previousWidthRef.current ?? clampWidth(DEFAULT_WIDTH, viewport);
      setWidth(clampWidth(fallbackWidth, viewport));
    } else {
      previousWidthRef.current = widthRef.current;
      setIsFullscreen(true);
      setWidth(viewport);
    }
  }, [isFullscreen]);

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    event.preventDefault();
    setIsResizing(true);
    setIsFullscreen(false);
    previousWidthRef.current = null;

    const startX = event.clientX;
    const startWidth = widthRef.current;

    function stopResize() {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    }

    function handleMouseMove(moveEvent: MouseEvent) {
      const viewport = window.innerWidth;
      const delta = startX - moveEvent.clientX;
      const proposedWidth = startWidth + delta;

      if (proposedWidth <= COLLAPSE_THRESHOLD) {
        stopResize();
        onClose();
        setWidth(clampWidth(DEFAULT_WIDTH, viewport));
        return;
      }

      if (proposedWidth >= viewport - FULLSCREEN_MARGIN) {
        if (!isFullscreen) {
          previousWidthRef.current = startWidth;
        }
        setIsFullscreen(true);
        setWidth(viewport);
        return;
      }

      setIsFullscreen(false);
      setWidth(clampWidth(proposedWidth, viewport));
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
  };

  const sidebarStyle = isDesktop
    ? isFullscreen
      ? { width: '100vw', minWidth: '100vw', maxWidth: '100vw' }
      : { width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${viewportWidth}px` }
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
          'fixed top-0 right-0 z-50 flex h-full w-full flex-col bg-fd-background transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          isDesktop && !isFullscreen ? 'border-l border-fd-border' : 'border-none'
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

        <ChatView
          className="h-full"
          showCloseButton
          onClose={onClose}
          allowFullscreenToggle={isDesktop}
          isFullscreen={isFullscreen}
          onToggleFullscreen={isDesktop ? toggleFullscreen : undefined}
          autoFocus={isOpen}
        />
      </div>
    </>
  );
}
