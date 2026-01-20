import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // Fix CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  if (!apiKey || !apiSecret || !wsUrl) return res.status(500).json({ error: 'Env vars missing' });

  try {
    const roomService = new RoomServiceClient(`https://${new URL(wsUrl).host}`, apiKey, apiSecret);

    const roomName = 'sage-room'; // Твоя room
    // Dispatch Sage-1242
    await roomService.dispatchAgent({
      room: roomName,
      agentName: 'Sage-1242',
      metadata: JSON.stringify({ agentId: 'CA_98PSZhgP7t8C' })
    });

    // Generate token
    const at = new AccessToken(apiKey, apiSecret, { identity: `web-user-${Date.now()}` });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    const token = at.toJwt();

    res.json({ url: wsUrl, token, roomName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
