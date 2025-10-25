import { useEffect, useRef, useState } from 'react';

const SIDEBAR_SELECTOR = '#nd-sidebar';

const parseWidth = (value: string | null | undefined) => {
  if (!value) return 0;
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : 0;
};

const getSidebarWidth = (sidebar: HTMLElement | null) => {
  if (!sidebar) return 0;

  if (sidebar.dataset.collapsed === 'true') {
    return 0;
  }

  const rectWidth = Math.round(sidebar.getBoundingClientRect().width || 0);
  if (rectWidth > 0) {
    return rectWidth;
  }

  const style = typeof window !== 'undefined' ? window.getComputedStyle(sidebar) : null;
  if (style) {
    const width = parseWidth(style.getPropertyValue('width'));
    if (width > 0) {
      return width;
    }
  }

  if (typeof window !== 'undefined') {
    const rootStyle = window.getComputedStyle(document.documentElement);
    const varWidth = parseWidth(rootStyle.getPropertyValue('--fd-sidebar-width'));
    if (varWidth > 0) {
      return varWidth;
    }
  }

  return 0;
};

export function useFumadocsSidebarWidth() {
  const [width, setWidth] = useState(0);
  const sidebarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let attributeObserver: MutationObserver | null = null;
    let domObserver: MutationObserver | null = null;
    let intervalId: number | null = null;
    let resizeListenerAttached = false;
    let windowResizeHandler: ((this: Window, ev: UIEvent) => any) | null = null;
    let transitionHandler: (() => void) | null = null;
    let animationHandler: (() => void) | null = null;

    const updateWidth = (element: HTMLElement | null) => {
      const nextWidth = getSidebarWidth(element);
      setWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    };

    const scheduleUpdate = (element: HTMLElement | null = sidebarRef.current) => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      frame = window.requestAnimationFrame(() => {
        updateWidth(element);
      });
    };

    const detachSidebarObservers = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      resizeObserver?.disconnect();
      resizeObserver = null;

      attributeObserver?.disconnect();
      attributeObserver = null;

      if (resizeListenerAttached) {
        if (windowResizeHandler) {
          window.removeEventListener('resize', windowResizeHandler);
          windowResizeHandler = null;
        }
        resizeListenerAttached = false;
      }

      const sidebar = sidebarRef.current;
      if (sidebar) {
        if (transitionHandler) {
          sidebar.removeEventListener('transitionend', transitionHandler);
        }
        if (animationHandler) {
          sidebar.removeEventListener('animationend', animationHandler);
        }
      }
      transitionHandler = null;
      animationHandler = null;
    };

    const attachToSidebar = () => {
      const sidebar = document.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
      if (!sidebar) {
        sidebarRef.current = null;
        scheduleUpdate(null);
        return false;
      }

      if (sidebarRef.current !== sidebar) {
        detachSidebarObservers();
        sidebarRef.current = sidebar;
      }

      scheduleUpdate(sidebar);

      if (typeof window.ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => scheduleUpdate(sidebar));
        resizeObserver.observe(sidebar);
      } else if (!resizeListenerAttached) {
        windowResizeHandler = () => scheduleUpdate();
        window.addEventListener('resize', windowResizeHandler);
        resizeListenerAttached = true;
      }

      if (typeof window.MutationObserver !== 'undefined') {
        attributeObserver = new MutationObserver(() => scheduleUpdate(sidebar));
        attributeObserver.observe(sidebar, {
          attributes: true,
          attributeFilter: ['data-collapsed', 'style', 'class'],
        });
      }

      transitionHandler = () => scheduleUpdate(sidebar);
      animationHandler = () => scheduleUpdate(sidebar);
      sidebar.addEventListener('transitionend', transitionHandler);
      sidebar.addEventListener('animationend', animationHandler);

      return true;
    };

    const ensureSidebar = () => {
      if (attachToSidebar()) {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }

      if (intervalId === null) {
        intervalId = window.setInterval(() => {
          if (attachToSidebar() && intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
        }, 300);
      }
    };

    ensureSidebar();

    if (typeof window.MutationObserver !== 'undefined') {
      domObserver = new MutationObserver(() => {
        const sidebar = sidebarRef.current;
        if (!sidebar || !sidebar.isConnected) {
          ensureSidebar();
        }
      });
      domObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      detachSidebarObservers();
      domObserver?.disconnect();
      domObserver = null;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return width;
}
