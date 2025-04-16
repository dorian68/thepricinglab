
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
  const result = t(key);
  
  // If the result is the same as the key, it means the translation is missing
  if (result === key) {
    console.warn(`Missing translation: ${key}${lng ? ` in ${lng}` : ''}`);
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
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

/**
 * Checks if a translation exists for a given key
 * @param t The translation function from useTranslation()
 * @param key The translation key to check
 * @returns Boolean indicating if translation exists
 */
export const hasTranslation = (t: TFunction, key: string): boolean => {
  const result = t(key, { returnObjects: true });
  return typeof result === 'string' && result !== key;
};
