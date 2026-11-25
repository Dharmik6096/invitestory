const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const cardApiHandler = require('./api/card.js');
const uploadApiHandler = require('./api/upload.js');
const websiteConfigHandler = require('./api/website/config.js');
const websiteCheckoutHandler = require('./api/website/checkout.js');
const websitePaymentStatusHandler = require('./api/website/payment-status.js');

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (_) {
        resolve(body);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. API: /api/card
  if (pathname.startsWith('/api/card')) {
    req.query = parsedUrl.query;
    if (req.method === 'POST') {
      req.body = await parseBody(req);
    }
    res.status = (code) => {
      res.statusCode = code;
      return {
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end: () => res.end()
      };
    };
    return cardApiHandler(req, res);
  }

  // 2. API: /api/upload
  if (pathname.startsWith('/api/upload')) {
    req.query = parsedUrl.query;
    if (req.method === 'POST') {
      req.body = await parseBody(req);
    }
    res.status = (code) => {
      res.statusCode = code;
      return {
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end: () => res.end()
      };
    };
    return uploadApiHandler(req, res);
  }

  // 2.5 API: /api/website/*
  if (pathname.startsWith('/api/website/')) {
    req.query = parsedUrl.query;
    if (req.method === 'POST') {
      req.body = await parseBody(req);
    }
    res.status = (code) => {
      res.statusCode = code;
      return {
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end: () => res.end()
      };
    };
    if (pathname.startsWith('/api/website/config')) return websiteConfigHandler(req, res);
    if (pathname.startsWith('/api/website/checkout')) return websiteCheckoutHandler(req, res);
    if (pathname.startsWith('/api/website/payment-status')) return websitePaymentStatusHandler(req, res);
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // 3. Static File Serving
  let filePath = path.join(__dirname, pathname);

  // Check if directory
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } else {
      // Try adding .html
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      }
    }
  } catch (_) {}

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`InviteStory Dev Server listening on http://127.0.0.1:${PORT}`);
});
