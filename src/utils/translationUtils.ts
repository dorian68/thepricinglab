
import { TFunction } from 'i18next';

/**
 * A safe translation function that provides fallbacks for missing translations
 * @param t The translation function from useTranslation()
 * @param key The translation key to look up
 * @param defaultValue Optional default value if translation is missing
 * @param lng Current language
 * @returns The translated string or a fallback value
 */
export const safeTranslate = (
  t: TFunction, 
  key: string, 
  defaultValue?: string, 
  lng?: string
): string => {
  // Use the translation function with a default value
  const result = t(key, { defaultValue: defaultValue || extractLabel(key) });
  
  // If the result exactly matches the key or contains square brackets, consider it missing
  if (result === key || (typeof result === 'string' && result.includes('[') && result.includes(']'))) {
    console.warn(`Missing translation: ${key}${lng ? ` in ${lng}` : ''}`);
    // Return the default value or a humanized version of the key
    return defaultValue || extractLabel(key);
  }
  
  return result;
};

/**
 * Extracts a human-readable label from a translation key
 * @param key The translation key
 * @returns A readable label
 */
export const extractLabel = (key: string): string => {
  // Get the last part of the key (e.g., "title" from "home.hero.title")
  const lastPart = key.split('.').pop();
  
  if (!lastPart) return key;
  
  // Convert camelCase to Title Case with spaces
  return lastPart
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove any extra spaces
};

/**
 * Checks if a translation exists for a given key
 * @param t The translation function from useTranslation()
 * @param key The translation key to check
 * @returns Boolean indicating if translation exists
 */
export const hasTranslation = (t: TFunction, key: string): boolean => {
  // First cast to unknown, then to string to handle the typing correctly
  const result = t(key, { returnObjects: true }) as unknown;
  
  // Check if the result is a valid string and not a fallback
  return typeof result === 'string' && 
         result !== key && 
         !(String(result).includes('[') && String(result).includes(']'));
};
