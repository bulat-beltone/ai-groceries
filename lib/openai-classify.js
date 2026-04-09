import { parseCatId } from './parse-cat-id.js';

/**
 * Call OpenAI and return a category id (Node 18+ / Workers).
 */
export async function classifyWithOpenAI(name, catLines, validIds, apiKey) {
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
