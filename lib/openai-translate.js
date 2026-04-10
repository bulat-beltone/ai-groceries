/**
 * Translate a short grocery item label via OpenAI (Node 18+ / Workers).
 */
export async function translateWithOpenAI(text, langCode, apiKey) {
  var langNames = { de: 'German', en: 'English', es: 'Spanish' };
  var target = langNames[langCode] || langNames.en;

  var body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content:
          'Translate this shopping-list product name to ' +
          target +
          '. Reply with ONLY the translated phrase: same meaning, natural for a grocery list. No quotes, no explanation, no extra words.\n\n' +
          String(text || ''),
      },
    ],
    max_tokens: 64,
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
  var out = '';
  if (data.choices && data.choices[0] && data.choices[0].message) {
    out = data.choices[0].message.content || '';
  }
  out = String(out)
    .replace(/^\s+|\s+$/g, '')
    .replace(/^["'`«»]|["'`«»]$/g, '');
  return out;
}
