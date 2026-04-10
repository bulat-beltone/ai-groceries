import { translateWithOpenAI } from './openai-translate.js';

/**
 * Shared JSON handler: body string -> { text, error? }
 */
export async function handleTranslateJsonBody(raw, apiKey) {
  var payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch (e) {
    return { status: 400, body: { error: 'Invalid JSON', text: '' } };
  }

  var text = String(payload.text || '').replace(/^\s+|\s+$/g, '');
  var lang = String(payload.lang || 'en').toLowerCase();
  if (lang !== 'de' && lang !== 'en' && lang !== 'es') {
    lang = 'en';
  }

  if (!text) {
    return { status: 400, body: { error: 'text required', text: '' } };
  }

  if (!apiKey) {
    return {
      status: 503,
      body: {
        text: '',
        error: 'Set OPENAI_API_KEY in the environment (see .env.example). Use wrangler secret for the Worker.',
      },
    };
  }

  try {
    var translated = await translateWithOpenAI(text, lang, apiKey);
    return { status: 200, body: { text: translated } };
  } catch (err) {
    return {
      status: 200,
      body: { text: '', error: String(err.message || err) },
    };
  }
}
