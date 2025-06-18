import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' ? 'http://backend:5000' : 'http://localhost:5000')

export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return Response.json({ error: errorData.error || `Backend returned ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Backend connection error:', error);
    return Response.json({ 
      error: `Failed to connect to game server: ${error.message}` 
    }, { status: 500 });
  }
}
