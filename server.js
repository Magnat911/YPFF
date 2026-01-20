// server.js
import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL; // wss://YOUR_PROJECT.livekit.cloud

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
  console.error("Missing LiveKit env vars");
  process.exit(1);
}

app.post("/token", async (req, res) => {
  try {
    const roomName = `web-agent-${Date.now()}`;
    const identity = `web-user-${Math.floor(Math.random() * 1_000_000)}`;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
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

    res.json({
      token,
      url: LIVEKIT_WS_URL,
      roomName
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to create token" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Token server listening on http://localhost:${PORT}`);
});
