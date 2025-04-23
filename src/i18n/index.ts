
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';
import { cleanTranslationObject, cleanCaptions } from '../utils/translationUtils';

// Additional missing translations
const additionalEnTranslations = {
  navbar: {
    blog: "Blog",
    mentoring: "Mentoring",
    trainingLab: "Training Lab",
    tradingLab: "Trading Lab"
  },
  contact: "Contact",
  footer: {
    legal: "Legal",
    terms: "Terms",
    privacy: "Privacy",
    cookies: "Cookies",
    copyright: "© 2025 The Pricing Lab"
  },
  coursesPage: {
    advanced: {
      overview: "Advanced Overview",
      impliedVol: {
        lesson1: "Introduction to Implied Volatility",
        lesson2: "Historical vs Implied Volatility",
        lesson3: "Volatility Surface",
        lesson4: "Exercise: Calculate Implied Volatility",
        lesson5: "Notebook: Volatility Smile",
        lesson6: "Module Quiz"
      },
      volProducts: {
        lesson1: "Introduction to Volatility Products",
        lesson2: "VIX and Other Volatility Indices",
        lesson3: "Variance and Volatility Swaps",
        lesson4: "Exercise: Pricing a Variance Swap",
        lesson5: "Notebook: Volatility Trading Strategies",
        lesson6: "Module Quiz"
      }
    }
  }
};

const additionalFrTranslations = {
  navbar: {
    blog: "Blog",
    mentoring: "Mentorat",
    trainingLab: "Labo d'Entraînement",
    tradingLab: "Labo de Trading"
  },
  contact: "Contact",
  footer: {
    legal: "Mentions légales",
    terms: "Conditions",
    privacy: "Confidentialité",
    cookies: "Cookies",
    copyright: "© 2025 The Pricing Lab"
  },
  coursesPage: {
    advanced: {
      overview: "Vue d'ensemble avancée",
      impliedVol: {
        lesson1: "Introduction à la volatilité implicite",
        lesson2: "Volatilité historique vs. volatilité implicite",
        lesson3: "Surface de volatilité",
        lesson4: "Exercice: Calculer la volatilité implicite",
        lesson5: "Notebook: Smile de volatilité",
        lesson6: "Quiz de module"
      },
      volProducts: {
        lesson1: "Introduction aux produits de volatilité",
        lesson2: "VIX et autres indices de volatilité",
        lesson3: "Swaps de variance et de volatilité",
        lesson4: "Exercice: Pricing d'un swap de variance",
        lesson5: "Notebook: Stratégies de trading sur volatilité",
        lesson6: "Quiz de module"
      }
    }
  }
};

// Merge additional translations
const mergedEnTranslation = { 
  ...enTranslation, 
  ...additionalEnTranslations 
};

const mergedFrTranslation = { 
  ...frTranslation, 
  ...additionalFrTranslations 
};

// Process translation files to remove any [caption] markers
const cleanedEnTranslation = cleanTranslationObject(mergedEnTranslation);
const cleanedFrTranslation = cleanTranslationObject(mergedFrTranslation);

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
      // Remove the "[caption]" prefix and transform into a readable format
      const sanitizedKey = key.replace(/\[caption\]([a-zA-Z0-9]*)/g, '$1');
      // Format the key into a more readable form
      const readableKey = sanitizedKey.split('.').pop() || sanitizedKey;
      // Convert camelCase to Title Case with spaces
      return readableKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }
  });

// Force loading of translations
i18n.loadNamespaces('translation');

export default i18n;
