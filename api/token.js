import { AccessToken } from "livekit-server-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    res.status(500).json({ error: "LiveKit env vars not set" });
    return;
  }

  try {
    const roomName = `web-agent-${Date.now()}`;
    const identity = `web-user-${Math.floor(Math.random() * 1_000_000)}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      metadata: JSON.stringify({
        role: "caller",
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

    res.status(200).json({
      token,
      url: wsUrl,
      roomName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create token" });
  }
}
