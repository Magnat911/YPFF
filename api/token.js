import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

export async function POST(req) {
  // Fix CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return new Response(null, { headers });

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  if (!apiKey || !apiSecret || !wsUrl) return new Response(JSON.stringify({ error: 'Env missing' }), { status: 500, headers });

  try {
    const roomService = new RoomServiceClient(`https://${new URL(wsUrl).host}`, apiKey, apiSecret);

    const roomName = 'sage-room';
    // Dispatch Sage-1242
    await roomService.dispatchAgent({
      room: roomName,
      agentName: 'Sage-1242',
      metadata: JSON.stringify({ agentId: 'CA_98PSZhgP7t8C' })
    });

    const at = new AccessToken(apiKey, apiSecret, { identity: `user-${Date.now()}` });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    const token = at.toJwt();

    return new Response(JSON.stringify({ url: wsUrl, token, roomName }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
