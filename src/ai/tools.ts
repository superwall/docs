import { tool } from 'ai';
import { z } from 'zod';

/**
 * Tool: page.context
 * Fetches bounded text slices of a specific doc page
 */
export const pageContextTool = tool({
  description: 'Fetch the full content of a specific documentation page. Use this when you need detailed information about a particular page.',
  inputSchema: z.object({
    docId: z.string().describe('The document ID (e.g., "ios/quickstart") or full URL of the page to fetch'),
  }),
  execute: async ({ docId }) => {
    try {
      // docId can be either a path like "ios/quickstart" or a full URL
      const isUrl = docId.startsWith('http');
      let mdPath: string;

      if (isUrl) {
        // Extract path from URL
        const urlObj = new URL(docId);
        const pathname = urlObj.pathname;
        mdPath = pathname.endsWith('/') ? `${pathname}index.md` : `${pathname}.md`;
      } else {
        mdPath = `/docs/${docId}.md`;
      }

      // Fetch the markdown content
      const response = await fetch(`https://docs.superwall.com${mdPath}`);

      if (!response.ok) {
        return { error: `Failed to fetch page: ${response.status}` };
      }

      const content = await response.text();

      // For now, return the full content
      // TODO: Implement chunking, ranking, and token budgeting
      return {
        url: isUrl ? docId : `https://docs.superwall.com/docs/${docId}`,
        docId: isUrl ? 'unknown' : docId,
        content,
      };
    } catch (error) {
      return { error: `Failed to fetch page content: ${error}` };
    }
  },
});

/**
 * Tool: mcp.search
 * Search documentation via MCP endpoint
 */
export const mcpSearchTool = tool({
  description: 'Search the Superwall documentation using semantic search. Returns relevant documentation pages with snippets.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    try {
      // Call MCP SSE endpoint
      const mcpUrl = 'https://mcp.superwall.com/sse';

      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'search_docs',
            arguments: {
              query,
            },
          },
        }),
      });

      if (!response.ok) {
        return { error: `MCP search failed: ${response.status}` };
      }

      const data = await response.json();

      // Return results in compact format
      return {
        results: data.content?.[0]?.text || [],
        query,
      };
    } catch (error) {
      return { error: `MCP search error: ${error}` };
    }
  },
});

/**
 * Tool: docs.search
 * Search using the existing docs search API (non-MCP)
 */
export const docsSearchTool = tool({
  description: 'Search the documentation using the built-in search API. Alternative to MCP search.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    try {
      // Call the existing search API
      const response = await fetch(`https://docs.superwall.com/api/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        return { error: `Search failed: ${response.status}` };
      }

      const data = await response.json();

      // Transform to match MCP search format
      const results = data.map((item: any) => ({
        title: item.title,
        url: item.url,
        snippet: item.content || item.description,
        score: item.score,
      }));

      return {
        results,
        query,
      };
    } catch (error) {
      return { error: `Search error: ${error}` };
    }
  },
});
