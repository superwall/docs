'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatView } from '@/components/ChatView';

export default function AIPage() {
  // const router = useRouter();

  // Check if we're at /docs/ai and redirect to /docs/home?ai=true
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && window.location.pathname === '/docs/ai') {
  //     router.replace('/docs/home?ai=true');
  //   }
  // }, [router]);

  // If we're at /ai, show fullscreen chat
  return (
    <div className="fixed inset-0 flex">
      {/* Fullscreen chat view - goes up to the left sidebar */}
      <ChatView
        className="flex-1"
        showCloseButton={false}
        allowFullscreenToggle={false}
        autoFocus
      />
    </div>
  );
}
