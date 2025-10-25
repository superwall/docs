import type { DocContext } from '@/ai/message-types';

/**
 * Extract light page metadata from the current page
 * Returns: url, docId, title, and top headings (3-6)
 */
export function extractPageContext(
  pathname: string,
  pageContent?: string | null
): DocContext | null {
  if (!pathname || !pathname.startsWith('/docs/')) {
    return null;
  }

  // Extract docId from pathname (e.g., /docs/ios/quickstart -> ios/quickstart)
  const docId = pathname.replace(/^\/docs\//, '').replace(/\/$/, '');

  const url = typeof window !== 'undefined' ? window.location.href : `https://docs.superwall.com${pathname}`;

  // If we don't have content, return basic context
  if (!pageContent) {
    return {
      url,
      docId,
    };
  }

  // Extract title (first # heading)
  const titleMatch = pageContent.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1];

  // Extract headings (##, ###, etc.) - limit to top 6
  const headingMatches = pageContent.matchAll(/^#{2,}\s+(.+)$/gm);
  const headings = Array.from(headingMatches)
    .map(match => match[1])
    .slice(0, 6);

  return {
    url,
    docId,
    title,
    headings: headings.length > 0 ? headings : undefined,
  };
}

/**
 * Create a compact context string for injection into messages
 */
export function formatLightContext(context: DocContext | null): string {
  if (!context) {
    return '';
  }

  let formatted = `Current page: ${context.url}`;

  if (context.title) {
    formatted += `\nTitle: ${context.title}`;
  }

  if (context.headings && context.headings.length > 0) {
    formatted += `\nSections: ${context.headings.join(', ')}`;
  }

  return formatted;
}
