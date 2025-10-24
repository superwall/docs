'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ChatView } from '@/components/ChatView';
import { useFumadocsSidebarWidth } from '@/hooks/useFumadocsSidebarWidth';

export default function AIPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialQuery, setInitialQuery] = useState<{ id: number; value: string } | null>(null);
  const sidebarWidth = useFumadocsSidebarWidth();

  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (!searchQuery) return;

    try {
      const decoded = decodeURIComponent(searchQuery);
      if (decoded.trim().length > 0) {
        setInitialQuery({ id: Date.now(), value: decoded });
      }
    } catch {
      // ignore malformed queries
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, router]);

  const computedWidth = sidebarWidth > 0 ? `calc(100vw - ${sidebarWidth}px)` : '100vw';

  return (
    <div className="flex flex-1 justify-end">
      <div
        className="flex w-full min-h-screen"
        style={{ width: computedWidth, maxWidth: '100vw' }}
      >
        <ChatView
          className="min-h-screen w-full"
          autoFocus
          initialQuery={initialQuery?.value}
          initialQueryKey={initialQuery?.id ?? null}
        />
      </div>
    </div>
  );
}
