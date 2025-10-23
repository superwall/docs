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
        // Remove /docs prefix if present and add .md extension
        const cleanPath = pathname.replace(/^\/docs/, '');
        mdPath = cleanPath.endsWith('/') ? `${cleanPath}index.md` : `${cleanPath}.md`;
      } else {
        // docId like "ios/quickstart" -> "/docs/ios/quickstart.md"
        mdPath = `/docs/${docId}.md`;
      }

      const fullUrl = `https://superwall.com${mdPath}`;

      // Fetch the markdown content
      const response = await fetch(fullUrl);

      if (!response.ok) {
        console.error(`[page_context] Failed to fetch ${fullUrl}: ${response.status} ${response.statusText}`);
        return { error: `Failed to fetch page: ${response.status}` };
      }

      const content = await response.text();

      // For now, return the full content
      // TODO: Implement chunking, ranking, and token budgeting
      return {
        url: isUrl ? docId : `https://superwall.com/docs/${docId}`,
        docId: isUrl ? 'unknown' : docId,
        content,
      };
    } catch (error) {
      console.error(`[page_context] Error fetching page for docId "${docId}":`, error);
      return { error: `Failed to fetch page content: ${error}` };
    }
  },
});

/**
 * Tool: mcp.search
 * Search documentation via MCP endpoint (semantic search powered by embeddings)
 */
export const mcpSearchTool = tool({
  description: 'Search the Superwall documentation using semantic search. Returns relevant documentation pages with snippets.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    try {
      // Call MCP docs-search endpoint
      const mcpUrl = 'https://mcp.superwall.com/docs-search';

      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[mcp_search] Failed to call ${mcpUrl}: ${response.status} ${response.statusText}`, errorText);
        return { error: `MCP search failed: ${response.status}` };
      }

      const data = await response.json();

      // Extract text results from the content array
      const results = (data.content || []).map((item: any) => ({
        text: item.text,
        type: item.type,
      }));

      return {
        results,
        query,
      };
    } catch (error) {
      console.error(`[mcp_search] Error searching for "${query}":`, error);
      return { error: `MCP search error: ${error}` };
    }
  },
});

