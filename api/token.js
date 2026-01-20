export default async function handler(req, res) {
  // CORS headers
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
  const wsUrl = process.env.LIVEKIT_WS_URL || 'wss://your-project.livekit.cloud';

  if (!apiKey || !apiSecret) {
    res.status(500).json({ error: 'LiveKit env vars missing' });
    return;
  }

  try {
    const { AccessToken } = await import('livekit-server-sdk');
    const roomName = `web-agent-${Date.now()}`;
    const identity = `user-${Math.random().toString(36).slice(2)}`;

    const at = new AccessToken(apiKey, apiSecret, { identity });
    at.addGrant({ 
      roomJoin: true, 
      room: roomName, 
      canPublish: true, 
      canSubscribe: true 
    });

    const token = await at.toJwt();
    res.json({ token, url: wsUrl, roomName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
