const { put, get } = require('@vercel/blob');
const { text: streamToText } = require('node:stream/consumers');
const fs = require('fs');
const path = require('path');

const BLOB_BASE = 'https://5bp5y1wstf0j3wd4.public.blob.vercel-storage.com';
const FALLBACK_BLOB_TOKEN = 'vercel_blob_rw_5bp5Y1wStF0J3wd4_PdP8Efu1RUfPCzQnYblRV4UN7pXspn';

// Helper to recursively find and upload all data:image/ base64 strings
async function processBase64Images(obj, slug, token) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await processBase64Images(obj[i], slug, token);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && val.startsWith('data:image/')) {
      try {
        const matches = val.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `images/${slug}_${key}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
          
          const blobRes = await put(filename, buffer, {
            access: 'public',
            token: token || process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false
          });
          obj[key] = blobRes.url;
        }
      } catch (err) {
        console.error('Failed to upload base64 image:', err);
      }
    } else if (typeof val === 'object' && val !== null) {
      obj[key] = await processBase64Images(val, slug, token);
    }
  }
  return obj;
}

module.exports = async function handler(req, res) {
  // CORS & Cache-Control headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || FALLBACK_BLOB_TOKEN;

  // GET: Fetch card JSON by slug
  if (req.method === 'GET') {
    const slug = (req.query.slug || req.query.card || '').trim();
    if (!slug) {
      return res.status(400).json({ error: 'Missing slug parameter' });
    }

    let freshestData = null;
    let freshestTime = 0;

    // 1. Check local cards/ folder (instant synchronous write on local host)
    try {
      const localPath = path.join(process.cwd(), 'cards', `${slug}.json`);
      if (fs.existsSync(localPath)) {
        const localData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
        freshestData = localData;
        freshestTime = new Date(localData.updatedAt || 0).getTime();
      }
    } catch (_) {}

    // 2. Check Cloud Blob store directly via get()
    try {
      const blobRes = await get(`cards/${slug}.json`, { access: 'public', token });
      if (blobRes && blobRes.stream) {
        const jsonText = await streamToText(blobRes.stream);
        const cloudData = JSON.parse(jsonText);
        const cloudTime = new Date(cloudData.updatedAt || 0).getTime();
        if (!freshestData || cloudTime >= freshestTime) {
          freshestData = cloudData;
          freshestTime = cloudTime;
        }
      }
    } catch (_) {}

    // 3. Fallback to public blob URL if not yet found
    if (!freshestData) {
      try {
        const blobUrl = `${BLOB_BASE}/cards/${encodeURIComponent(slug)}.json?v=${Date.now()}`;
        const blobResp = await fetch(blobUrl, { cache: 'no-store' });
        if (blobResp.ok) {
          freshestData = await blobResp.json();
        }
      } catch (_) {}
    }

    if (freshestData) {
      return res.status(200).json({ success: true, source: 'cloud', slug, data: freshestData, cardId: freshestData.cardId });
    }

    return res.status(404).json({ error: 'Card not found', slug });
  }

  // POST: Save or update card JSON by slug
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (_) {}
      }

      const slug = (body.slug || body.cardSlug || body.card || '').trim();
      if (!slug) {
        return res.status(400).json({ error: 'Missing slug in request body' });
      }

      let cardData = body.data || body.config || body;
      if (cardData.data) cardData = cardData.data;
      if (body.cardId && !cardData.cardId) cardData.cardId = body.cardId;
      if (body.card && !cardData.cardId && !isNaN(parseInt(body.card, 10))) cardData.cardId = parseInt(body.card, 10);

      // Ensure version
      cardData.version = (cardData.version || 2) + 1;
      cardData.updatedAt = new Date().toISOString();

      // Automatically extract and upload any base64 images to Cloud Blob
      cardData = await processBase64Images(cardData, slug, token);

      const jsonStr = JSON.stringify(cardData, null, 2);

      // Save to Cloud Blob
      let cloudUrl = null;
      try {
        const blobRes = await put(`cards/${slug}.json`, jsonStr, {
          access: 'public',
          token: token,
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 0
        });
        cloudUrl = blobRes.url;
      } catch (blobErr) {
        console.error('Blob save error:', blobErr);
      }

      // Also save to local filesystem if writable
      try {
        const cardsDir = path.join(process.cwd(), 'cards');
        if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });
        fs.writeFileSync(path.join(cardsDir, `${slug}.json`), jsonStr, 'utf-8');
      } catch (_) {}

      const cleanInviteUrl = `/invite/?card=${encodeURIComponent(slug)}`;

      return res.status(200).json({
        success: true,
        slug,
        cloudUrl,
        inviteUrl: cleanInviteUrl,
        data: cardData
      });
    } catch (err) {
      console.error('Save card error:', err);
      return res.status(500).json({ error: err.message || 'Failed to save card' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
