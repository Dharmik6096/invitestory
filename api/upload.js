const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }

    const imageStr = body.image || body.base64 || body.data;
    if (!imageStr) {
      return res.status(400).json({ error: 'Missing image or base64 field' });
    }

    let buffer;
    let ext = 'jpg';

    if (imageStr.startsWith('data:image/')) {
      const matches = imageStr.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        return res.status(400).json({ error: 'Invalid data URI format' });
      }
    } else {
      buffer = Buffer.from(imageStr, 'base64');
    }

    const FALLBACK_BLOB_TOKEN = 'vercel_blob_rw_5bp5Y1wStF0J3wd4_PdP8Efu1RUfPCzQnYblRV4UN7pXspn';
    const token = process.env.BLOB_READ_WRITE_TOKEN || FALLBACK_BLOB_TOKEN;
    const filename = `images/upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const blobRes = await put(filename, buffer, {
      access: 'public',
      token,
      addRandomSuffix: true,
      allowOverwrite: true
    });

    return res.status(200).json({
      success: true,
      url: blobRes.url
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Image upload failed' });
  }
};
