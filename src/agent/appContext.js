// Builds the sanitized page context handed to the AG-UI agent so it knows
// where the user is and what concept the page treats.
import { getToolParams } from './toolControl';

const TOOL_TITLES = {
  'bs-pricer': 'Black-Scholes Pricer',
  payoff: 'Payoff Visualizer',
  mc: 'Monte Carlo Simulator',
  'iv-calc': 'Implied / Realized Vol',
  calib: 'Model Calibration',
  volsurface: 'Volatility Surface',
};

const COURSE_CONCEPTS = {
  'black-scholes': 'Modèle de Black-Scholes',
  greeks: 'Les Greeks',
  'implied-vol': 'Volatilité implicite',
  'vol-products': 'Produits de volatilité',
  exotics: 'Options exotiques',
  'monte-carlo': 'Méthodes de Monte Carlo',
  stochastic: 'Calcul stochastique',
  hedging: 'Stratégies de couverture',
  'yield-curves': 'Courbes de taux',
};

const SECTION_TITLES = {
  '': 'Accueil',
  tools: 'Outils quantitatifs',
  courses: 'Cours',
  exercises: 'Exercices',
  lab: 'Trading Lab',
  survival: 'Survival Mode',
  community: 'Communauté',
  dashboard: 'Dashboard',
  pricing: 'Plans',
};

const PAGE_TYPES = {
  '': 'home', tools: 'tool', lab: 'tool', courses: 'course', blog: 'blog',
  exercises: 'exercise', survival: 'exercise', pricing: 'pricing',
  dashboard: 'dashboard', admin: 'admin', community: 'community',
};

export function buildAppContext(pathname, user) {
  const parts = String(pathname || '/').split('/').filter(Boolean);
  let toolId = null;
  let courseId = null;
  let concept = null;
  let pageTitle = SECTION_TITLES[parts[0] || ''] || 'The Pricing Library';
  const pageType = PAGE_TYPES[parts[0] || ''] || 'unknown';

  if (parts[0] === 'tools' && parts[1]) {
    toolId = parts[1];
    pageTitle = TOOL_TITLES[toolId] || 'Outil quantitatif';
  } else if (parts[0] === 'courses' && parts[1]) {
    courseId = parts[1];
    concept = COURSE_CONCEPTS[courseId] || courseId;
    pageTitle = concept;
  }

  const plan = user?.plan || (user?.role === 'admin' ? 'admin' : (user?.email ? 'free' : 'free'));
  const safeUser = user
    ? { role: user.role || (user.email ? 'member' : 'guest'), authenticated: !!user.email, plan }
    : null;

  const toolParams = toolId ? getToolParams(toolId) : null;

  return {
    route: String(pathname || '/'),
    pathname: String(pathname || '/'),
    pageTitle,
    pageType,
    toolId,
    toolParams,
    currentTool: toolId ? { name: toolId, parameters: toolParams || {} } : null,
    courseId,
    concept,
    currentConcepts: concept ? [concept] : [],
    level: 'intermediate',
    plan,
    lang: 'fr',
    user: safeUser,
  };
}

// Contextual quick-suggestions for the landing state, by page.
export function suggestionsFor(ctx) {
  if (ctx.toolId === 'bs-pricer') {
    return [
      'Montre-moi la parité call-put',
      'Explique le delta et le gamma ici',
      'Règle le pricer pour une option très out-of-the-money',
    ];
  }
  if (ctx.toolId === 'payoff') {
    return [
      'Construis un bull call spread',
      'Setup le payoff d’un long straddle',
      'Montre un produit structuré à capital protégé',
    ];
  }
  if (ctx.toolId) {
    return ['Explique cet outil', 'Montre une configuration intéressante', 'À quoi sert ce concept en salle de marché ?'];
  }
  if (ctx.courseId) {
    return [
      `Explique-moi ${ctx.concept || 'ce concept'} simplement`,
      'Donne-moi un exercice sur cette leçon',
      'Quelle intuition retenir ici ?',
    ];
  }
  return [
    'Explique-moi le pricing d’options',
    'Montre-moi la parité call-put sur le pricer',
    'Génère un exercice de risk management',
  ];
}
