/**
 * OpenAI classify proxy for static hosts (e.g. GitHub Pages).
 * Key lives in Worker secrets: wrangler secret put OPENAI_API_KEY
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

async function openaiClassify(name, catLines, validIds, apiKey) {
  var catList = catLines.join('\n');
  var body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content:
          'К какому отделу супермаркета относится "' +
          name +
          '"?\nОтделы:\n' +
          catList +
          '\nВерни ТОЛЬКО id отдела одним словом (латиницей), без точки и пояснений.',
      },
    ],
    max_tokens: 16,
    temperature: 0,
  });

  var res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
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

var cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    var url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'POST' && url.pathname === '/api/classify') {
      if (!env.OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({
            catId: 'other',
            error: 'Set secret: wrangler secret put OPENAI_API_KEY',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }

      var payload;
      try {
        payload = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      var name = String(payload.name || '').replace(/^\s+|\s+$/g, '');
      var categories = payload.categories;
      if (!categories || !categories.length) {
        return new Response(
          JSON.stringify({ error: 'categories required', catId: 'other' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }

      var validIds = [];
      var catLines = [];
      for (var c = 0; c < categories.length; c++) {
        if (categories[c].id) validIds.push(categories[c].id);
        catLines.push(categories[c].id + ': ' + (categories[c].name || ''));
      }

      if (!name || !validIds.length) {
        return new Response(
          JSON.stringify({ error: 'name and categories required', catId: 'other' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }

      try {
        var catId = await openaiClassify(name, catLines, validIds, env.OPENAI_API_KEY);
        return new Response(JSON.stringify({ catId: catId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      } catch (err) {
        console.error(err);
        return new Response(
          JSON.stringify({ catId: 'other', error: String(err.message || err) }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }
    }

    return new Response('Not found', { status: 404, headers: cors });
  },
};
