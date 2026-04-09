/**
 * Match a category id from model output: word boundaries first, then tokens.
 * Used by server.js and the Cloudflare Worker.
 */
export function parseCatId(content, validIds) {
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
