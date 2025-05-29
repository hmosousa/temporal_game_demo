export async function POST() {
  try {
    const response = await fetch('http://localhost:5000/api/new_game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to connect to game server' }, { status: 500 });
  }
}
