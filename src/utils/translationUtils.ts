
/**
 * Type for a simplified translation function
 */
type SimpleTranslationFn = (key: string, defaultValue?: string) => string;

/**
 * Utility for safely handling translations and avoiding [caption] placeholders
 * 
 * @param t - Translation function from react-i18next or similar
 * @param key - Translation key to look up
 * @param fallback - Fallback text if translation is not found
 * @returns Cleaned translated text without [caption] prefixes
 */
export const safeTranslate = (
  t: any,
  key: string,
  fallback: string
): string => {
  try {
    if (typeof t === 'function') {
      let translated = t(key, { defaultValue: fallback });

      // Gestion d’échec silencieuse
      if (!translated || translated === key || translated.includes('Translation not found')) {
        translated = fallback;
      }

      return cleanCaptions(translated.toString());
    } else {
      return cleanCaptions(fallback);
    }
  } catch (error) {
    console.warn(`Erreur de traduction pour la clé "${key}" :`, error);
    return cleanCaptions(fallback);
  }
};


/**
 * Process a block of text to remove [caption] markers
 */
export const cleanCaptions = (text: string): string => {
  if (!text) return '';
  // Modification: Ne remplace plus 'title' par rien et ne supprime plus uniquement '[caption]'
  // mais supprime complètement les patterns comme '[caption]button' ou autres variantes
  return text.replace(/\[caption\]([a-zA-Z0-9]*)/g, '');
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
