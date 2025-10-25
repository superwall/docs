import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';

const systemPrompt = `# Superwall Docs AI

Act as a Superwall expert with comprehensive knowledge of the SDK, dashboard, and product. Provide concise and accurate answers based on the markdown-formatted documentation and help center knowledge base. Use the provided documentation as your ONLY source as it could change frequently. If uncertain about an answer, state that clearly. Always include a link to the source file used to find the information at the end of your response.

## Steps
1. **Analyze the Question**: Understand what specific information or clarification the question seeks about Superwall.
2. **Locate Information**: Refer to the markdown-formatted documentation to find relevant details.
3. **Craft a Response**: Provide a concise and precise answer to the question.
4. **Cite Source**: On a new line, append a link to the specific file or section of the documentation that supports your answer, markdown formatted as \`[link text](url)\`.

## Input Format
The documentation is markdown-formatted:
- The current page that the user is on is contained by the following tags: \`{{BEGIN CURRENT PAGE CONTEXT}}\` and \`{{END CURRENT PAGE CONTEXT}}\`. (note: the user's query may or may not be directly related to the current page)
- The full documentation for the selected SDK (or none if not selected) and the dashboard are contained by the following tags: \`{{BEGIN DOCS CONTEXT}}\` and \`{{END DOCS CONTEXT}}\`.

## Output Format

- Provide the answer as a short paragraph for clarity.
- If unsure, write: "I'm not sure about this. Please check with further resources."
- Include a link to the documentation file used for the answer at the end of the response.

## Examples

**Example 1**

**Input**: can superwall tell me if a user has cancelled a subscription or their subscription has run out?

**Response**: Yes, Superwall can track a user's subscription status. According to the docs, Superwall exposes a published property \`Superwall.shared.subscriptionStatus\` that tracks whether a subscription is active or expired.
By default, Superwall handles all subscription-related logic including:
- Tracking when subscriptions become active
- Tracking when subscriptions expire
- Checking the local receipt for verification

You can access this information through the \`subscriptionStatus\` property to determine if a user's subscription has ended or been cancelled.

[Tracking Subscription State](https://superwall.com/docs/tracking-subscription-state)

## Context

{{BEGIN DOCS CONTEXT}}
{{docs}}
{{END DOCS CONTEXT}}

The user has selected SDK: {{SELECTED_SDK}}

{{ BEGIN CURRENT PAGE CONTEXT }}
{{CURRENT_PAGE_CONTEXT}}
{{ END CURRENT PAGE CONTEXT }}
`;

const defaultOpenAIModel = 'gpt-5-nano';
const MAX_CONVERSATION_EXCHANGES = 3; // Number of user/assistant exchanges to include

// Helper function to load text file from public docs directory
async function loadTextFile(fileName: string): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superwall.com';
    const url = `${baseUrl}/docs/${fileName}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Superwall-Docs-AI/1.0',
        Accept: 'text/plain',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to load ${fileName}: HTTP ${response.status} from ${url}`);
      return null;
    }

    const content = await response.text();
    return content;
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, sdk, currentPagePath } = body as {
      messages: Array<any>;
      sdk?: string;
      currentPagePath?: string;
    };

    // Basic validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Get the last user message to ensure it's valid
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

    // Extract text from a message (handle UIMessage format with parts array)
    const extractMessageText = (message: any): string => {
      let text = '';

      // Try parts array first (UIMessage format from AI SDK)
      if (message.parts && Array.isArray(message.parts)) {
        text = message.parts
          .map((part: any) => (part.type === 'text' ? part.text : ''))
          .join('');
      }
      // Fall back to content field
      else if (message.content) {
        if (typeof message.content === 'string') {
          text = message.content;
        } else if (Array.isArray(message.content)) {
          text = message.content
            .map((part: any) => (part.type === 'text' ? part.text : ''))
            .join('');
        }
      }

      return text.trim();
    };

    // Validate last message has content
    const lastUserMessageText = extractMessageText(lastMessage);
    if (!lastUserMessageText) {
      return new Response('Message cannot be empty', { status: 400 });
    }

    // Get the last N exchanges (user + assistant pairs) for context
    // We want to include up to MAX_CONVERSATION_EXCHANGES exchanges
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Work backwards through messages to collect exchanges
    let exchangeCount = 0;
    for (let i = messages.length - 1; i >= 0 && exchangeCount < MAX_CONVERSATION_EXCHANGES; i--) {
      const msg = messages[i];
      const text = extractMessageText(msg);

      if (!text) continue; // Skip empty messages

      if (msg.role === 'user' || msg.role === 'assistant') {
        conversationHistory.unshift({
          role: msg.role,
          content: text,
        });

        // Count exchanges (user message = start of exchange)
        if (msg.role === 'user') {
          exchangeCount++;
        }
      }
    }

    // Get OpenAI API key from env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Load documentation files
    let filesToLoad = ['llms-full-dashboard.txt'];

    // Add SDK-specific file if SDK is specified
    const validSdks = ['ios', 'android', 'flutter', 'expo'];
    if (sdk && validSdks.includes(sdk.toLowerCase())) {
      filesToLoad.push(`llms-full-${sdk.toLowerCase()}.txt`);
    }

    const docsSections = [];
    for (const fileName of filesToLoad) {
      const sectionContent = await loadTextFile(fileName);
      if (sectionContent) {
        docsSections.push(sectionContent);
      }
    }

    if (docsSections.length === 0) {
      console.error('No docs sections found');
      return new Response('Documentation not available', { status: 500 });
    }

    const docsContent = docsSections.join('\n\n---\n\n');
    let enhancedSystemPrompt = systemPrompt.replace('{{docs}}', docsContent);

    // Fetch current page context if the keyword exists and path is provided
    if (systemPrompt.includes('{{CURRENT_PAGE_CONTEXT}}')) {
      let currentPageContext = '';

      if (currentPagePath) {
        // Construct the path to the markdown file
        // currentPagePath is like "/ios/quickstart" -> fetch "ios/quickstart.md"
        const cleanPath = currentPagePath.startsWith('/')
          ? currentPagePath.slice(1)
          : currentPagePath;
        const mdFileName = `${cleanPath}.md`;

        try {
          const pageContent = await loadTextFile(mdFileName);
          if (pageContent) {
            currentPageContext = `\n\n# Current Page Context\n\nThe user is currently viewing the page at path: ${currentPagePath}\n\n${pageContent}`;
          } else {
            console.warn(`Failed to load current page content: ${mdFileName}`);
          }
        } catch (error) {
          console.error(`Error loading current page context for ${mdFileName}:`, error);
        }
      }

      enhancedSystemPrompt = enhancedSystemPrompt.replace('{{CURRENT_PAGE_CONTEXT}}', currentPageContext);
    }

    // Inject SDK selection text
    if (systemPrompt.includes('{{SELECTED_SDK}}')) {
      const sdkText = sdk && validSdks.includes(sdk.toLowerCase())
        ? `The user has selected SDK: ${sdk.toLowerCase()}`
        : 'The user has not selected any specific SDK';

      enhancedSystemPrompt = enhancedSystemPrompt.replace('{{SELECTED_SDK}}', sdkText);
    }

    // Stream the response using AI SDK
    const openai = createOpenAI({ apiKey });

    const result = streamText({
      model: openai(defaultOpenAIModel),
      system: enhancedSystemPrompt,
      messages: conversationHistory,
      providerOptions: {
        openai: {
          reasoningEffort: "minimal", // "minimal" | "low" | "medium" | "high"
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('AI route error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
