
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
  const translated = typeof t === 'function' ? t(key, fallback) : fallback;
  
  // Remove any [caption] prefixes that might appear in translations
  return typeof translated === 'string' 
    ? translated.replace(/\[caption\]\s*/g, '') 
    : fallback;
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
