export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch('http://localhost:5000/api/step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json({ error: errorData.error || 'Failed to make move' }, { status: response.status });
    }

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json({ error: 'Failed to connect to game server' }, { status: 500 });
  }
}
