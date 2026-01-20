// api/token.js - ВЕРСИЯ БЕЗ ВНЕШНИХ ПАКЕТОВ
export default async function handler(req, res) {
  // CORS для обхода блокировки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL || 'wss://your-project.livekit.cloud';

  if (!apiKey || !apiSecret) {
    res.status(500).json({ error: 'LiveKit API_KEY и API_SECRET не настроены в Vercel' });
    return;
  }

  try {
    // ✅ РУЧНОЙ JWT токен без livekit-server-sdk
    const header = JSON.stringify({ 
      typ: 'JWT', 
      alg: 'HS256' 
    });
    const payload = JSON.stringify({ 
      aud: 'livekit',
      iss: apiKey,
      sub: `user-${Math.random().toString(36).slice(2)}`,
      exp: Math.floor(Date.now() / 1000) + (60 * 10), // 10 минут
      name: `web-user-${Date.now()}`
    });
    
    const roomName = `sage-1242-${Date.now()}`;
    
    // Права для комнаты с агентом Sage-1242
    const video: any = { 
      "roomJoin": true, 
      "room": roomName, 
      "canPublish": true, 
      "canSubscribe": true,
      "canPublishSources": ["mic", "camera"]
    };
    
    payloadObj = JSON.parse(payload);
    payloadObj.video = video;
    const newPayload = JSON.stringify(payloadObj);

    // Base64 URL encode
    const encode = (str) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const signatureInput = `${encode(header)}.${encode(newPayload)}`;
    const signature = encodeHmac(apiSecret, signatureInput);
    
    const token = `${signatureInput}.${signature}`;

    res.json({ 
      token, 
      url: wsUrl, 
      roomName 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Token generation failed: ' + err.message });
  }
}

// Простой HMAC-SHA256 без внешних библиотек
function encodeHmac(key, data) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBuffer = encoder.encode(data);
  
  function sha256(message) {
    return crypto.subtle.digest('SHA-256', message).then(hash => {
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }
  
  function hmac(key, data) {
    const blockSize = 64;
    if (keyData.byteLength > blockSize) {
      keyData = new Uint8Array(await sha256(keyData));
    } else if (keyData.byteLength < blockSize) {
      const newKey = new Uint8Array(blockSize);
      newKey.set(keyData);
      keyData = newKey;
    }
    
    const oKeyPad = new Uint8Array(blockSize);
    const iKeyPad = new Uint8Array(blockSize);
    
    for (let i = 0; i < blockSize; i++) {
      oKeyPad[i] = keyData[i] ^ 0x5c;
      iKeyPad[i] = keyData[i] ^ 0x36;
    }
    
    const inner = await sha256(concat(iKeyPad, dataBuffer));
    return sha256(concat(oKeyPad, new Uint8Array(await inner)));
  }
  
  return btoa(String.fromCharCode(...new Uint8Array(hmac(keyData, dataBuffer)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function concat(a, b) {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}
