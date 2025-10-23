'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ChatView } from '@/components/ChatView';

export default function AIPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialQuery, setInitialQuery] = useState<{ id: number; value: string } | null>(null);

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

  return (
    <div className="flex flex-1">
      <ChatView
        className="min-h-screen w-full"
        autoFocus
        initialQuery={initialQuery?.value}
        initialQueryKey={initialQuery?.id ?? null}
      />
    </div>
  );
}
