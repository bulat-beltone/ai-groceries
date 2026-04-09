import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL, fileURLToPath } from 'url';
import { handleClassifyJsonBody } from './lib/handle-classify-request.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = parseInt(process.env.PORT, 10) || 5173;

/** Read OPENAI_API_KEY=... from .dev.vars or .env (Wrangler-style; not committed). */
function readOpenAiKeyFromFile(relPath) {
  try {
    var fp = path.join(__dirname, relPath);
    if (!fs.existsSync(fp)) return undefined;
    var text = fs.readFileSync(fp, 'utf8').replace(/^\uFEFF/, '');
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.indexOf('#') === 0) continue;
      var eq = line.indexOf('=');
      if (eq === -1) continue;
      var k = line.slice(0, eq).trim();
      var v = line.slice(eq + 1).trim();
      if ((v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') ||
          (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'")) {
        v = v.slice(1, -1);
      }
      if (k === 'OPENAI_API_KEY') return v;
    }
  } catch (e) {}
  return undefined;
}

var OPENAI_KEY =
  process.env.OPENAI_API_KEY ||
  readOpenAiKeyFromFile('.dev.vars') ||
  readOpenAiKeyFromFile('.env');
if (OPENAI_KEY) OPENAI_KEY = OPENAI_KEY.replace(/^\s+|\s+$/g, '');

function classifyCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function readBody(req) {
  return new Promise(function(resolve, reject) {
    var chunks = [];
    req.on('data', function(c) { chunks.push(c); });
    req.on('end', function() {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

var server = http.createServer(async function(req, res) {
  var host = req.headers.host || 'localhost';
  var u = new URL(req.url || '/', 'http://' + host);

  if (u.pathname === '/api/classify') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, classifyCorsHeaders());
      res.end();
      return;
    }

    if (req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      var h = classifyCorsHeaders();
      for (var hk in h) {
        if (Object.prototype.hasOwnProperty.call(h, hk)) res.setHeader(hk, h[hk]);
      }

      var raw;
      try {
        raw = await readBody(req);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Bad request' }));
        return;
      }

      var result = await handleClassifyJsonBody(raw, OPENAI_KEY);
      res.writeHead(result.status);
      res.end(JSON.stringify(result.body));
      return;
    }
  }

  if (req.method === 'GET' && u.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(__dirname + '/index.html').pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, function() {
  console.log('ai-groceries: http://localhost:' + PORT);
  if (!OPENAI_KEY) {
    console.warn(
      '[ai-groceries] No OPENAI_API_KEY. Add it to .dev.vars (see .dev.vars.example) or export OPENAI_API_KEY=...'
    );
  } else {
    console.log('[ai-groceries] OPENAI_API_KEY loaded from env or .dev.vars');
  }
});
