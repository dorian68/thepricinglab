
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';
import { cleanTranslationObject } from '../utils/translationUtils';

// Process translation files to remove any [caption] markers
const cleanedEnTranslation = cleanTranslationObject(enTranslation);
const cleanedFrTranslation = cleanTranslationObject(frTranslation);

// Initialize i18next
i18n
  // Use language detector with higher order of detection
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources: {
      en: {
        translation: cleanedEnTranslation
      },
      fr: {
        translation: cleanedFrTranslation
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false // React already safes from xss
    },
    // Add missing key handling to show a more user-friendly fallback
    saveMissing: true,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
    },
    parseMissingKeyHandler: (key) => {
      // If a key is missing, return a more user-friendly fallback without [caption]
      const fallback = key.split('.').pop() || key;
      return fallback.replace(/\[caption\]\s*/g, '');
    }
  });

// Force loading of translations
i18n.loadNamespaces('translation');

export default i18n;
