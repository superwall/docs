import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { pageContextTool, mcpSearchTool, docsSearchTool } from '@/ai/tools';
import type { AppMessage } from '@/ai/message-types';

export const runtime = 'edge';

const systemPrompt = `You are a helpful AI assistant for Superwall documentation.

Your role is to help users understand and implement Superwall's SDK across iOS, Android, Flutter, React Native, and Web.

Guidelines:
- Always provide concise, implementation-ready answers and format them in markdown using short sections or lists.
- The user's current page path is included with every request—treat it as the primary context for your response.
- When information is missing, call the docs.search tool first (fall back to mcp.search if needed) before answering, and cite the sources you use.
- Use the page.context tool when you need to examine a specific documentation page in detail.
- Include code examples when they clarify the response, and highlight any platform-specific differences when relevant.`;

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
    const summarizeUsage = (usage: any) =>
      usage
        ? {
            input: usage.inputTokens,
            output: usage.outputTokens,
            total: usage.totalTokens,
            cachedInput: usage.cachedInputTokens,
          }
        : undefined;

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
        docs_search: docsSearchTool,
      },
      stopWhen: [],
    };

    if (debug) {
      streamOptions.onChunk = async ({ chunk }) => {
        const textDelta = 'delta' in chunk ? (chunk as { delta: string }).delta : (chunk as { text?: string }).text;
        switch (chunk.type) {
          case 'text-delta':
            debugLog('Chunk:text', { id: chunk.id, delta: textDelta });
            break;
          case 'reasoning-delta':
            debugLog('Chunk:reasoning', { id: chunk.id, delta: textDelta });
            break;
          case 'source':
            debugLog('Chunk:source', chunk);
            break;
          case 'tool-call':
            debugLog('Chunk:tool-call', {
              toolName: chunk.toolName,
              input: chunk.input,
              providerExecuted: chunk.providerExecuted,
              dynamic: chunk.dynamic,
              invalid: chunk.invalid,
              error: chunk.error,
            });
            break;
          case 'tool-input-start':
            debugLog('Chunk:tool-input-start', {
              toolName: chunk.toolName,
              toolCallId: (chunk as { toolCallId?: string }).toolCallId ?? chunk.id,
            });
            break;
          case 'tool-input-delta':
            debugLog('Chunk:tool-input-delta', {
              toolCallId: (chunk as { toolCallId?: string }).toolCallId ?? chunk.id,
              delta: (chunk as { inputTextDelta?: string }).inputTextDelta ?? textDelta,
            });
            break;
          case 'tool-result':
            debugLog('Chunk:tool-result', {
              toolName: chunk.toolName,
              toolCallId: chunk.toolCallId,
              output: chunk.output,
            });
            break;
          case 'raw':
            debugLog('Chunk:raw', chunk.rawValue);
            break;
          default:
            debugLog('Chunk:unhandled', chunk);
        }
      };

      streamOptions.onStepFinish = async step => {
        debugLog('Step finished', {
          finishReason: step.finishReason,
          textPreview: step.text.slice(0, 120),
          toolCalls: step.toolCalls.map(call => call.toolName),
          usage: summarizeUsage(step.usage),
        });
      };

      streamOptions.onFinish = async event => {
        debugLog('Stream finished', {
          finishReason: event.finishReason,
          totalUsage: summarizeUsage(event.totalUsage),
          stepCount: event.steps.length,
        });
      };

      streamOptions.onError = async ({ error }) => {
        debugLog('Stream error', error);
      };
    }

    const result = streamText(streamOptions);

    if (debug) {
      result.response
        .then(response => {
          debugLog('Response metadata', {
            messageCount: response.messages.length,
          });
          debugLog('Response messages', response.messages);
        })
        .catch(error => {
          debugLog('Response metadata error', error);
        });
    }

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('AI route error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
