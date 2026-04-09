import http from 'http';
import fs from 'fs';
import { URL, fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = parseInt(process.env.PORT, 10) || 5173;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * Match a category id from model output: word boundaries first, then tokens.
 */
function parseCatId(content, validIds) {
  var lower = String(content || '').toLowerCase();
  var set = {};
  for (var v = 0; v < validIds.length; v++) set[validIds[v]] = true;

  for (var i = 0; i < validIds.length; i++) {
    var id = validIds[i];
    var escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp('\\b' + escaped + '\\b', 'i');
    if (re.test(lower)) return id;
  }

  var parts = lower.split(/[^a-z0-9_]+/);
  for (var j = 0; j < parts.length; j++) {
    var w = parts[j];
    if (w && set[w]) return w;
  }
  return 'other';
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

async function openaiClassify(name, catLines, validIds) {
  var catList = catLines.join('\n');
  var body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content:
        'К какому отделу супермаркета относится "' +
        name +
        '"?\nОтделы:\n' +
        catList +
        '\nВерни ТОЛЬКО id отдела одним словом (латиницей), без точки и пояснений.',
    }],
    max_tokens: 16,
    temperature: 0,
  });

  var res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + OPENAI_KEY,
    },
    body: body,
  });

  var data = await res.json();
  if (!res.ok) {
    var msg = (data.error && data.error.message) || res.statusText || 'OpenAI error';
    throw new Error(msg);
  }
  var text = '';
  if (data.choices && data.choices[0] && data.choices[0].message) {
    text = data.choices[0].message.content || '';
  }
  return parseCatId(text, validIds);
}

var server = http.createServer(async function(req, res) {
  var host = req.headers.host || 'localhost';
  var u = new URL(req.url || '/', 'http://' + host);

  if (req.method === 'POST' && u.pathname === '/api/classify') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (!OPENAI_KEY) {
      res.writeHead(503);
      res.end(JSON.stringify({
        catId: 'other',
        error: 'Set OPENAI_API_KEY in the environment (see .env.example).',
      }));
      return;
    }

    var raw;
    try {
      raw = await readBody(req);
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Bad request' }));
      return;
    }

    var payload;
    try {
      payload = JSON.parse(raw || '{}');
    } catch (e2) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    var name = String(payload.name || '').replace(/^\s+|\s+$/g, '');
    var categories = payload.categories;
    if (!categories || !categories.length) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'categories required', catId: 'other' }));
      return;
    }

    var validIds = [];
    var catLines = [];
    for (var c = 0; c < categories.length; c++) {
      if (categories[c].id) validIds.push(categories[c].id);
      catLines.push(categories[c].id + ': ' + (categories[c].name || ''));
    }

    if (!name || !validIds.length) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'name and categories required', catId: 'other' }));
      return;
    }

    try {
      var catId = await openaiClassify(name, catLines, validIds);
      res.writeHead(200);
      res.end(JSON.stringify({ catId: catId }));
    } catch (err) {
      console.error(err);
      res.writeHead(200);
      res.end(JSON.stringify({ catId: 'other', error: String(err.message || err) }));
    }
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
