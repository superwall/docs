'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to fetch the markdown content of the current page
 * Looks for .md file at the same path as the current page
 */
export function useCurrentPageMd() {
  const pathname = usePathname();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if not on a docs page
    if (!pathname || !pathname.startsWith('/docs/')) {
      setContent(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Convert route path to .md file path
    // e.g., /docs/ios/quickstart -> /docs/ios/quickstart.md
    const mdPath = pathname.endsWith('/')
      ? `${pathname}index.md`
      : `${pathname}.md`;

    fetch(mdPath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch ${mdPath}: ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not fetch current page markdown:', err);
        setError(err);
        setContent(null);
        setLoading(false);
      });
  }, [pathname]);

  return {
    content,
    loading,
    error,
    pathname,
  };
}
