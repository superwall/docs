import { source } from "@/lib/source"
import { createFromSource, type SortedResult } from "fumadocs-core/search/server"
import { NextRequest, NextResponse } from "next/server";
import titleMap from '@/lib/title-map.json';

// Validate and default search mode
const getSearchMode = () => {
  const mode = process.env.SEARCH_MODE;
  if (mode === 'rag' || mode === 'fumadocs') {
    return mode;
  }
  return 'fumadocs'; // Default to fumadocs for any invalid/undefined value
};

const SEARCH_MODE = getSearchMode();
const RAG_ENDPOINT = 'https://mcp.superwall.com/docs-search';
const IS_DEV = process.env.NODE_ENV === 'development' || process.env.NEXTJS_ENV === 'development';

// Fumadocs search implementation
const fumadocsSearch = createFromSource(source);

// Helper to get title from title map or fallback to filename
function getTitle(filepath: string): string {
  // Try exact match first
  if (titleMap[filepath as keyof typeof titleMap]) {
    return titleMap[filepath as keyof typeof titleMap];
  }

  // Try with different extension
  const withMd = filepath.replace(/\.mdx?$/, '.md');
  if (titleMap[withMd as keyof typeof titleMap]) {
    return titleMap[withMd as keyof typeof titleMap];
  }

  const withMdx = filepath.replace(/\.mdx?$/, '.mdx');
  if (titleMap[withMdx as keyof typeof titleMap]) {
    return titleMap[withMdx as keyof typeof titleMap];
  }

  // Fallback: convert filename to readable title
  const filename = filepath.split('/').pop() || filepath;
  const withoutExt = filename.replace(/\.mdx?$/, '');
  const words = withoutExt.split(/[-_]/).map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
  return words.join(' ');
}

// Transform RAG response to Fumadocs format
function transformRagResults(ragResponse: any): SortedResult[] {
  if (!ragResponse?.content || !Array.isArray(ragResponse.content)) {
    return [];
  }

  const results: SortedResult[] = [];

  for (const item of ragResponse.content) {
    if (item.type !== 'text' || !item.text) continue;

    // Extract filename from "File: path/to/file.md" format
    const fileMatch = item.text.match(/^File:\s*([^\n]+)/);
    if (!fileMatch) continue;

    const filePath = fileMatch[1].trim();

    // Remove .md extension and construct URL
    let urlPath = filePath.replace(/\.mdx?$/, '');

    // Strip trailing /index for directory landing pages (e.g., ios/index -> ios)
    // Also handle root index (index -> empty string)
    if (urlPath.endsWith('/index')) {
      urlPath = urlPath.slice(0, -6); // Remove '/index'
    } else if (urlPath === 'index') {
      urlPath = ''; // Root index becomes empty path
    }

    const url = urlPath ? `/docs/${urlPath}` : '/docs';

    // Extract tag from URL path (first segment after /docs/)
    const pathParts = urlPath.split('/');
    const tag = pathParts[0] || '';

    // Get title from title map
    const title = getTitle(filePath);

    if (IS_DEV) {
      console.log(`\n[Transform] Processing: ${filePath}`);
      console.log(`[Transform] URL: ${url}`);
      console.log(`[Transform] Title: "${title}"`);
    }

    results.push({
      id: url,
      url,
      type: 'page',
      content: title,
      ...(tag && { tag })
    } as SortedResult);
  }

  if (IS_DEV) {
    console.log(`[Transform] Total results: ${results.length}`);
  }

  return results;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const sdk = searchParams.get('sdk') || searchParams.get('tag');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    if (SEARCH_MODE === 'rag') {
      if (IS_DEV) {
        console.log(`search (rag) query: "${query}"${sdk ? ` sdk: "${sdk}"` : ''} received...`);
      }

      // Call RAG endpoint with POST (endpoint requires POST, not GET)
      const response = await fetch(RAG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...(sdk && { sdk }),
        }),
      });

      if (!response.ok) {
        console.error('RAG endpoint error:', response.status, response.statusText);
        // Fallback to empty results on error
        return NextResponse.json([]);
      }

      const ragData = await response.json();
      const results = transformRagResults(ragData);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      if (IS_DEV) {
        const resultTitles = results.slice(0, 3).map(r => `"${r.content.slice(0, 30)}..."`).join(', ');
        console.log(`search (rag) query: "${query}" took ${duration}s, results: ${resultTitles}${results.length > 3 ? `, +${results.length - 3} more` : ''}`);
      }

      return NextResponse.json(results);
    } else {
      if (IS_DEV) {
        console.log(`search (fumadocs) query: "${query}"${sdk ? ` sdk: "${sdk}"` : ''} received...`);
      }

      // Use Fumadocs search
      const response = await fumadocsSearch.GET(request);
      const data = await response.json();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      if (IS_DEV) {
        const results = Array.isArray(data) ? data : [];
        const resultTitles = results.slice(0, 3).map((r: any) => `"${r.content?.slice(0, 30) || r.id}..."`).join(', ');
        console.log(`search (fumadocs) query: "${query}" took ${duration}s, results: ${resultTitles}${results.length > 3 ? `, +${results.length - 3} more` : ''}`);
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Search error:', error);
    // Return empty results on error instead of failing
    return NextResponse.json([]);
  }
}
