
import { TFunction } from 'react-i18next';

/**
 * Type for a simplified translation function
 */
type SimpleTranslationFn = (key: string, defaultValue?: string) => string;

/**
 * Utility for safely handling translations and avoiding [caption] placeholders
 */
export const safeTranslate = (
  t: TFunction | SimpleTranslationFn,
  key: string,
  fallback: string
): string => {
  // Handle different ways the t function can be called from react-i18next
  let translated: string | null | undefined;
  
  try {
    if (typeof t === 'function') {
      translated = t(key, { defaultValue: fallback });
      
      // If that didn't work, try the simpler form
      if (translated === key) {
        translated = t(key, fallback);
      }
    } else {
      translated = fallback;
    }
  } catch (error) {
    console.warn(`Translation error for key "${key}":`, error);
    translated = fallback;
  }
  
  // Remove any [caption] prefixes that might appear in translations
  return typeof translated === 'string' 
    ? cleanCaptions(translated) 
    : cleanCaptions(fallback);
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
