'use client';

import { cn } from 'fumadocs-ui/utils/cn';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { ChatView } from './ChatView';
import { useDialogState } from '@/hooks/useDialogState';
import { useFumadocsSidebarWidth } from '@/hooks/useFumadocsSidebarWidth';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WIDTH_STORAGE_KEY = 'chat:sidebar-width';
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 320;
const COLLAPSE_THRESHOLD = 180;

const clampWidth = (value: number, viewportWidth: number) => {
  const maxWidth = Math.max(MIN_WIDTH, viewportWidth);
  return Math.min(Math.max(value, MIN_WIDTH), maxWidth);
};

function ChatSidebarInner({ isOpen, onClose }: ChatSidebarProps) {
  const { chatWiggle, setChatOpen } = useDialogState();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? MIN_WIDTH : window.innerWidth
  );
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth >= 1024
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const leftSidebarWidth = useFumadocsSidebarWidth();
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

  // Handle wiggle trigger
  useEffect(() => {
    if (chatWiggle > 0 && isOpen) {
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 500);
    }
  }, [chatWiggle, isOpen]);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isFullscreen) return;

    window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  }, [width, isFullscreen]);

  const fullscreenWidth = isDesktop && leftSidebarWidth > 0
    ? `calc(100vw - ${leftSidebarWidth}px)`
    : '100vw';

  const leftSidebarWidthRef = useRef(leftSidebarWidth);
  useEffect(() => {
    leftSidebarWidthRef.current = leftSidebarWidth;
  }, [leftSidebarWidth]);

  const setAiParam = useCallback(
    (mode: 'fullscreen' | null) => {
      if (!searchParams) return;
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get('ai');
      if (mode) {
        if (current === mode) {
          return;
        }
        params.set('ai', mode);
      } else {
        if (!params.has('ai')) {
          return;
        }
        params.delete('ai');
      }

      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!isDesktop || isFullscreen) return;
    if (leftSidebarWidth <= 0) return;
    if (typeof window === 'undefined') return;

    const navLimit = Math.max(MIN_WIDTH, window.innerWidth - leftSidebarWidth - 16);
    setWidth((prev) => (prev > navLimit ? navLimit : prev));
  }, [leftSidebarWidth, isDesktop, isFullscreen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (isOpen && isDesktop) {
      const widthValue = isFullscreen ? fullscreenWidth : `${width}px`;
      root.style.setProperty('--sw-chat-width', widthValue);
    } else {
      root.style.setProperty('--sw-chat-width', '0px');
    }

    return () => {
      root.style.setProperty('--sw-chat-width', '0px');
    };
  }, [isOpen, isDesktop, isFullscreen, width, fullscreenWidth]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.cursor = isResizing ? 'col-resize' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (!isOpen && wasOpenRef.current) {
      if (isFullscreen) {
        setIsFullscreen(false);
      }
      if (searchParams?.has('ai')) {
        setAiParam(null);
      }
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, isFullscreen, searchParams, setAiParam]);

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

  useEffect(() => {
    if (searchParams?.get('ai') !== 'fullscreen') {
      return;
    }

    if (!isOpen) {
      setChatOpen(true);
    }

    if (!isDesktop) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!isFullscreen) {
      previousWidthRef.current = widthRef.current;
      setIsFullscreen(true);
      setWidth(window.innerWidth);
      window.localStorage.removeItem(WIDTH_STORAGE_KEY);
    }
  }, [isDesktop, isFullscreen, isOpen, searchParams, setChatOpen]);

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
      // Exiting fullscreen
      setIsFullscreen(false);
      const fallbackWidth = previousWidthRef.current ?? clampWidth(DEFAULT_WIDTH, viewport);
      setWidth(clampWidth(fallbackWidth, viewport));
      setAiParam(null);
    } else {
      // Entering fullscreen
      previousWidthRef.current = widthRef.current;
      setIsFullscreen(true);
      setWidth(viewport);

      // Clear saved width and redirect to /docs/ai
      window.localStorage.removeItem(WIDTH_STORAGE_KEY);
      setAiParam('fullscreen');
    }
  }, [isFullscreen, setAiParam]);

  const handleClose = useCallback(() => {
    setAiParam(null);
    onClose();
  }, [onClose, setAiParam]);

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

      const navWidth = leftSidebarWidthRef.current;
      const fullscreenViewport = viewport * 0.95;
      const baseThreshold = Math.max(MIN_WIDTH, fullscreenViewport);

      let takeoverThreshold: number;
      if (navWidth > 0) {
        const navLimit = Math.max(MIN_WIDTH, viewport - navWidth);
        const navThreshold = Math.max(MIN_WIDTH, navLimit - 16);
        takeoverThreshold = Math.min(baseThreshold, navThreshold);
      } else {
        takeoverThreshold = baseThreshold;
      }

      if (proposedWidth >= takeoverThreshold) {
        if (!isFullscreen) {
          previousWidthRef.current = startWidth;
          setIsFullscreen(true);
          setWidth(viewport);
          setAiParam('fullscreen');
        }
        return;
      }

      if (isFullscreen) {
        setAiParam(null);
      }
      setIsFullscreen(false);
      setWidth(clampWidth(proposedWidth, viewport));
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
  };

  const sidebarStyle = isDesktop
    ? isFullscreen
      ? { width: fullscreenWidth, minWidth: fullscreenWidth, maxWidth: fullscreenWidth }
      : { width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${viewportWidth}px` }
    : undefined;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={handleClose}
        />
      )}

      <div
        className={cn(
          'fixed top-0 right-0 flex h-full w-full flex-col bg-fd-background transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          isDesktop && !isFullscreen ? 'border-l border-fd-border' : 'border-none',
          isWiggling && 'animate-wiggle'
        )}
        style={{
          ...sidebarStyle,
          zIndex: isFullscreen ? 5 : 40,
        }}
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
          onClose={handleClose}
          allowFullscreenToggle={isDesktop}
          isFullscreen={isFullscreen}
          onToggleFullscreen={isDesktop ? toggleFullscreen : undefined}
          autoFocus={isOpen}
        />
      </div>
    </>
  );
}

export function ChatSidebar(props: ChatSidebarProps) {
  return (
    <Suspense fallback={null}>
      <ChatSidebarInner {...props} />
    </Suspense>
  );
}
