
/**
 * Utility for safely handling translations and avoiding [caption] placeholders
 */
export const safeTranslate = (
  t: (key: string, defaultValue?: string) => string,
  key: string,
  fallback: string
): string => {
  const translated = t(key, fallback);
  
  // Remove any [caption] prefixes that might appear in translations
  return translated.replace(/\[caption\]\s*/g, '');
};

/**
 * Process a block of text to remove [caption] markers
 */
export const cleanCaptions = (text: string): string => {
  if (!text) return '';
  return text.replace(/\[caption\]\s*/g, '');
};

/**
 * Process translations in an object recursively
 */
export const cleanTranslationObject = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return cleanCaptions(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanTranslationObject);
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = cleanTranslationObject(obj[key]);
    }
    return result;
  }
  
  return obj;
};
