export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch('http://localhost:5000/api/undo', {
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