
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';
import { cleanTranslationObject, cleanCaptions } from '../utils/translationUtils';
import { title } from 'process';
import { Subtitles } from 'lucide-react';

// Additional missing translations
const additionalEnTranslations = {
  navbar: {
    blog: "Blog",
    mentoring: "Mentoring",
    trainingLab: "Training Lab",
    tradingLab: "Trading Lab",
    courses: "Courses",
    exercices: "Exercises",
    tools: "Tools",
    community: { label: "Community" }
  },
  contact: "Contact",
  footer: {
    company: "Company",
    about: "About",
    contact: "Contact",
    help: "Help",
    faq: "FAQ",
    blog: "Blog",
    community: "Community",
    newsletter: "Subscribe to our newsletter",
    subscribe: "Subscribe",
    products: "Products",
    courses: "Courses",
    legal: "Legal",
    terms: "Terms",
    privacy: "Privacy",
    cookies: "Cookies",
  },
  courses: {
    fundamentals: "Fundamentals",
    advanced: "Advanced",
    complex: "Complex"
  },
  coursesPage: {
    title: "Courses",
    subtitle: "From fundamental concepts to advanced techniques in quantitative finance",
    description: "Interactive courses on quantitative finance, option pricing and trading strategies",
    locked: "Locked",
    level: "Level",
    duration: "Duration",
    skillsAcquired: "Skills You'll Acquire",
    unlock: "Unlock this Course",
    premiumContent: "Premium Content",
    premiumDescription: "Advanced courses are exclusively available to premium members.",
    subscribe: "Subscribe to Access",
    unlockNow: "Unlock Now",
    discoverOther: "Discover Other Courses",
    coursePreview: "Course Preview",
    startCourse: "Start Course",
    alreadySubscribed: "Already subscribed?",
    unlockContent: "Unlock Content",
    levels: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      expert: "Expert"
    },
    fundamentals: {
      tab: "Fundamentals",
      title: "Fundamental Concepts",
      blackScholes: {
        title: "Black-Scholes Model",
        description: "Master the cornerstone option pricing model that revolutionized financial markets",
        duration: "4 hours",
        preview: "Learn how the Black-Scholes model is derived, its assumptions, and how to apply it to price vanilla options."
      },
      yieldCurves: {
        title: "Yield Curves",
        description: "Understand the term structure of interest rates and its implications for pricing",
        duration: "3.5 hours",
        preview: "Explore how yield curves are constructed and how they affect financial instrument pricing.",
        topics: {
          zeroCoupon: "Zero-Coupon Bonds",
          interpolation: "Curve Interpolation",
          bootstrapping: "Bootstrapping Methods",
          discounting: "Discounting & Present Value"
        }
      },
      greeks: {
        title: "Option Greeks",
        description: "Master delta, gamma, vega, theta and their role in risk management",
        duration: "4 hours",
        preview: "Understand how option prices change with respect to underlying parameters."
      }
    },
    advanced: {
      tab: "Advanced",
      title: "Advanced Techniques",
      overview: "Advanced Overview",
      impliedVol: {
        title: "Implied Volatility",
        description: "Understand volatility smiles, skews, and term structures across option markets",
        duration: "5 hours",
        preview: "Explore how implied volatility is calculated from market prices and what information it contains about market expectations.",
        impliedVolPremiumDesc: "Learn how to analyze and utilize implied volatility in your options trading strategies.",
        topics: {
          calibration: "Surface Calibration"
        },
        skills: {
          analysis: "Volatility Surface Analysis",
          skews: "Volatility Skew Interpretation",
          calibration: "Model Calibration",
          pricing: "Exotic Options Pricing"
        },
        lessons: {
          intro: "Introduction to Implied Volatility",
          historical: "Historical vs Implied Volatility",
          surface: "Volatility Surface",
          smile: "Volatility Smile",
          exercise: "Calculate Implied Volatility Exercise",
          notebook: "Volatility Smile Notebook",
          quiz: "Module Quiz"
        }
      },
      volProducts: {
        title: "Volatility Products",
        description: "Master trading and hedging with VIX, variance swaps, and volatility ETFs",
        duration: "5.5 hours",
        preview: "Discover the world of volatility as an asset class and how to trade it effectively.",
        topics: {
          varianceSwaps: "Variance Swaps",
          volSwaps: "Volatility Swaps",
          volTargeting: "Volatility Targeting"
        }
      }
    },
    complex: {
      tab: "Complex",
      title: "Complex Methods",
      exotic: {
        title: "Exotic Options",
        description: "Price and hedge complex derivatives like barriers, Asians, and lookbacks",
        duration: "6 hours",
        preview: "Learn the pricing and hedging techniques for advanced option structures.",
        topics: {
          knockInOut: "Knock-In & Knock-Out Options",
          touch: "One-Touch Options",
          digitals: "Digital Options",
          corridors: "Corridor Options"
        }
      },
      monteCarlo: {
        title: "Monte Carlo Methods",
        description: "Implement simulation techniques for pricing path-dependent options",
        duration: "6.5 hours",
        preview: "Master simulation-based techniques for pricing complex derivatives.",
        topics: {
          simulation: "Path Simulation",
          asian: "Asian Options Pricing",
          lookback: "Lookback Options",
          varianceReduction: "Variance Reduction Techniques"
        }
      }
    },
    learning: {
      title: "Continue Your Learning",
      subtitle: "Explore other ways to improve your quantitative finance skills",
      mentoring: "1-on-1 Mentoring",
      practice: "Practice Exercises"
    }
  },
  tradingLab:{
    strategyDescriptions: {
      longCall: "Buying a call option. Unlimited potential profit if the price rises, limited loss to the premium paid.",
      longPut: "Buying a put option. Potential profit if the price falls, limited loss to the premium paid.",
      coveredCall: "Holding the underlying asset and selling a call. Increases yield but limits upside potential.",
      protectivePut: "Holding the underlying asset and buying a put. Limits potential losses if the price drops.",
      straddle: "Buying a call and a put at the same strike. Profits from high volatility in either direction.",
      strangle: "Buying an OTM call and an OTM put. Cheaper than a straddle but requires a larger move.",
      bullCallSpread: "Buying an ITM call and selling an OTM call. Limited profit, reduced cost.",
      bearPutSpread: "Buying an ITM put and selling an OTM put. Limited profit, reduced cost.",
      ironCondor: "Combining a bull put spread and a bear call spread. Profits if the price stays within a range.",
      butterflySpread: "Combining a bull spread and a bear spread. Maximum profit if the price is exactly at the middle strike at expiration."
    },
  
},
};
const additionalFrTranslations = {
  navbar: {
    blog: "Blog",
    mentoring: "Mentorat",
    trainingLab: "Labo d'Entraînement",
    tradingLab: "Labo de Trading",
    courses: "Cours",
    exercices: "Exercices",
    tools: "Outils",
    community: { label: "Communauté" }
  },
  contact: "Contact",
  footer: {
    company: "Compagnie",
    about: "À propos",
    contact: "Contact",
    help: "Aide",
    faq: "FAQ",
    blog: "Blog",
    community: "Communauté",
    newsletter: "Abonnez-vous à notre newsletter",
    subscribe: "S'abonner",
    products: "Produits",
    courses: "Cours",
    legal: "Mentions légales",
    terms: "Conditions",
    privacy: "Confidentialité",
    cookies: "Cookies",
  },
  courses: {
    fundamentals: "Fondamentaux",
    advanced: "Avancé",
    complex: "Complexe"
  },
  coursesPage: {
    title: "Cours",
    subtitle: "Des concepts fondamentaux aux techniques avancées en finance quantitative",
    description: "Cours interactifs sur la finance quantitative, le pricing d'options et les stratégies de trading",
    locked: "Verrouillé",
    level: "Niveau",
    duration: "Durée",
    skillsAcquired: "Compétences acquises",
    unlock: "Débloquer ce cours",
    premiumContent: "Contenu Premium",
    premiumDescription: "Les cours avancés sont disponibles exclusivement avec un abonnement premium.",
    subscribe: "S'abonner pour accéder",
    unlockNow: "Débloquer maintenant",
    discoverOther: "Découvrir autres cours",
    coursePreview: "Aperçu du cours",
    startCourse: "Démarrer le cours",
    alreadySubscribed: "Déjà abonné ?",
    unlockContent: "Débloquer ce contenu"
    },
    levels: {
      beginner: "Débutant",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      expert: "Expert"
    },
    fundamentals: {
      tab: "Fondamentaux",
      title: "Concepts Fondamentaux",
      blackScholes: {
        title: "Modèle Black-Scholes",
        description: "Maîtrisez le modèle fondamental d'évaluation des options qui a révolutionné les marchés financiers",
        duration: "4 heures",
        preview: "Apprenez comment le modèle Black-Scholes est dérivé, ses hypothèses et comment l'appliquer pour évaluer les options vanille."
      },
      yieldCurves: {
        title: "Courbes de Taux",
        description: "Comprendre la structure à terme des taux d'intérêt et ses implications pour l'évaluation",
        duration: "3,5 heures",
        preview: "Explorez comment les courbes de taux sont construites et comment elles affectent l'évaluation des instruments financiers.",
        topics: {
          zeroCoupon: "Obligations Zéro-Coupon",
          interpolation: "Interpolation de Courbe",
          bootstrapping: "Méthodes de Bootstrapping",
          discounting: "Actualisation & Valeur Présente"
        }
      },
      greeks: {
        title: "Les Grecques",
        description: "Maîtrisez delta, gamma, véga, thêta et leur rôle dans la gestion des risques",
        duration: "4 heures",
        preview: "Comprendre comment les prix des options changent en fonction des paramètres sous-jacents."
      }
    },
    advanced: {
      tab: "Avancé",
      title: "Techniques Avancées",
      overview: "Vue d'ensemble avancée",
      impliedVol: {
        title: "Volatilité Implicite",
        description: "Comprendre les smiles, skews et structures de terme de volatilité sur les marchés d'options",
        duration: "5 heures",
        preview: "Explorez comment la volatilité implicite est calculée à partir des prix du marché et quelles informations elle contient sur les attentes du marché.",
        impliedVolPremiumDesc: "Apprenez à analyser et à utiliser la volatilité implicite dans vos stratégies de trading d'options.",
        topics: {
          calibration: "Calibration de Surface"
        },
        skills: {
          analysis: "Analyse de Surface de Volatilité",
          skews: "Interprétation des Skews de Volatilité",
          calibration: "Calibration de Modèle",
          pricing: "Pricing d'Options Exotiques"
        },
        lessons: {
          intro: "Introduction à la Volatilité Implicite",
          historical: "Volatilité Historique vs Implicite",
          surface: "Surface de Volatilité",
          smile: "Smile de Volatilité",
          exercise: "Exercice de Calcul de Volatilité Implicite",
          notebook: "Notebook sur le Smile de Volatilité",
          quiz: "Quiz du Module"
        }
      },
      volProducts: {
        title: "Produits de Volatilité",
        description: "Maîtrisez le trading et la couverture avec VIX, swaps de variance et ETF de volatilité",
        duration: "5,5 heures",
        preview: "Découvrez le monde de la volatilité en tant que classe d'actifs et comment la trader efficacement.",
        topics: {
          varianceSwaps: "Swaps de Variance",
          volSwaps: "Swaps de Volatilité",
          volTargeting: "Ciblage de Volatilité"
        }
      }
    },
    complex: {
      tab: "Complexe",
      title: "Méthodes Complexes",
      exotic: {
        title: "Options Exotiques",
        description: "Évaluez et couvrez des dérivés complexes comme les barrières, asiatiques, lookbacks",
        duration: "6 heures",
        preview: "Apprenez les techniques de pricing et de couverture pour les structures d'options avancées.",
        topics: {
          knockInOut: "Options Knock-In & Knock-Out",
          touch: "Options One-Touch",
          digitals: "Options Digitales",
          corridors: "Options Corridor"
        }
      },
      monteCarlo: {
        title: "Méthodes de Monte Carlo",
        description: "Mettez en œuvre des techniques de simulation pour le pricing des options path-dépendantes",
        duration: "6,5 heures",
        preview: "Maîtrisez les techniques de simulation pour le pricing des dérivés complexes.",
        topics: {
          simulation: "Simulation de Trajectoires",
          asian: "Pricing d'Options Asiatiques",
          lookback: "Options Lookback",
          varianceReduction: "Techniques de Réduction de Variance"
        }
      }
    },
    learning: {
      title: "Poursuivez votre apprentissage",
      subtitle: "Explorez d'autres moyens d'améliorer vos compétences en finance quantitative",
      mentoring: "Mentorat individuel",
      practice: "Exercices pratiques"
    },
    tradingLab:{
      strategyDescriptions:{
      longCall: "Achat d'une option d'achat. Profit potentiel illimité si le prix monte, perte limitée à la prime.",
      longPut: "Achat d'une option de vente. Profit potentiel si le prix baisse, perte limitée à la prime.",
      coveredCall: "Détention du sous-jacent et vente d'un call. Augmente le rendement mais limite le potentiel de hausse.",
      protectivePut:"Détention du sous-jacent et achat d'un put. Limite les pertes potentielles en cas de baisse du prix.",
      straddle:"Achat d'un call et d'un put au même strike. Profite d'une forte volatilité dans un sens ou dans l'autre.",
      strangle:"Achat d'un call OTM et d'un put OTM. Moins cher qu'un straddle mais nécessite un mouvement plus important",
      bullCallSpread:"Achat d'un call ITM et vente d'un call OTM. Profit limité mais coût réduit.",
      bearPutSpread:"Achat d'un put ITM et vente d'un put OTM. Profit limité mais coût réduit",
      ironCondor:"Combinaison d'un bull put spread et d'un bear call spread. Profit si le prix reste dans une fourchette.",
      butterflySpread:"Combinaison d'un bull spread et d'un bear spread. Profit maximal si le prix est exactement au strike moyen à l'échéance."
    }
  }
};

// Deep merge function to properly merge nested objects
function deepMerge(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Merge additional translations using deep merge
const mergedEnTranslation = deepMerge({}, enTranslation, additionalEnTranslations);
const mergedFrTranslation = deepMerge({}, frTranslation, additionalFrTranslations);

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
      //console.warn(`Missing translation key: ${key} for language: ${lng}`);
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

// Add debugging to help troubleshoot i18n issues
if (process.env.NODE_ENV === 'development') {
  i18n.on('initialized', () => {
    //console.log('i18n initialized successfully');
  });
  
  i18n.on('languageChanged', (lng) => {
    //console.log(`Language changed to: ${lng}`);
  });
  
  i18n.on('missingKey', (lngs, namespace, key) => {
    //console.warn(`Missing translation key: ${key} for languages: ${lngs.join(', ')}`);
  });
}

export default i18n;
