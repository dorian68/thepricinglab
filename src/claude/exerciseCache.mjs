const memory = new Map();
export const ownerExerciseKey = (base, owner) => `${base}:owner:${encodeURIComponent(owner || 'anonymous')}`;
export function readExerciseCache(base, owner, storage) {
  const key = ownerExerciseKey(base, owner);
  if (memory.has(key)) return memory.get(key);
  try {
    const items = JSON.parse(storage?.getItem(key) || '[]');
    const result = Array.isArray(items) ? items : [];
    memory.set(key, result);
    return result;
  } catch { return []; }
}
export function writeExerciseCache(base, owner, items, storage) {
  const key = ownerExerciseKey(base, owner);
  const cache = items.slice(0, 30);
  memory.set(key, items);
  try { storage?.setItem(key, JSON.stringify(cache)); return Boolean(storage); }
  catch { return false; }
}
export function clearExerciseMemory() { memory.clear(); }
