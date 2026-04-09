import { classifyWithOpenAI } from './openai-classify.js';

/**
 * Shared JSON handler: body string -> { catId, error? }
 */
export async function handleClassifyJsonBody(raw, apiKey) {
  var payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch (e) {
    return { status: 400, body: { error: 'Invalid JSON' } };
  }

  var name = String(payload.name || '').replace(/^\s+|\s+$/g, '');
  var categories = payload.categories;
  if (!categories || !categories.length) {
    return { status: 400, body: { error: 'categories required', catId: 'other' } };
  }

  var validIds = [];
  var catLines = [];
  for (var c = 0; c < categories.length; c++) {
    if (categories[c].id) validIds.push(categories[c].id);
    catLines.push(categories[c].id + ': ' + (categories[c].name || ''));
  }

  if (!name || !validIds.length) {
    return { status: 400, body: { error: 'name and categories required', catId: 'other' } };
  }

  if (!apiKey) {
    return {
      status: 503,
      body: {
        catId: 'other',
        error: 'Set OPENAI_API_KEY in the environment (see .env.example). Use wrangler secret for the Worker.',
      },
    };
  }

  try {
    var catId = await classifyWithOpenAI(name, catLines, validIds, apiKey);
    return { status: 200, body: { catId: catId } };
  } catch (err) {
    return {
      status: 200,
      body: { catId: 'other', error: String(err.message || err) },
    };
  }
}
