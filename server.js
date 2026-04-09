import http from 'http';
import fs from 'fs';
import { URL, fileURLToPath } from 'url';
import { handleClassifyJsonBody } from './lib/handle-classify-request.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = parseInt(process.env.PORT, 10) || 5173;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

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

  if (req.method === 'POST' && u.pathname === '/api/classify') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

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
});
