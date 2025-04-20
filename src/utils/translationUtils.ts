
import i18next, { TFunctionReturn } from 'i18next';
import { UseTranslationResponse } from 'react-i18next';

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
  // Handle different ways the t function can be called from react-i18next
  let translated: string | TFunctionReturn | null | undefined;
  
  try {
    if (typeof t === 'function') {
      // First attempt: Try the simple form which works in most cases
      try {
        translated = t(key, fallback);
      } catch (e) {
        // If that didn't work, try the object format as a fallback approach
        console.warn(`Simple translation format failed for "${key}", trying alternative format:`, e);
        try {
          // We need to cast this as any since the type definitions are strict but implementations may vary
          translated = t(key, { defaultValue: fallback });
        } catch (err) {
          console.warn(`All translation attempts failed for "${key}":`, err);
          translated = fallback;
        }
      }
    } else {
      translated = fallback;
    }
  } catch (error) {
    console.warn(`Translation error for key "${key}":`, error);
    translated = fallback;
  }
  
  // Always clean the result, whether it's the translation or the fallback
  return cleanCaptions(translated?.toString() || fallback);
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
