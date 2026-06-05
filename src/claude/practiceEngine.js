const GENERATED_EXERCISES_KEY = 'tpl.generated.exercises.v1';

export const PRACTICE_COURSE_EXTENSIONS = [
  {
    id: 'rates-swaps',
    title: 'Rates Swaps & DV01',
    tier: 'Fundamentals',
    level: 'L2',
    duration: '4h 10m',
    modules: 7,
    badge: 'free',
    tagline: 'Quote, value and hedge an interest-rate swap from par rate to DV01.',
    topics: ['Par rate', 'Annuity', 'DV01', 'Curve shock'],
    accent: '#3E8BFF',
  },
  {
    id: 'credit-derivatives',
    title: 'Credit Derivatives & CS01',
    tier: 'Advanced',
    level: 'L3',
    duration: '4h 40m',
    modules: 8,
    badge: 'student',
    tagline: 'Turn CDS spreads into carry, CS01 and spread-shock P&L decisions.',
    topics: ['CDS spread', 'Risky annuity', 'CS01', 'Credit shock'],
    accent: '#FFB020',
  },
  {
    id: 'market-risk-var',
    title: 'Market Risk & VaR',
    tier: 'Advanced',
    level: 'L3',
    duration: '5h 00m',
    modules: 8,
    badge: 'student',
    tagline: 'Estimate loss limits, stress moves and escalation decisions from desk data.',
    topics: ['Parametric VaR', 'Expected shortfall', 'Stress testing', 'Limits'],
    accent: '#19C37D',
  },
  {
    id: 'structured-products',
    title: 'Structured Products Desk',
    tier: 'Complex',
    level: 'L4',
    duration: '6h 20m',
    modules: 10,
    badge: 'pro',
    tagline: 'Build autocallable and barrier payoffs like a structuring analyst.',
    topics: ['Autocall', 'Coupon barrier', 'Protection', 'Scenario table'],
    accent: '#D946EF',
  },
  {
    id: 'fixed-income-bonds',
    title: 'Fixed Income Bonds',
    tier: 'Fundamentals',
    level: 'L2',
    duration: '3h 30m',
    modules: 6,
    badge: 'free',
    tagline: 'Price bonds, compute duration and explain rate-shock P&L.',
    topics: ['Clean price', 'YTM', 'Duration', 'Convexity'],
    accent: '#19C37D',
  },
];

export const COURSE_BLUEPRINTS = {
  'black-scholes': {
    deskPromise: 'Price a vanilla option, explain every input, and defend the quote against parity and Greek checks.',
    deskRole: 'Junior equity derivatives analyst',
    workflow: ['Read market inputs', 'Compute call/put price', 'Check parity', 'Explain delta and vega risk', 'Write a quote note'],
    lessons: [
      { n: '1.1', t: 'Desk brief: quote a vanilla option', d: '8m', done: true },
      { n: '1.2', t: 'Inputs that actually move the price', d: '12m', done: true },
      { n: '1.3', t: 'd1/d2 as a calculation routine', d: '18m', done: true },
      { n: '2.1', t: 'Delta and vega sanity checks', d: '16m', done: false, current: true },
      { n: '2.2', t: 'Put-call parity control', d: '12m', done: false },
      { n: '3.1', t: 'Python quote sheet', d: '24m', done: false },
      { n: '3.2', t: 'Trader memo: quote or reject', d: '14m', done: false },
    ],
    modules: [
      { t: 'The quote ticket', d: 'Start with S, K, T, r, q and vol. The output is a quote, not a formula dump.' },
      { t: 'Controls before confidence', d: 'Use parity, intrinsic value and monotonicity checks before trusting the number.' },
      { t: 'Risk translation', d: 'Convert Greeks into hedge size and explain the operational action.' },
      { t: 'Desk deliverable', d: 'Write a short quote note with assumptions, price, Greeks and caveats.' },
    ],
    labs: [
      ['Quote control', 'S=100, K=100, r=5%, vol=20%, T=1y. Compute call, put and parity gap.'],
      ['Vega risk', 'Shock vol by +3 points and explain why premium moves.'],
      ['Hedge note', 'Convert delta into shares to buy/sell for 1,000 option contracts.'],
    ],
    resources: ['John Hull options chapter', 'Black-Scholes formula note', 'Python pricer notebook', 'Parity checklist'],
    relatedExerciseIds: ['bs-eur-call', 'iv-newton', 'delta-hedge'],
  },
  'yield-curves': {
    deskPromise: 'Bootstrap usable discount factors and turn curve moves into bond/swap risk language.',
    deskRole: 'Rates analyst',
    workflow: ['Collect quotes', 'Build discount factors', 'Interpolate curve', 'Compute forward rates', 'Stress the curve'],
    lessons: [
      { n: '1.1', t: 'Curve instruments on a desk', d: '10m', done: true },
      { n: '1.2', t: 'Discount factors from deposits and swaps', d: '18m', done: true },
      { n: '1.3', t: 'Bootstrapping without hand waving', d: '24m', done: false, current: true },
      { n: '2.1', t: 'Forward-rate interpretation', d: '14m', done: false },
      { n: '2.2', t: 'Curve shock P&L', d: '16m', done: false },
    ],
    modules: [
      { t: 'Market quote map', d: 'Separate deposits, futures, swaps and bonds before doing any math.' },
      { t: 'Bootstrap routine', d: 'Recover discount factors recursively and audit impossible outputs.' },
      { t: 'Forward diagnosis', d: 'Read the curve like a risk manager: steepening, flattening, inversion.' },
      { t: 'Desk stress', d: 'Translate a +10bp move into P&L and hedge intuition.' },
    ],
    labs: [
      ['Bootstrap table', 'Use short deposit quotes and 2Y/5Y swaps to recover discount factors.'],
      ['Forward check', 'Compute implied 1Y1Y and explain the curve view.'],
      ['Rates memo', 'Recommend how to monitor a steepener after a policy shock.'],
    ],
    resources: ['Calcul obligataire PDF', 'Courbe des taux PDF', 'Swaps de taux PDF', 'Rates exercise videos'],
    relatedExerciseIds: ['curve-boot', 'swap-dv01'],
  },
  greeks: {
    deskPromise: 'Turn Greeks into daily hedge actions and explain P&L attribution like a desk risk note.',
    deskRole: 'Options risk analyst',
    workflow: ['Read Greek report', 'Build scenario', 'Attribute P&L', 'Choose hedge', 'Escalate residual risk'],
    lessons: [
      { n: '1.1', t: 'Greek report anatomy', d: '9m', done: true },
      { n: '1.2', t: 'Delta and gamma P&L', d: '18m', done: true },
      { n: '1.3', t: 'Vega and theta attribution', d: '16m', done: false, current: true },
      { n: '2.1', t: 'Hedge sizing', d: '20m', done: false },
      { n: '2.2', t: 'Risk limits and escalation', d: '12m', done: false },
    ],
    modules: [
      { t: 'Risk report first', d: 'Start from book delta, gamma, vega and theta, not from definitions.' },
      { t: 'Scenario P&L', d: 'Apply spot and vol shocks with the right units and signs.' },
      { t: 'Hedge action', d: 'Translate sensitivity into instruments and residual risks.' },
      { t: 'Risk communication', d: 'Write an attribution that a trader and risk manager can both use.' },
    ],
    labs: [
      ['Book shock', 'Delta +250k EUR per 1%, gamma -80k EUR per 1%^2, vega +120k per vol point.'],
      ['Gamma problem', 'Explain why delta-neutral is not risk-neutral near expiry.'],
      ['Vega hedge', 'Pick a hedge and state what remains unhedged.'],
    ],
    resources: ['Option Volatility and Pricing', 'Dynamic Hedging', 'Greeks simulator', 'Risk attribution checklist'],
    relatedExerciseIds: ['delta-hedge', 'options-book-greeks'],
  },
  'implied-vol': {
    deskPromise: 'Infer volatility from prices, clean bad quotes and explain smile/skew without losing the trading point.',
    deskRole: 'Volatility analyst',
    workflow: ['Read option chain', 'Invert price to vol', 'Clean quotes', 'Fit smile', 'Explain skew risk'],
    lessons: [
      { n: '1.1', t: 'Option chain triage', d: '10m', done: true },
      { n: '1.2', t: 'Implied-vol inversion', d: '18m', done: true },
      { n: '1.3', t: 'Bad quotes and no-arbitrage checks', d: '16m', done: false, current: true },
      { n: '2.1', t: 'Smile slices', d: '18m', done: false },
      { n: '2.2', t: 'Skew as a risk signal', d: '14m', done: false },
    ],
    modules: [
      { t: 'From price to vol', d: 'Use IV as the common language of option markets.' },
      { t: 'Cleaning before fitting', d: 'Remove quotes that violate basic pricing bounds.' },
      { t: 'Smile construction', d: 'Build strike and maturity slices from usable data.' },
      { t: 'Desk interpretation', d: 'Translate skew and term structure into risk and trade commentary.' },
    ],
    labs: [
      ['Newton IV', 'Recover implied vol from a market call price.'],
      ['Smile fit', 'Fit a simple curve and identify outliers.'],
      ['Trader note', 'Explain what a steeper put skew implies for hedge demand.'],
    ],
    resources: ['Volatility surface notes', 'SVI fitting references', 'Vol products post', 'IV calculator'],
    relatedExerciseIds: ['iv-newton', 'smile-fit'],
  },
  'vol-products': {
    deskPromise: 'Understand variance swaps and vol carry through replication, P&L and exposure management.',
    deskRole: 'Vol products analyst',
    workflow: ['Identify payoff', 'Estimate fair variance', 'Compare realized/implied', 'Attribute P&L', 'State hedge'],
    lessons: [
      { n: '1.1', t: 'Variance payoff in P&L terms', d: '12m', done: true },
      { n: '1.2', t: 'Realized vs implied variance', d: '18m', done: false, current: true },
      { n: '1.3', t: 'Vol carry and convexity', d: '18m', done: false },
      { n: '2.1', t: 'VIX and term structure', d: '20m', done: false },
    ],
    modules: [
      { t: 'Payoff first', d: 'State exactly when the trade wins or loses.' },
      { t: 'Carry estimate', d: 'Compare implied and expected realized variance.' },
      { t: 'Exposure map', d: 'Separate spot, vol and vol-of-vol sensitivity.' },
      { t: 'Risk note', d: 'Explain gap risk, convexity and limits.' },
    ],
    labs: [
      ['Variance P&L', 'Compute P&L from realized variance below strike.'],
      ['Vol carry', 'Rank three maturities by carry and tail risk.'],
      ['Risk memo', 'Explain why short variance can look profitable until it is not.'],
    ],
    resources: ['Volatility Products course', 'Variance swap notes', 'VIX term structure dataset'],
    relatedExerciseIds: ['var-swap-pnl', 'smile-fit'],
  },
  hedging: {
    deskPromise: 'Build hedges that survive realistic constraints: liquidity, residual Greeks and rebalance frequency.',
    deskRole: 'Hedging strategist',
    workflow: ['Define exposure', 'Choose hedge instrument', 'Size hedge', 'Stress residuals', 'Plan rebalancing'],
    lessons: [
      { n: '1.1', t: 'What needs hedging', d: '10m', done: true },
      { n: '1.2', t: 'Delta-gamma hedge sizing', d: '20m', done: false, current: true },
      { n: '1.3', t: 'Vega hedge mismatch', d: '18m', done: false },
      { n: '2.1', t: 'Rebalancing and transaction cost', d: '16m', done: false },
    ],
    modules: [
      { t: 'Hedge objective', d: 'State whether you hedge P&L, Greeks, capital or limit usage.' },
      { t: 'Instrument choice', d: 'Pick liquid hedges and make basis risk visible.' },
      { t: 'Residual risk', d: 'Show what remains after the hedge and when to rebalance.' },
      { t: 'Desk decision', d: 'Document action, trigger and escalation threshold.' },
    ],
    labs: [
      ['Delta hedge', 'Neutralize a book and compute shares/futures required.'],
      ['Gamma residual', 'Stress the hedged book under a 2% move.'],
      ['Vega mismatch', 'Hedge 3M vega with 1M and 6M options.'],
    ],
    resources: ['Dynamic Hedging', 'Options book Greek calculator', 'Hedge memo template'],
    relatedExerciseIds: ['delta-hedge', 'options-book-greeks'],
  },
  exotics: {
    deskPromise: 'Read path-dependent payoffs, build scenario tables and identify the risk that vanilla intuition misses.',
    deskRole: 'Exotics structuring analyst',
    workflow: ['Draw payoff path rule', 'Build scenario table', 'Estimate payoff', 'Identify gap risk', 'Write hedge caveat'],
    lessons: [
      { n: '1.1', t: 'Path dependence as desk language', d: '10m', done: true },
      { n: '1.2', t: 'Barrier scenario table', d: '18m', done: true },
      { n: '1.3', t: 'Asian and lookback intuition', d: '18m', done: false, current: true },
      { n: '2.1', t: 'Autocallable cash-flow map', d: '24m', done: false },
      { n: '2.2', t: 'Gap and model risk', d: '16m', done: false },
    ],
    modules: [
      { t: 'Payoff path rule', d: 'Write the barrier or averaging rule before pricing anything.' },
      { t: 'Scenario table', d: 'Evaluate the payoff under realistic paths and terminal levels.' },
      { t: 'Hedge caveat', d: 'Explain why gap risk and discontinuity matter near barriers.' },
      { t: 'Structuring memo', d: 'Describe client payoff, desk risk and monitoring triggers.' },
    ],
    labs: [
      ['Barrier payoff', 'EUR/USD DOC with spot scenarios and knock-out state.'],
      ['Autocall cash flows', 'Map coupon and redemption under three paths.'],
      ['Gap risk note', 'Explain why delta hedging fails at the barrier.'],
    ],
    resources: ['Exotic Options and Hybrids', 'Emerging Financial Derivatives', 'Barrier case templates'],
    relatedExerciseIds: ['barrier-knock-in', 'autocall'],
  },
  'monte-carlo': {
    deskPromise: 'Use simulation when closed form is unavailable, and report uncertainty like a professional.',
    deskRole: 'Quant developer',
    workflow: ['Define stochastic process', 'Simulate paths', 'Compute payoff', 'Discount average', 'Report confidence interval'],
    lessons: [
      { n: '1.1', t: 'Simulation ticket', d: '8m', done: true },
      { n: '1.2', t: 'GBM path generation', d: '18m', done: true },
      { n: '1.3', t: 'Payoff estimation', d: '16m', done: false, current: true },
      { n: '2.1', t: 'Standard error and CI', d: '18m', done: false },
      { n: '2.2', t: 'Variance reduction', d: '22m', done: false },
    ],
    modules: [
      { t: 'Model ticket', d: 'State process, payoff and discretization before writing code.' },
      { t: 'Simulation control', d: 'Use seeds, path counts and time steps intentionally.' },
      { t: 'Uncertainty report', d: 'Price is incomplete without standard error and confidence interval.' },
      { t: 'Production caveats', d: 'Name bias, convergence and runtime tradeoffs.' },
    ],
    labs: [
      ['Asian option MC', 'Simulate arithmetic average payoff and confidence interval.'],
      ['Antithetic control', 'Compare standard error before/after variance reduction.'],
      ['Runtime memo', 'Recommend path count for a desk SLA.'],
    ],
    resources: ['Monte Carlo methods notes', 'Handbook in Monte Carlo Simulation', 'Python notebook'],
    relatedExerciseIds: ['mc-asian'],
  },
  stochastic: {
    deskPromise: 'Use stochastic calculus only where it improves a pricing or hedging decision.',
    deskRole: 'Quant researcher',
    workflow: ['Identify process', 'Apply Ito where needed', 'Change measure if useful', 'Connect to pricing', 'Validate intuition'],
    lessons: [
      { n: '1.1', t: 'SDEs as model tickets', d: '14m', done: true },
      { n: '1.2', t: 'Ito lemma for a hedge argument', d: '24m', done: false, current: true },
      { n: '1.3', t: 'Martingales in pricing language', d: '20m', done: false },
      { n: '2.1', t: 'Measure change as a tool', d: '26m', done: false },
    ],
    modules: [
      { t: 'Model statement', d: 'Translate the desk problem into an SDE with clear assumptions.' },
      { t: 'Ito in action', d: 'Use Ito to derive risk terms, not to show off notation.' },
      { t: 'Pricing connection', d: 'Relate dynamics to expectation, discounting and hedging.' },
      { t: 'Model critique', d: 'State where the SDE fails against real market behavior.' },
    ],
    labs: [
      ['Ito hedge', 'Apply Ito to a call price and identify delta/gamma terms.'],
      ['Measure check', 'Explain why drift changes under risk-neutral pricing.'],
      ['Model critique', 'List the market features GBM misses for equity options.'],
    ],
    resources: ['Stochastic calculus texts', 'Financial Calculus', 'Mathematical basis for finance'],
    relatedExerciseIds: ['ito-hedge-note', 'mc-asian'],
  },
  'rates-swaps': {
    deskPromise: 'Convert par swap quotes into PV, DV01 and hedge decisions.',
    deskRole: 'Rates desk analyst',
    workflow: ['Read swap ticket', 'Compute PV from coupon gap', 'Compute DV01', 'Apply curve shock', 'Choose hedge'],
    lessons: [
      { n: '1.1', t: 'Swap ticket anatomy', d: '10m', done: true },
      { n: '1.2', t: 'Par rate vs fixed coupon', d: '16m', done: true },
      { n: '1.3', t: 'DV01 and annuity approximation', d: '18m', done: false, current: true },
      { n: '2.1', t: 'Curve shock P&L', d: '16m', done: false },
      { n: '2.2', t: 'Hedge with futures/swaps', d: '18m', done: false },
    ],
    modules: [
      { t: 'Ticket to risk', d: 'Identify payer/receiver, notional, coupon, maturity and current par rate.' },
      { t: 'PV approximation', d: 'Use annuity times coupon gap to estimate value.' },
      { t: 'DV01', d: 'Turn annuity and notional into EUR per basis point.' },
      { t: 'Hedge action', d: 'Explain what to do after a +10bp or -10bp shock.' },
    ],
    labs: [
      ['Swap PV', 'Payer EUR 5Y 100m, fixed 3.20%, par 3.00%, annuity 4.55.'],
      ['Shock P&L', 'Curve rises by 10bp. Compute P&L and DV01.'],
      ['Hedge note', 'Choose hedge direction and explain residual curve risk.'],
    ],
    resources: ['Swaps de taux PDF', 'Euribor et derives court terme PDF', 'Rates calculator'],
    relatedExerciseIds: ['swap-dv01', 'curve-boot'],
  },
  'credit-derivatives': {
    deskPromise: 'Measure CDS spread risk and explain carry versus mark-to-market loss.',
    deskRole: 'Credit derivatives analyst',
    workflow: ['Read CDS ticket', 'Compute CS01', 'Estimate carry', 'Shock spread', 'Escalate credit risk'],
    lessons: [
      { n: '1.1', t: 'CDS ticket and spread language', d: '12m', done: true },
      { n: '1.2', t: 'Risky annuity approximation', d: '16m', done: false, current: true },
      { n: '1.3', t: 'CS01 and spread shock P&L', d: '18m', done: false },
      { n: '2.1', t: 'Carry versus jump risk', d: '18m', done: false },
    ],
    modules: [
      { t: 'Ticket basics', d: 'Notional, spread, risky annuity and buy/sell protection direction.' },
      { t: 'CS01', d: 'Compute value change for 1bp spread move.' },
      { t: 'Carry', d: 'Separate earned coupon from spread mark-to-market.' },
      { t: 'Risk action', d: 'Decide whether to reduce, hedge or monitor exposure.' },
    ],
    labs: [
      ['CDS CS01', '50m notional, 120bp spread, risky annuity 4.2.'],
      ['Spread shock', 'Shock +25bp and estimate P&L.'],
      ['Credit memo', 'Explain why carry can hide widening risk.'],
    ],
    resources: ['Credit Derivatives instruments and pricing', 'CDS calculator', 'Credit risk checklist'],
    relatedExerciseIds: ['cds-cs01'],
  },
  'market-risk-var': {
    deskPromise: 'Use VaR and stress tests as limit tools, not as decorative risk numbers.',
    deskRole: 'Market risk analyst',
    workflow: ['Read portfolio exposure', 'Compute VaR', 'Stress a tail move', 'Compare to limit', 'Escalate action'],
    lessons: [
      { n: '1.1', t: 'Loss distribution from desk positions', d: '12m', done: true },
      { n: '1.2', t: 'Parametric VaR routine', d: '16m', done: false, current: true },
      { n: '1.3', t: 'Expected shortfall and tail risk', d: '18m', done: false },
      { n: '2.1', t: 'Stress testing and escalation', d: '18m', done: false },
    ],
    modules: [
      { t: 'Risk question', d: 'Ask what loss level matters for limit usage and governance.' },
      { t: 'VaR estimate', d: 'Compute confidence-level loss with clear horizon and volatility.' },
      { t: 'Stress overlay', d: 'Add a scenario that VaR may not capture.' },
      { t: 'Action note', d: 'Recommend monitor, hedge, reduce or escalate.' },
    ],
    labs: [
      ['VaR limit', '20m portfolio, 2% daily vol, 95% confidence.'],
      ['Stress add-on', 'Compare VaR with a -5% shock.'],
      ['Risk report', 'Write a one-paragraph escalation note.'],
    ],
    resources: ['Financial Risk Manager Handbook', 'Risk forecasting texts', 'VaR calculator'],
    relatedExerciseIds: ['parametric-var'],
  },
  'structured-products': {
    deskPromise: 'Map structured payoff cash flows and explain client outcome versus desk risk.',
    deskRole: 'Structuring analyst',
    workflow: ['Read term sheet', 'Map observations', 'Build payoff table', 'Identify barriers', 'Write risk caveat'],
    lessons: [
      { n: '1.1', t: 'Term-sheet extraction', d: '14m', done: true },
      { n: '1.2', t: 'Coupon and autocall conditions', d: '20m', done: false, current: true },
      { n: '1.3', t: 'Protection barrier and redemption', d: '18m', done: false },
      { n: '2.1', t: 'Scenario table for clients and desk', d: '20m', done: false },
    ],
    modules: [
      { t: 'Term-sheet map', d: 'Translate legal/product wording into cash-flow conditions.' },
      { t: 'Scenario engine', d: 'Evaluate coupons, early redemption and final redemption path by path.' },
      { t: 'Risk decomposition', d: 'Separate client payoff appeal from desk barrier/gamma risk.' },
      { t: 'Communication', d: 'Write a clear explanation suitable for sales, risk and structuring.' },
    ],
    labs: [
      ['Autocall table', 'Build outcomes for up, flat and down paths.'],
      ['Barrier loss', 'Explain final redemption below protection barrier.'],
      ['Sales memo', 'Summarize upside, downside and key risk in plain language.'],
    ],
    resources: ['Structured products books', 'Autocall payoff builder', 'Term-sheet checklist'],
    relatedExerciseIds: ['autocall', 'barrier-knock-in'],
  },
  'fixed-income-bonds': {
    deskPromise: 'Price a bond and translate yield moves into duration, convexity and P&L.',
    deskRole: 'Fixed-income analyst',
    workflow: ['Read bond terms', 'Discount cash flows', 'Compute duration', 'Shock yield', 'Explain P&L'],
    lessons: [
      { n: '1.1', t: 'Bond cash-flow ticket', d: '10m', done: true },
      { n: '1.2', t: 'Clean price and yield', d: '18m', done: false, current: true },
      { n: '1.3', t: 'Duration and convexity', d: '18m', done: false },
      { n: '2.1', t: 'Rate shock P&L', d: '16m', done: false },
    ],
    modules: [
      { t: 'Cash-flow map', d: 'List coupon and principal cash flows before pricing.' },
      { t: 'Yield mechanics', d: 'Relate price and yield with a practical approximation.' },
      { t: 'Duration DV01', d: 'Convert yield shocks into money risk.' },
      { t: 'Desk memo', d: 'Explain why convexity matters for larger moves.' },
    ],
    labs: [
      ['Bond price', 'Price annual coupon bond from yield and maturity.'],
      ['Duration shock', 'Estimate P&L for +25bp and -25bp moves.'],
      ['Convexity note', 'Explain why duration-only approximation breaks.'],
    ],
    resources: ['Calcul obligataire PDF', 'Fixed Income Markets', 'Bond calculator'],
    relatedExerciseIds: ['bond-duration'],
  },
};

export const PRACTICE_EXERCISES = [
  {
    id: 'bs-eur-call',
    title: 'Quote a European Call',
    cat: 'Black-Scholes',
    level: 'L1',
    time: '20m',
    done: true,
    product: 'equity option',
    concept: 'Black-Scholes quote control',
    courseIds: ['black-scholes'],
    description: 'Price a vanilla call, check parity and produce a quote note.',
    objective: 'Produce a controlled Black-Scholes quote for a vanilla European option and explain the risk in desk language.',
    marketData: [
      ['Spot', '100'],
      ['Strike', '100'],
      ['Rate', '2%'],
      ['Volatility', '20%'],
      ['Maturity', '6 months'],
    ],
    steps: [
      'Compute d1 and d2 from the market inputs.',
      'Compute call and put prices.',
      'Check put-call parity.',
      'Explain delta and vega in one sentence each.',
      'Write a quote note with assumptions and limitations.',
    ],
    hints: ['Use annualized volatility.', 'Discount strike with exp(-rT).', 'Parity gap should be close to zero.'],
    starterCode: `from math import log, sqrt, exp
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    # compute d1, d2 and return call price
    pass

def bs_put(S, K, r, sigma, T):
    # use either closed form or put-call parity
    pass

print(bs_call(100, 100, 0.02, 0.20, 0.5))`,
    output: `>>> python exercise.py
Call price: 6.1207
Put price: 5.1257
Parity gap: 0.0000
Desk note: ATM call has delta slightly above 0.50 and positive vega.`,
    solution: `def bs_call(S, K, r, sigma, T):
    d1 = (log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqrt(T))
    d2 = d1 - sigma*sqrt(T)
    return S*norm.cdf(d1) - K*exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, sigma, T):
    return bs_call(S, K, r, sigma, T) - S + K*exp(-r*T)`,
    grading: [['Pricing', '3 pts'], ['Parity control', '2 pts'], ['Risk explanation', '3 pts'], ['Quote memo', '2 pts']],
  },
  {
    id: 'options-book-greeks',
    title: 'Attribute P&L on an Options Book',
    cat: 'Greeks',
    level: 'L3',
    time: '35m',
    done: false,
    product: 'equity options book',
    concept: 'delta gamma vega theta P&L',
    courseIds: ['greeks', 'hedging'],
    description: 'Compute delta-gamma-vega-theta P&L and recommend a hedge.',
    objective: 'Turn a Greek report into P&L attribution and an operational hedge decision.',
    marketData: [
      ['Delta', '+250k EUR per 1% spot'],
      ['Gamma', '-80k EUR per 1%^2'],
      ['Vega', '+120k EUR per vol point'],
      ['Theta', '-15k EUR per day'],
      ['Scenario', 'Spot -2%, vol +3 points, one day passes'],
    ],
    steps: [
      'Compute delta P&L using percent-point units.',
      'Compute gamma P&L using squared percent move.',
      'Compute vega and theta P&L.',
      'Add total scenario P&L.',
      'Identify the dominant risk and propose hedge action.',
    ],
    hints: ['Do not multiply 250k by -0.02 here.', 'Gamma uses move squared.', 'Short gamma loses under large spot moves.'],
    starterCode: `delta_per_1pct = 250_000
gamma_per_1pct2 = -80_000
vega_per_vol_pt = 120_000
theta_per_day = -15_000

spot_move_pct_points = -2
vol_move_points = 3

# compute pnl_delta, pnl_gamma, pnl_vega, pnl_theta, total`,
    output: `Delta P&L: -500,000 EUR
Gamma P&L: -320,000 EUR
Vega P&L: +360,000 EUR
Theta P&L: -15,000 EUR
Total: -475,000 EUR
Action: reduce short gamma or add convexity before monitoring vega hedge mismatch.`,
    solution: `pnl_delta = 250_000 * (-2)
pnl_gamma = -80_000 * ((-2) ** 2)
pnl_vega = 120_000 * 3
pnl_theta = -15_000
total = pnl_delta + pnl_gamma + pnl_vega + pnl_theta`,
    grading: [['Unit handling', '3 pts'], ['P&L attribution', '3 pts'], ['Risk diagnosis', '2 pts'], ['Hedge decision', '2 pts']],
  },
  {
    id: 'swap-dv01',
    title: 'Shock a EUR 5Y Swap Book',
    cat: 'Rates',
    level: 'L2',
    time: '30m',
    done: false,
    product: 'EUR interest-rate swap',
    concept: 'PV DV01 curve shock',
    courseIds: ['rates-swaps', 'yield-curves'],
    description: 'Estimate swap PV, DV01 and P&L under a parallel curve move.',
    objective: 'Convert a swap ticket into PV, DV01 and hedge direction.',
    marketData: [
      ['Position', 'Payer EUR 5Y swap'],
      ['Notional', '100m EUR'],
      ['Fixed coupon', '3.20%'],
      ['Current par rate', '3.00%'],
      ['Annuity', '4.55'],
      ['Shock', '+10bp parallel'],
    ],
    steps: [
      'Compute PV from coupon gap times annuity times notional.',
      'Compute DV01 from notional and annuity.',
      'Estimate shock P&L for +10bp.',
      'State whether payer benefits from rates up or down.',
      'Suggest hedge direction.',
    ],
    hints: ['1bp = 0.0001.', 'DV01 approx notional * annuity * 1bp.', 'A payer swap gains when rates rise.'],
    starterCode: `notional = 100_000_000
fixed = 0.032
par = 0.030
annuity = 4.55
shock_bp = 10

# pv = ?
# dv01 = ?
# shock_pnl = ?`,
    output: `PV approx: +910,000 EUR
DV01: 45,500 EUR/bp
Shock P&L for +10bp: +455,000 EUR
Action: monitor curve-shape risk; parallel hedge can use offsetting receiver/pay fixed exposure.`,
    solution: `pv = (fixed - par) * annuity * notional
dv01 = notional * annuity * 0.0001
shock_pnl = dv01 * 10`,
    grading: [['PV approximation', '3 pts'], ['DV01', '3 pts'], ['Shock sign', '2 pts'], ['Hedge note', '2 pts']],
  },
  {
    id: 'barrier-knock-in',
    title: 'Map Barrier Option Gap Risk',
    cat: 'Barrier',
    level: 'L3',
    time: '35m',
    done: false,
    product: 'FX barrier option',
    concept: 'knock-out payoff and gap risk',
    courseIds: ['exotics', 'structured-products'],
    description: 'Evaluate barrier scenarios and explain why path dependence changes risk.',
    objective: 'Build a payoff scenario table for a down-and-out FX call and identify gap risk near the barrier.',
    marketData: [
      ['Spot', 'EUR/USD 1.0800'],
      ['Strike', '1.1000'],
      ['Barrier', 'Down-and-out 1.0000'],
      ['Notional', 'EUR 10m'],
      ['Scenarios', '1.0500, 1.0000, 1.2000 without knock-out'],
    ],
    steps: [
      'State the activation condition.',
      'Compute payoff in each scenario.',
      'Identify when the option is knocked out.',
      'Explain the discontinuity at the barrier.',
      'Write the monitoring trigger for the desk.',
    ],
    hints: ['Terminal spot is not enough if barrier was touched.', 'At the barrier the option ceases to exist.', 'Gap risk is not a smooth Greek.'],
    starterCode: `notional = 10_000_000
strike = 1.10
barrier = 1.00
scenarios = [1.05, 1.00, 1.20]

def payoff(spot, knocked_out=False):
    # return USD payoff approximation
    pass`,
    output: `S=1.0500: payoff 0
S=1.0000: knocked out, payoff 0
S=1.2000 no knock-out: payoff 1,000,000 USD approx
Action: escalate monitoring as spot approaches barrier; delta hedge is unreliable around a jump to knock-out.`,
    solution: `def payoff(spot, knocked_out=False):
    if knocked_out or spot <= barrier:
        return 0
    return max(spot - strike, 0) * notional`,
    grading: [['Path condition', '3 pts'], ['Scenario payoff', '3 pts'], ['Gap risk explanation', '2 pts'], ['Monitoring action', '2 pts']],
  },
  {
    id: 'smile-fit',
    title: 'Clean and Fit a Vol Smile',
    cat: 'Volatility',
    level: 'L3',
    time: '40m',
    done: false,
    product: 'equity index options',
    concept: 'smile cleaning and SVI intuition',
    courseIds: ['implied-vol', 'vol-products'],
    description: 'Clean option quotes and fit a usable implied-vol smile slice.',
    objective: 'Turn noisy option prices into an implied-vol slice and explain skew.',
    marketData: [
      ['Underlying', 'SPX'],
      ['Tenor', '30d'],
      ['Moneyness', '80%, 90%, 100%, 110%, 120%'],
      ['Task', 'Clean impossible quotes and fit smile curvature'],
    ],
    steps: [
      'Reject quotes outside basic price bounds.',
      'Invert remaining prices to implied vol.',
      'Fit a smooth smile slice.',
      'Identify skew direction.',
      'Explain what demand or protection pressure could drive it.',
    ],
    hints: ['Deep OTM puts often trade rich in equity indices.', 'Do not fit crossed or stale quotes.', 'A smooth fit can still be economically wrong.'],
    starterCode: `quotes = [
    {"moneyness": 0.80, "iv": 0.29},
    {"moneyness": 0.90, "iv": 0.23},
    {"moneyness": 1.00, "iv": 0.18},
    {"moneyness": 1.10, "iv": 0.16},
    {"moneyness": 1.20, "iv": 0.17},
]

# fit a simple quadratic in log-moneyness`,
    output: `Smile cleaned: 5 quotes retained
Skew: downside vol > ATM vol > upside vol
Action: flag downside protection demand and stress put-spread hedges.`,
    solution: `# Minimal route:
# x = log(K/S), y = total variance or IV
# fit y = a + b*x + c*x*x
# inspect b < 0 for equity-index downside skew`,
    grading: [['Data cleaning', '2 pts'], ['IV fit', '3 pts'], ['Skew interpretation', '3 pts'], ['Desk action', '2 pts']],
  },
  {
    id: 'mc-asian',
    title: 'Monte Carlo an Asian Option',
    cat: 'Monte Carlo',
    level: 'L3',
    time: '35m',
    done: true,
    product: 'Asian option',
    concept: 'path simulation and confidence interval',
    courseIds: ['monte-carlo'],
    description: 'Simulate average-price payoff and report confidence interval.',
    objective: 'Price an arithmetic Asian call with Monte Carlo and report uncertainty.',
    marketData: [
      ['Spot', '100'],
      ['Strike', '100'],
      ['Rate', '2%'],
      ['Volatility', '20%'],
      ['Maturity', '1y monthly monitoring'],
      ['Paths', '100,000'],
    ],
    steps: [
      'Simulate GBM monthly paths.',
      'Compute arithmetic average spot.',
      'Compute discounted payoff.',
      'Estimate standard error.',
      'Report 95% confidence interval and caveats.',
    ],
    hints: ['Use a fixed random seed.', 'Average along each path, not across paths first.', 'Confidence interval matters.'],
    starterCode: `import numpy as np

def price_asian_call(S0, K, r, sigma, T, steps, paths, seed=7):
    rng = np.random.default_rng(seed)
    # simulate paths and return price, stderr
    pass`,
    output: `Asian call price: 5.32
Std error: 0.02
95% CI: [5.28, 5.36]
Action: report model and discretization assumptions with the quote.`,
    solution: `# Generate normal shocks, evolve GBM, average each path,
# payoff = max(avg - K, 0), price = exp(-rT) * mean(payoff),
# stderr = exp(-rT) * std(payoff) / sqrt(paths).`,
    grading: [['Simulation', '3 pts'], ['Payoff logic', '2 pts'], ['Uncertainty', '3 pts'], ['Caveats', '2 pts']],
  },
  {
    id: 'curve-boot',
    title: 'Bootstrap a Zero Curve',
    cat: 'Yield Curves',
    level: 'L2',
    time: '30m',
    done: false,
    product: 'interest-rate curve',
    concept: 'discount factors bootstrapping',
    courseIds: ['yield-curves', 'rates-swaps'],
    description: 'Build discount factors from simple market instruments.',
    objective: 'Recover discount factors from quoted rates and use them for pricing.',
    marketData: [
      ['1Y swap', '3.00%'],
      ['2Y swap', '3.20%'],
      ['3Y swap', '3.35%'],
      ['Fixed leg', 'Annual'],
    ],
    steps: [
      'Convert quotes to decimal rates.',
      'Bootstrap each maturity recursively.',
      'Check discount factors decrease with maturity.',
      'Compute zero rates.',
      'Explain one limitation of the simple setup.',
    ],
    hints: ['Use previous discount factors for the fixed leg.', 'Monotonicity is a sanity check.', 'Real desks need day count and calendars.'],
    starterCode: `swap_rates = {1: 0.030, 2: 0.032, 3: 0.0335}
dfs = {}

# bootstrap annual discount factors`,
    output: `DF(1Y): 0.9709
DF(2Y): 0.9384
DF(3Y): 0.9056
Action: use the curve for rough pricing only; production requires conventions and interpolation controls.`,
    solution: `# For maturity n:
# par = (1 - DF_n) / sum_{i=1..n} DF_i
# DF_n = (1 - par * sum_previous_dfs) / (1 + par)`,
    grading: [['Bootstrap recursion', '4 pts'], ['Sanity checks', '2 pts'], ['Zero rates', '2 pts'], ['Limitations', '2 pts']],
  },
  {
    id: 'delta-hedge',
    title: 'Run a Daily Delta Hedge',
    cat: 'Greeks',
    level: 'L2',
    time: '25m',
    done: false,
    product: 'option hedge',
    concept: 'delta rebalancing',
    courseIds: ['greeks', 'hedging'],
    description: 'Compute hedge shares and explain rebalancing P&L.',
    objective: 'Size a delta hedge and explain why it must be rebalanced.',
    marketData: [
      ['Option position', 'Long 1,000 calls'],
      ['Contract multiplier', '100 shares'],
      ['Delta', '0.54'],
      ['Next-day delta', '0.61'],
    ],
    steps: [
      'Compute initial share hedge.',
      'Compute new hedge after delta changes.',
      'State rebalance trade.',
      'Explain why gamma causes delta drift.',
      'Mention transaction-cost tradeoff.',
    ],
    hints: ['Long calls have positive delta.', 'To hedge long delta, sell shares.', 'Gamma changes delta as spot moves.'],
    starterCode: `contracts = 1000
multiplier = 100
delta0 = 0.54
delta1 = 0.61

# shares_to_sell_0 = ?
# rebalance_trade = ?`,
    output: `Initial hedge: sell 54,000 shares
New hedge target: sell 61,000 shares
Rebalance: sell 7,000 additional shares
Action: monitor gamma and transaction cost; hedge frequency is a desk decision.`,
    solution: `shares0 = contracts * multiplier * delta0
shares1 = contracts * multiplier * delta1
rebalance = shares1 - shares0`,
    grading: [['Hedge sign', '3 pts'], ['Rebalance math', '3 pts'], ['Gamma explanation', '2 pts'], ['Cost tradeoff', '2 pts']],
  },
  {
    id: 'iv-newton',
    title: 'Implied Vol via Newton-Raphson',
    cat: 'Volatility',
    level: 'L2',
    time: '25m',
    done: true,
    product: 'vanilla option',
    concept: 'implied volatility inversion',
    courseIds: ['implied-vol', 'black-scholes'],
    description: 'Recover implied volatility from a market option price.',
    objective: 'Invert Black-Scholes using Newton-Raphson and explain failure modes.',
    marketData: [
      ['Call market price', '8.00'],
      ['Spot', '100'],
      ['Strike', '100'],
      ['Rate', '2%'],
      ['Maturity', '6 months'],
    ],
    steps: [
      'Start from a reasonable volatility guess.',
      'Compute price and vega.',
      'Update sigma with price error divided by vega.',
      'Stop on tolerance.',
      'Explain what happens when vega is too low.',
    ],
    hints: ['Newton step is sigma -= error / vega.', 'Use vega per vol unit, not per vol point.', 'Deep ITM/OTM options can be unstable.'],
    starterCode: `def implied_vol(target_price, S, K, r, T, guess=0.20):
    sigma = guess
    for _ in range(20):
        # compute price and vega
        # update sigma
        pass
    return sigma`,
    output: `Implied volatility: 25.43%
Iterations: 4
Action: flag low-vega options for robust solver or quote filtering.`,
    solution: `# sigma_next = sigma - (bs_price(sigma) - target_price) / vega_unit
# clamp sigma to positive range and stop when abs(error) < tolerance`,
    grading: [['Newton update', '4 pts'], ['Vega units', '2 pts'], ['Convergence controls', '2 pts'], ['Failure explanation', '2 pts']],
  },
  {
    id: 'autocall',
    title: 'Build an Autocall Scenario Table',
    cat: 'Exotic',
    level: 'L4',
    time: '55m',
    done: false,
    product: 'autocallable note',
    concept: 'coupon and redemption scenarios',
    courseIds: ['exotics', 'structured-products'],
    description: 'Map coupons, autocall events and final redemption under scenarios.',
    objective: 'Translate a structured-product term sheet into cash-flow scenarios.',
    marketData: [
      ['Autocall level', '100% initial'],
      ['Coupon barrier', '70%'],
      ['Protection barrier', '60%'],
      ['Coupon', '8% p.a. paid quarterly if condition met'],
      ['Maturity', '2 years'],
    ],
    steps: [
      'List each observation date condition.',
      'Build up/flat/down path scenarios.',
      'Compute coupon payments.',
      'Determine early redemption.',
      'Explain client payoff and desk risk.',
    ],
    hints: ['Autocall ends the note early.', 'Coupon memory changes cash flows.', 'Protection barrier matters at final observation.'],
    starterCode: `paths = {
    "up": [1.02, 1.04],
    "flat": [0.95, 0.99, 1.01],
    "down": [0.82, 0.68, 0.55],
}

# produce cash-flow table`,
    output: `Up path: autocall at first observation, coupon paid
Flat path: coupon paid while above barrier, possible later autocall
Down path: missed coupon below 70%, capital loss if final below 60%
Action: communicate path dependency and downside participation clearly.`,
    solution: `# For each path and observation:
# if level >= autocall: pay coupon + redeem 100 and stop
# elif level >= coupon_barrier: pay coupon
# at maturity: if final < protection_barrier, redeem final performance`,
    grading: [['Cash-flow map', '4 pts'], ['Scenario logic', '3 pts'], ['Client explanation', '2 pts'], ['Desk risk', '1 pt']],
  },
  {
    id: 'cds-cs01',
    title: 'Measure CDS CS01 and Carry',
    cat: 'Credit',
    level: 'L3',
    time: '30m',
    done: false,
    product: 'single-name CDS',
    concept: 'CS01 spread shock carry',
    courseIds: ['credit-derivatives'],
    description: 'Compute credit spread sensitivity and explain carry versus widening risk.',
    objective: 'Estimate CS01, spread-shock P&L and carry for a CDS position.',
    marketData: [
      ['Notional', '50m'],
      ['Spread', '120bp'],
      ['Risky annuity', '4.2'],
      ['Spread shock', '+25bp'],
    ],
    steps: [
      'Compute annual carry from spread and notional.',
      'Compute CS01 from notional, risky annuity and 1bp.',
      'Compute P&L for +25bp spread widening.',
      'Explain whether protection buyer gains or loses.',
      'Write risk action.',
    ],
    hints: ['CS01 is per basis point.', 'Sign depends on buy/sell protection.', 'Carry is not the same as mark-to-market.'],
    starterCode: `notional = 50_000_000
spread = 0.012
risky_annuity = 4.2
shock_bp = 25

# carry = ?
# cs01 = ?
# shock_pnl = ?`,
    output: `Annual carry: 600,000 EUR
CS01: 21,000 EUR/bp
Spread shock PV move: 525,000 EUR before position sign
Action: monitor jump/default risk; carry can be overwhelmed by widening.`,
    solution: `carry = notional * spread
cs01 = notional * risky_annuity * 0.0001
shock_move = cs01 * shock_bp`,
    grading: [['Carry', '2 pts'], ['CS01', '3 pts'], ['Shock P&L', '3 pts'], ['Risk note', '2 pts']],
  },
  {
    id: 'parametric-var',
    title: 'Compute a Desk VaR Limit',
    cat: 'Risk',
    level: 'L2',
    time: '25m',
    done: false,
    product: 'portfolio',
    concept: 'parametric VaR limit',
    courseIds: ['market-risk-var'],
    description: 'Estimate one-day VaR and decide whether to escalate limit usage.',
    objective: 'Compute parametric VaR and translate it into a desk limit action.',
    marketData: [
      ['Portfolio value', '20m'],
      ['Daily volatility', '2%'],
      ['Confidence', '95%'],
      ['Horizon', '1 day'],
    ],
    steps: [
      'Select the normal quantile for 95%.',
      'Compute one-day VaR.',
      'Compare with a hypothetical 600k limit.',
      'Add one stress scenario.',
      'Recommend monitor, hedge or reduce.',
    ],
    hints: ['95% one-sided normal quantile is about 1.65.', 'VaR is not a worst-case loss.', 'Stress testing complements VaR.'],
    starterCode: `portfolio = 20_000_000
daily_vol = 0.02
z_95 = 1.645

# var_95 = ?`,
    output: `VaR 95%: 658,000 EUR
Limit 600,000 EUR: breached
Action: escalate and reduce/hedge exposure; add stress loss for a -5% move.`,
    solution: `var_95 = portfolio * daily_vol * z_95`,
    grading: [['VaR formula', '3 pts'], ['Limit interpretation', '3 pts'], ['Stress overlay', '2 pts'], ['Action', '2 pts']],
  },
  {
    id: 'bond-duration',
    title: 'Estimate Bond DV01 from Duration',
    cat: 'Rates',
    level: 'L2',
    time: '25m',
    done: false,
    product: 'fixed-income bond',
    concept: 'duration DV01 shock P&L',
    courseIds: ['fixed-income-bonds'],
    description: 'Use duration to estimate bond price sensitivity under yield shocks.',
    objective: 'Translate a bond position into DV01 and rate-shock P&L.',
    marketData: [
      ['Market value', '25m EUR'],
      ['Modified duration', '6.8'],
      ['Yield shock', '+25bp'],
    ],
    steps: [
      'Compute DV01 from market value and duration.',
      'Estimate P&L for +25bp.',
      'Explain sign for long bond position.',
      'State how convexity changes larger shocks.',
      'Write a desk risk note.',
    ],
    hints: ['Price falls when yield rises for a long bond.', 'DV01 = MV * duration * 1bp.', 'Convexity helps for large moves.'],
    starterCode: `market_value = 25_000_000
mod_duration = 6.8
shock_bp = 25

# dv01 = ?
# pnl = ?`,
    output: `DV01: 17,000 EUR/bp
P&L for +25bp: -425,000 EUR
Action: hedge duration with futures or swaps; convexity matters for larger shocks.`,
    solution: `dv01 = market_value * mod_duration * 0.0001
pnl = -dv01 * shock_bp`,
    grading: [['DV01', '3 pts'], ['Shock P&L sign', '3 pts'], ['Convexity explanation', '2 pts'], ['Risk note', '2 pts']],
  },
];

export const GENERATOR_PRESETS = [
  {
    id: 'options-book',
    label: 'Options book',
    topic: 'Options book risk management',
    product: 'equity options book',
    concept: 'delta gamma vega theta hedging',
    difficulty: 'intermediate',
    exercise_format: 'risk_management',
    free_prompt: 'Book delta +250k EUR par 1%, gamma -80k EUR par 1%^2, vega +120k EUR par vol point, theta -15k EUR par jour. Scenario spot -2%, vol +3 points, un jour passe. Construire P&L, diagnostic et hedge.',
  },
  {
    id: 'rates-swap',
    label: 'Swap DV01',
    topic: 'Interest-rate swap valuation and DV01',
    product: 'EUR interest rate swap',
    concept: 'PV par rate DV01 hedge PnL',
    difficulty: 'intermediate',
    exercise_format: 'risk_management',
    free_prompt: 'Payer swap EUR 5Y, notionnel 100m, fixed coupon 3.20%, par swap rate actuel 3.00%, annuity approx 4.55, la courbe monte de 10bp. Calculer PV, DV01, P&L et couverture.',
  },
  {
    id: 'barrier-fx',
    label: 'FX barrier',
    topic: 'FX barrier option desk case',
    product: 'FX barrier option',
    concept: 'down-and-out call gap risk',
    difficulty: 'advanced',
    exercise_format: 'case_study',
    free_prompt: 'EUR/USD spot 1.0800, strike 1.1000, barriere down-and-out 1.0000, notionnel EUR 10m. Scenarios spot 1.0500, 1.0000, 1.2000 sans knock-out. Evaluer payoff et gap risk.',
  },
  {
    id: 'credit-cds',
    label: 'CDS CS01',
    topic: 'CDS spread risk',
    product: 'single-name CDS',
    concept: 'CS01 carry spread shock',
    difficulty: 'intermediate',
    exercise_format: 'risk_management',
    free_prompt: 'CDS notionnel 50m spread 120bp risky annuity 4.2 shock 25bp. Calculer CS01, carry et P&L spread.',
  },
  {
    id: 'risk-var',
    label: 'VaR limit',
    topic: 'Parametric VaR desk limit',
    product: 'portfolio',
    concept: 'VaR stress risk limit',
    difficulty: 'beginner',
    exercise_format: 'quantitative_problem',
    free_prompt: 'VaR portefeuille 20m volatilite 2% confiance 95% horizon 1 jour. Calculer VaR, comparer a une limite 600k, proposer action risk.',
  },
];

export function getPracticeApiBase() {
  const raw = import.meta.env.VITE_TPL_RAG_API_URL || 'http://127.0.0.1:8000';
  return raw.replace(/\/+$/, '');
}

export function getCourseBlueprint(courseId) {
  return COURSE_BLUEPRINTS[courseId] || null;
}

export function exerciseDescription(exercise) {
  if (exercise.description) return exercise.description;
  if (exercise.generated) return 'AI-generated desk case with worked correction and source context.';
  const byCategory = {
    'Black-Scholes': 'Price options under risk-neutral measure with quote controls.',
    Greeks: 'Compute hedge ratios and rebalance a synthetic position.',
    Volatility: 'Clean prices and infer volatility from market data.',
    'Monte Carlo': 'Estimate price via sampled paths with uncertainty controls.',
    Barrier: 'Handle path-dependent activation and knock-out conditions.',
    'Yield Curves': 'Bootstrap discount factors from quoted instruments.',
    Exotic: 'Implement payoff logic for path-dependent products.',
    Rates: 'Translate rates moves into PV, DV01 and hedge actions.',
    Credit: 'Measure spread risk and carry on credit instruments.',
    Risk: 'Turn portfolio volatility into limit and escalation decisions.',
  };
  return byCategory[exercise.cat] || 'Desk-style practice case with calculation and decision.';
}

export function loadGeneratedExercises() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GENERATED_EXERCISES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGeneratedExercise(exercise) {
  const existing = loadGeneratedExercises();
  const next = [exercise, ...existing.filter((item) => item.id !== exercise.id)].slice(0, 30);
  try {
    window.localStorage.setItem(GENERATED_EXERCISES_KEY, JSON.stringify(next));
  } catch {
    // Storage can fail in private browsing; the caller still receives the item.
  }
  return next;
}

export function getExerciseById(id) {
  return loadGeneratedExercises().find((item) => item.id === id)
    || PRACTICE_EXERCISES.find((item) => item.id === id)
    || null;
}

export async function generateAiDeskExercise(input) {
  const request = normalizeGeneratorInput(input);
  const payload = {
    topic: request.topic || null,
    product: request.product || null,
    concept: request.concept || null,
    free_prompt: request.free_prompt || null,
    difficulty: request.difficulty,
    exercise_format: request.exercise_format,
    number_of_questions: 5,
    target_audience: 'learners who want market-finance desk practice',
    require_calculations: true,
    top_k: 8,
    language: 'fr',
  };

  try {
    const response = await fetch(`${getPracticeApiBase()}/agent/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || `RAG backend returned ${response.status}`);
    }
    return normalizeGeneratedExercise(data, request, 'rag');
  } catch (error) {
    return buildLocalDeskExercise(request, error);
  }
}

function normalizeGeneratorInput(input) {
  return {
    topic: (input.topic || 'Desk case pratique').trim(),
    product: (input.product || 'market finance product').trim(),
    concept: (input.concept || 'pricing and risk').trim(),
    difficulty: input.difficulty || 'intermediate',
    exercise_format: input.exercise_format || 'mixed',
    free_prompt: (input.free_prompt || '').trim(),
  };
}

function normalizeGeneratedExercise(data, request, engine) {
  const now = new Date().toISOString();
  const category = categorize(request);
  return {
    id: `ai-${Date.now().toString(36)}-${slugify(request.product || request.topic).slice(0, 18)}`,
    title: data.title || `Cas pratique - ${request.topic}`,
    cat: category,
    level: levelLabel(request.difficulty),
    time: timeForDifficulty(request.difficulty),
    done: false,
    generated: true,
    engine,
    createdAt: now,
    product: request.product,
    concept: request.concept,
    description: `Generated from ${engine === 'rag' ? 'the local RAG engine' : 'the browser fallback'} for ${request.product}.`,
    content: data.content || '',
    sources: data.sources || [],
    metadata: data.metadata || {},
    request,
  };
}

function buildLocalDeskExercise(request, error) {
  const family = detectFamily(request);
  const templates = {
    options: {
      title: 'Cas pratique - Options book Greeks',
      cat: 'Greeks',
      market: [
        ['Delta', '+250k EUR par 1%'],
        ['Gamma', '-80k EUR par 1%^2'],
        ['Vega', '+120k EUR par vol point'],
        ['Theta', '-15k EUR par jour'],
        ['Scenario', 'Spot -2%, vol +3 points, one day passes'],
      ],
      correction: [
        'P&L delta = 250k * (-2) = -500,000 EUR.',
        'P&L gamma = -80k * (-2)^2 = -320,000 EUR.',
        'P&L vega = 120k * 3 = +360,000 EUR.',
        'P&L theta = -15,000 EUR.',
        'P&L total = -475,000 EUR.',
        'Decision: reduce short gamma or buy convexity before relying on a simple delta hedge.',
      ],
    },
    rates: {
      title: 'Cas pratique - Swap DV01',
      cat: 'Rates',
      market: [
        ['Position', 'Payer swap EUR 5Y'],
        ['Notional', '100m EUR'],
        ['Fixed coupon', '3.20%'],
        ['Current par rate', '3.00%'],
        ['Annuity', '4.55'],
        ['Shock', '+10bp parallel'],
      ],
      correction: [
        'PV approx = (3.20% - 3.00%) * 4.55 * 100m = +910,000 EUR.',
        'DV01 = 100m * 4.55 * 0.0001 = 45,500 EUR/bp.',
        'Shock P&L = 45,500 * 10 = +455,000 EUR for a payer swap.',
        'Decision: hedge residual curve risk, not only the parallel DV01.',
      ],
    },
    credit: {
      title: 'Cas pratique - CDS CS01',
      cat: 'Credit',
      market: [
        ['Notional', '50m'],
        ['Spread', '120bp'],
        ['Risky annuity', '4.2'],
        ['Shock', '+25bp'],
      ],
      correction: [
        'Annual carry = 50m * 120bp = 600,000 per year.',
        'CS01 = 50m * 4.2 * 0.0001 = 21,000 per bp.',
        'Spread shock move = 21,000 * 25 = 525,000 before position sign.',
        'Decision: carry is not enough compensation if widening/default risk is accelerating.',
      ],
    },
    risk: {
      title: 'Cas pratique - VaR limit',
      cat: 'Risk',
      market: [
        ['Portfolio', '20m'],
        ['Daily vol', '2%'],
        ['Confidence', '95%'],
        ['Limit', '600k'],
      ],
      correction: [
        'VaR 95% = 20m * 2% * 1.645 = 658,000.',
        'The 600k limit is breached.',
        'Decision: escalate, reduce exposure or hedge; add a stress scenario because VaR is not a worst-case loss.',
      ],
    },
  };
  const selected = templates[family] || templates.options;
  const marketLines = selected.market.map(([k, v]) => `- ${k}: ${v}`).join('\n');
  const correctionLines = selected.correction.map((line, idx) => `${idx + 1}. ${line}`).join('\n');
  const promptLine = request.free_prompt
    ? `\n## Contrainte utilisateur\n${request.free_prompt}\n`
    : '';
  const content = `# ${selected.title}

## Brief de desk
Tu es junior analyst sur un desk. L'objectif n'est pas de reciter le cours: tu dois produire un calcul exploitable, une interpretation risque et une action.

## Produit et concept
- Produit: ${request.product}
- Concept: ${request.concept}
- Niveau: ${request.difficulty}
${promptLine}
## Donnees de marche
${marketLines}

## Mission
1. Identifier le risque principal.
2. Poser les hypotheses manquantes.
3. Faire le calcul numerique avec les bonnes unites.
4. Interpreter le resultat comme un trader ou un risk manager.
5. Proposer une action: hedge, monitor, reduce, escalate or no-trade.

## Corrige commente
${correctionLines}

## Grille d'evaluation
- Calculs et unites: 40%.
- Diagnostic risque: 25%.
- Decision operationnelle: 25%.
- Communication claire: 10%.

## Sources
Generation locale de secours. Lance le backend RAG sur http://127.0.0.1:8000 pour ancrer l'exercice dans les PDFs de ThePricingLibrary.`;

  const normalized = normalizeGeneratedExercise(
    {
      title: selected.title,
      content,
      sources: [],
      metadata: {
        fallback_reason: error instanceof Error ? error.message : String(error || 'unknown'),
      },
    },
    request,
    'fallback'
  );
  normalized.cat = selected.cat;
  normalized.description = 'Local fallback desk case generated because the RAG backend was unavailable.';
  return normalized;
}

function detectFamily(request) {
  const text = `${request.topic} ${request.product} ${request.concept} ${request.free_prompt}`.toLowerCase();
  if (/(swap|rates|taux|dv01|bond|curve|courbe)/.test(text)) return 'rates';
  if (/(cds|credit|spread|cs01|default)/.test(text)) return 'credit';
  if (/(var|risk|portfolio|limit|stress)/.test(text)) return 'risk';
  return 'options';
}

function categorize(request) {
  const family = detectFamily(request);
  const concept = `${request.product} ${request.concept}`.toLowerCase();
  if (family === 'rates') return concept.includes('curve') ? 'Yield Curves' : 'Rates';
  if (family === 'credit') return 'Credit';
  if (family === 'risk') return 'Risk';
  if (/barrier|barriere|autocall|exotic|structured/.test(concept)) return 'Exotic';
  if (/vol|smile|skew/.test(concept)) return 'Volatility';
  if (/greek|delta|gamma|vega|theta/.test(concept)) return 'Greeks';
  return 'Black-Scholes';
}

function levelLabel(difficulty) {
  const map = {
    beginner: 'L1',
    intermediate: 'L2',
    advanced: 'L3',
    expert: 'L4',
  };
  return map[difficulty] || 'L2';
}

function timeForDifficulty(difficulty) {
  const map = {
    beginner: '20m',
    intermediate: '35m',
    advanced: '50m',
    expert: '65m',
  };
  return map[difficulty] || '35m';
}

function slugify(value) {
  return String(value || 'exercise')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'exercise';
}
