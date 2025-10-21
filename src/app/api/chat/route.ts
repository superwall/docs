import { NextRequest } from 'next/server';

const API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8787'
    : 'https://docs-ai-api.superwall.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward the request to the docs-ai-api worker
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    // Return the streaming response
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
