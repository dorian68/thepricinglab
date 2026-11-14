// Curated reader projection only. Keep raw retrieval evidence on the server.
export function readableSourceReferences(sources = []) {
  const seen = new Set();
  const candidates = sources.flatMap(source => {
    const raw = String(source.snippet || '');
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(raw)) return [];
    const title = String(source.title || source.source || '').replace(/\s*\(\s*PDFDrive\s*\)/gi, '').replace(/\.(pdf|epub)\b/gi, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const snippet = raw.replace(/\s+/g, ' ').trim();
    if (!title || snippet.length < 60 || /^(?:\(?\d+(?:\.\d+)*\)?[.)]?\s|[=+*/^_{}])/u.test(snippet)) return [];
    if ((snippet.match(/\b[a-zA-ZÀ-ÿ]{4,}\b/g) || []).length < 8 || /[�]|(?:[_^=]{2,})/.test(snippet)) return [];
    if (/[+−-]\s*=/.test(snippet) || (snippet.match(/\b[A-Za-z]\s*[-−]\s*[A-Za-z]\s*\+/g) || []).length >= 2) return [];
    const quality = 2 * Math.min((snippet.match(/[.!?](?:\s|$)/g) || []).length, 3) + (/[.!?]$/.test(snippet) ? 1 : 0) - (snippet.match(/[=^{}]/g) || []).length - 2 * (snippet.match(/\[[^\]]+\]/g) || []).length;
    return [{ source, title, snippet, quality }];
  }).sort((a,b) => b.quality - a.quality);
  return candidates.flatMap(({source,title,snippet}) => {
    const key = title.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...source, title, snippet }];
  }).slice(0, 4);
}
