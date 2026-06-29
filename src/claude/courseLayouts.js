// Per-course layout registry. The cockpit (CourseWrittenLessonExperience) reads
// this so each course/theme renders distinctly instead of one cloned template.
//
// Wave A (live now): `tone` (accent) + `marketLessons` (the ONLY lessons where the
// real-market widget appears — kills the "same chart on every module" repeat) +
// `hero` metadata (the theme anchor, used as a per-lesson caption now and wired to
// dedicated hero components in later waves).
//
// `marketLessons` lists the lesson number(s) where real market data is genuinely
// load-bearing for that theme (per the design audit), e.g. implied-vol shows the
// implied-vs-realized vol gap only on the smile lesson, not on all four.

export const COURSE_LAYOUTS = {
  'vanilla-options-quote':           { tone: 'blue',  marketLessons: [2], hero: 'Quote ticket / pricing blotter' },
  'options-book-greeks-pnl':         { tone: 'red',   marketLessons: [3], hero: 'P&L attribution waterfall' },
  'implied-volatility-smile':        { tone: 'amber', marketLessons: [3], hero: 'Smile / calibration bench (implied vs realized)' },
  'rates-swaps-dv01':                { tone: 'green', marketLessons: [3], hero: 'DV01 ladder by tenor' },
  'yield-curve-bootstrapping':       { tone: 'green', marketLessons: [2], hero: 'Live bootstrapped curve' },
  'fixed-income-bonds-duration':     { tone: 'green', marketLessons: [2], hero: 'Price-yield curve with duration tangent' },
  'monte-carlo-pricing':             { tone: 'blue',  marketLessons: [2], hero: 'Live convergence (CI cone)' },
  'barrier-options-gap-risk':        { tone: 'red',   marketLessons: [3], hero: 'Price path vs barrier + gap zone' },
  'structured-products-autocall':    { tone: 'amber', marketLessons: [3], hero: 'Autocall ladder + payoff decomposition' },
  'credit-derivatives-cds':          { tone: 'red',   marketLessons: [3], hero: 'Live CDS risk blotter (CS01 / carry / JTD)' },
  'market-risk-var-stress':          { tone: 'amber', marketLessons: [3], hero: 'P&L distribution: Gaussian vs real tail' },
  'stochastic-calculus-for-hedging': { tone: 'blue',  marketLessons: [3], hero: 'Hedged-path P&L: the drift disappears' },
};

export function getCourseLayout(slug) {
  return COURSE_LAYOUTS[slug] || null;
}

// Should the real-market widget render on this lesson? Configured courses show it
// only on their load-bearing lesson(s); unconfigured courses keep legacy behavior.
export function showMarketOnLesson(slug, lessonNumber) {
  const layout = COURSE_LAYOUTS[slug];
  if (!layout) return true;
  return (layout.marketLessons || []).includes(Number(lessonNumber));
}
