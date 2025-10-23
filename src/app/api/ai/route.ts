import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { pageContextTool, mcpSearchTool } from '@/ai/tools';
import type { AppMessage } from '@/ai/message-types';

export const runtime = 'edge';

const systemPrompt = `You are an AI assistant for the Superwall documentation.

**Response Format:**
- Keep answers concise: you live in a chat sidebar, so you need to be concise and to the point
- Use markdown formatting when appropriate: lists, code blocks, and headings
- Include direct links to docs pages when helpful (always in markdown format: [link text](https://superwall.com/docs/path), never just the raw URL)
- Always lead with the answer, no preamble. Users can ask follow-up questions if they need more information.

**Context & Tools:**
- User's current page is primary context
- Use mcp_search to search documentation when needed (semantic search powered by embeddings)
- Use page_context for specific page details
- Cite sources by linking to doc pages with markdown formatting
- **Important**: If a tool fails, only retry it ONCE with a modified approach. If it fails again, move on and work with available information.

**Code Examples:**
- Include when helpful, keep concise
- Note platform differences when relevant
- Prefer inline code for small snippets`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, currentPageContent, currentPagePath, currentPageUrl, debug: debugFromBody } = body as {
      messages: AppMessage[];
      currentPageContent?: string;
      currentPagePath?: string;
      currentPageUrl?: string;
      debug?: boolean;
    };

    let debug = Boolean(debugFromBody);
    if (!debug && currentPageUrl) {
      try {
        const url = new URL(currentPageUrl);
        const debugParam = url.searchParams.get('ai-debug');
        if (debugParam === '' || debugParam === '1' || debugParam === 'true') {
          debug = true;
        }
      } catch (error) {
        console.warn('Failed to parse current page URL for debug flag', error);
      }
    }

    if (!debug && process.env.AI_DEBUG?.toLowerCase() === 'true') {
      debug = true;
    }

    const getNow = () =>
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    const startTime = getNow();
    const elapsed = () => `${Math.round(getNow() - startTime)}ms`;
    const debugLog = (...args: unknown[]) => {
      if (!debug) return;
      const timestamp = new Date().toISOString();
      console.log(`[AI debug ${timestamp} +${elapsed()}]`, ...args);
    };
    // Track tool execution times and tokens
    const toolMetrics = new Map<string, { startTime: number; tokens?: number }>();
    const stepMetrics: Array<{ type: string; duration: number; tokens: number }> = [];

    if (debug) {
      debugLog('Debug mode enabled');
      debugLog('Request metadata', {
        messageCount: messages?.length ?? 0,
        lastMessageRole: messages?.[messages.length - 1]?.role,
        currentPagePath,
      });
    }

    // Basic validation
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Limit message count (simple rate limiting)
    if (messages.length > 100) {
      return new Response('Too many messages', { status: 400 });
    }

    // Build light context from current page
    let contextPrefix = '';
    if (currentPagePath) {
      contextPrefix = `\n\n# Current Page Context\n\nThe user is currently viewing: ${currentPageUrl || currentPagePath}\n`;

      // If we have content, extract light metadata (title, headings)
      if (currentPageContent) {
        const titleMatch = currentPageContent.match(/^#\s+(.+)$/m);
        const title = titleMatch?.[1];

        const headingMatches = currentPageContent.matchAll(/^#{2,}\s+(.+)$/gm);
        const headings = Array.from(headingMatches)
          .map(match => match[1])
          .slice(0, 6);

        if (title) {
          contextPrefix += `Page title: ${title}\n`;
        }

        if (headings.length > 0) {
          contextPrefix += `Page sections: ${headings.join(', ')}\n`;
        }
      }

      contextPrefix += '\n---\n';
    }

    // Inject context into system prompt
    const enhancedSystemPrompt = systemPrompt + contextPrefix;

    // Get OpenAI API key from env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Stream the response using AI SDK
    const openai = createOpenAI({ apiKey });

    const streamOptions: Parameters<typeof streamText>[0] = {
      model: openai('gpt-5'),
      system: enhancedSystemPrompt,
      messages: convertToModelMessages(messages),
      tools: {
        page_context: pageContextTool,
        mcp_search: mcpSearchTool,
      },
      stopWhen: [],
    };

    if (debug) {
      streamOptions.onChunk = async ({ chunk }) => {
        switch (chunk.type) {
          case 'tool-input-start':
            {
              const toolCallId = (chunk as { toolCallId?: string }).toolCallId ?? chunk.id;
              toolMetrics.set(toolCallId, { startTime: getNow() });
            }
            break;
          case 'tool-result':
            {
              const toolCallId = chunk.toolCallId;
              const metric = toolMetrics.get(toolCallId);
              if (metric) {
                const duration = getNow() - metric.startTime;
                toolMetrics.delete(toolCallId);

                // Extract result info
                let resultInfo = '';
                const output = chunk.output;
                if (output && typeof output === 'object') {
                  if ('error' in output) {
                    resultInfo = ` error: ${output.error}`;
                  } else if ('results' in output && Array.isArray(output.results)) {
                    resultInfo = ` ${output.results.length} results`;
                  } else if ('content' in output) {
                    resultInfo = ' page loaded';
                  }
                }

                console.log(`called ${chunk.toolName}, ${(duration / 1000).toFixed(1)}s${resultInfo}`);
              }
            }
            break;
        }
      };

      streamOptions.onStepFinish = async step => {
        const usage = step.usage;
        const totalTokens = usage?.totalTokens ?? 0;
        const stepDuration = getNow() - (stepMetrics.length > 0
          ? stepMetrics.reduce((sum, s) => sum + s.duration, 0)
          : 0);

        if (step.toolCalls.length > 0) {
          // This was a tool-calling step
          stepMetrics.push({ type: 'tool-calls', duration: stepDuration, tokens: totalTokens });
        } else if (step.text) {
          // This was a thinking/response step
          const stepType = step.reasoning ? 'thinking' : 'response';
          console.log(`${stepType}, ${(stepDuration / 1000).toFixed(1)}s, ${totalTokens} tokens`);
          stepMetrics.push({ type: stepType, duration: stepDuration, tokens: totalTokens });
        }
      };

      streamOptions.onFinish = async event => {
        const totalDuration = getNow() - startTime;
        const totalTokens = event.totalUsage?.totalTokens ?? 0;
        console.log(`\ntotal: ${(totalDuration / 1000).toFixed(1)}s, ${totalTokens} tokens`);
      };

      streamOptions.onError = async ({ error }) => {
        debugLog('Stream error', error);
      };
    }

    const result = streamText(streamOptions);

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('AI route error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
