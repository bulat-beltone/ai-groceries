import { handleClassifyJsonBody } from '../lib/handle-classify-request.js';
import { handleTranslateJsonBody } from '../lib/handle-translate-request.js';

var cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    var url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/classify') {
      var raw = await request.text();
      var key = env.OPENAI_API_KEY;
      var result = await handleClassifyJsonBody(raw, key);
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors),
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/translate') {
      var rawTr = await request.text();
      var keyTr = env.OPENAI_API_KEY;
      var resultTr = await handleTranslateJsonBody(rawTr, keyTr);
      return new Response(JSON.stringify(resultTr.body), {
        status: resultTr.status,
        headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors),
      });
    }

    return new Response('Not found', { status: 404, headers: cors });
  },
};
