const DECODE_ROUNDS = 2;

function decodeTarget(value) {
  let decoded = value;
  for (let round = 0; round < DECODE_ROUNDS; round += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      // A malformed escape is not made safer by guessing its meaning.
      break;
    }
  }
  return decoded;
}

/**
 * Return true for navigation targets that must never be handed to the SPA
 * router. In particular, browsers normalize backslashes in URL-like values;
 * rejecting them closes the React Router open-redirect edge case without
 * changing legitimate internal paths, query strings or hash links.
 */
export function isUnsafeNavigationTarget(target) {
  if (typeof target !== 'string') return true;

  const raw = target.trim();
  if (!raw) return false;

  const decoded = decodeTarget(raw);
  const normalized = decoded.replace(/[\u0000-\u0020]+/g, '');

  if (raw.includes('\\') || /%5c/i.test(raw) || decoded.includes('\\')) return true;
  if (normalized.startsWith('//') || normalized.startsWith('\\\\')) return true;
  if (/^(?:javascript|data|vbscript|file|blob):/i.test(normalized)) return true;

  return false;
}

