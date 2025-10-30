import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  // Check for existing session id cookie
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session_id")?.value

  // Attempt to fetch chat history for current session ID
  if(sessionId) {
    try {
      const apiResponse = await fetch('http://tongyi-api-server/roboadvisor', {
        headers: {
          'X-Session-Id': sessionId
        }
      });
      const data = await apiResponse.json()
      return NextResponse.json(data)
    } catch(e) { }
  }

  // Fallback to empty chat history
    return NextResponse.json([])
}

export async function POST(request: NextRequest) {
  // Check for existing session id cookie
  const cookieStore = await cookies()

  // In production, set session id to be something more proper. Also enable secure: true.
  const sessionId = cookieStore.get("session_id")?.value ?? randomUUID()
  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    // secure: true,
    path: '/',
    sameSite: 'lax',
  })
  console.log(`Session ID: ${sessionId}`)

  try {
    const body = await request.json()
    // Use the body stream directly to avoid preloading it entirely into memory
    const apiResponse = await fetch('http://tongyi-api-server/roboadvisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId
      },
      // body: request.body,
      body: JSON.stringify({
        ...body,
      })
    });

    if (!apiResponse.body) {
      return new Response('Service temporarily unavailable', { status: 500 });
    }

    // Create a ReadableStream that relays each chunk from the upstream
    const responseStream = new ReadableStream({
      async start(controller) {
        // eslint-ignore
        const reader = apiResponse.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          console.error('Error reading upstream stream:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    // Stream response back to client
    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error handling POST request:', error);
    return new Response(JSON.stringify({ message: 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
