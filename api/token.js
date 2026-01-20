export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  if (!apiKey || !apiSecret) {
    res.status(500).json({ error: 'Добавь LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_WS_URL в Vercel Environment Variables' });
    return;
  }

  try {
    const { AccessToken } = await import('livekit-server-sdk');
    const roomName = `sage-1242-${Date.now()}`;
    const identity = `web-user-${Math.random().toString(36).slice(2)}`;

    const at = new AccessToken(apiKey, apiSecret, { 
      identity,
      metadata: JSON.stringify({
        agent_name: "Sage-1242",
        agent_id: "CA_98PSZhgP7t8C"
      })
    });
    
    at.addGrant({ 
      roomJoin: true, 
      room: roomName, 
      canPublish: true, 
      canSubscribe: true 
    });

    const token = await at.toJwt();
    res.json({ token, url: wsUrl, roomName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
