'use strict';

// StreamFusion server
// - Serves the app at http://localhost:3001
// - Proxies YouTube InnerTube API requests (bypasses CORS)
//
// Usage:  node server.js
// Then open http://localhost:3001 in Chrome.

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 3001;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
};

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

http.createServer((req, res) => {

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // YouTube InnerTube proxy (POST /youtubei/...)
  if (req.method === 'POST' && req.url.startsWith('/youtubei/')) {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const opts = {
        hostname: 'www.youtube.com',
        path:     req.url,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': body.length,
          'User-Agent':     'Mozilla/5.0',
          'Referer':        'https://www.youtube.com/',
          'Origin':         'https://www.youtube.com',
        },
      };
      const proxy = https.request(opts, ytRes => {
        res.writeHead(ytRes.statusCode, { ...CORS, 'Content-Type': 'application/json' });
        ytRes.pipe(res);
      });
      proxy.on('error', err => {
        res.writeHead(502, CORS);
        res.end(JSON.stringify({ error: err.message }));
      });
      proxy.write(body);
      proxy.end();
    });
    req.on('error', () => { res.writeHead(400, CORS); res.end(); });
    return;
  }

  // Static file server (GET)
  if (req.method === 'GET') {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';

    const ext = path.extname(urlPath);
    if (!MIME[ext]) { res.writeHead(404); res.end('Not found'); return; }

    const filePath = path.resolve(ROOT, '.' + urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[ext] });
      res.end(data);
    });
    return;
  }

  res.writeHead(405, CORS);
  res.end();

}).listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  StreamFusion is running.');
  console.log(`  Open this in Chrome: http://localhost:${PORT}`);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
