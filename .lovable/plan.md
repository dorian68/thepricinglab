

# Tools Section — Institutional-Grade Upgrade Plan

## Audit Summary

### 5 pages linked from Tools dropdown:

| Route | Component | Status | Priority |
|---|---|---|---|
| `/tools/volatility-calculator` | VolatilityCalculator.tsx | Functional but no hero, no page wrapper, no Helmet, no framing | P0 |
| `/tools/black-scholes` | BlackScholesCalculator.tsx | Best of the 5 — has Greeks charts. Still no hero, no methodology, no trust layer | P1 |
| `/tools/monte-carlo` | MonteCarloSimulator.tsx | **Completely broken** — shows maintenance placeholder with wrong brand "The Pricing Lab" | P0 |
| `/tools/model-calibration` | ModelCalibration.tsx | Functional but raw — no hero, no Helmet, hardcoded French, no framing | P1 |
| `/tools/payoff-visualizer` | PayoffVisualizer.tsx | Best structured — has hero + info card. Needs methodology/trust/CTA | P1 |

Also: `/tools` index page (Tools.tsx) — decent card layout but title says "The Trading Lab", weak FAQ, no trust signals.

---

### Core Problems Shared Across All Tools

1. **No consistent page structure** — VolatilityCalculator and ModelCalibration are raw components with no page wrapper, no `<Helmet>`, no hero section. They render directly inside the route as bare widgets.
2. **No methodology/trust layer** — Zero pages explain their model assumptions, limitations, or scope.
3. **No cross-linking** — No "Related tools", "Learn the theory", or ecosystem bridges.
4. **No CTA** — No conversion hook on any tool page.
5. **Monte Carlo is dead** — Shows a maintenance banner. Looks broken/abandoned to any visitor.
6. **Inconsistent brand** — "The Trading Lab" in Tools.tsx title, "The Pricing Lab" in MonteCarloSimulator.
7. **No SEO metadata** — VolatilityCalculator, ModelCalibration, BlackScholesCalculator have no `<Helmet>`.
8. **Tools dropdown descriptions are generic** — "Historical volatility calculation" / "Options pricing" / "Trajectories simulation" don't signal professional utility.

---

## Implementation Plan

### Phase 1: Create reusable institutional components

Create 3 shared components used across all tool pages:

**A. `ToolPageLayout`** — Wraps every tool page with:
- `<Helmet>` with title/description/canonical
- Hero section (title, value prop, supporting text)
- Main content slot
- Methodology/assumptions section
- Related resources section (links to courses/blog/other tools)
- CTA footer section
- Educational disclaimer

**B. `MethodologySection`** — Reusable block:
- Model name, assumptions, scope, limitations
- Collapsible for detail

**C. `RelatedResources`** — Contextual cross-links:
- Related courses, blog posts, adjacent tools
- Clean card layout

### Phase 2: Upgrade each tool page

#### 1. VolatilityCalculator → wrap in ToolPageLayout
- Add Helmet (title: "Historical Volatility Calculator | The Pricing Library")
- Add hero: "Historical Volatility Calculator" / "Measure and analyze realized volatility across assets and time horizons"
- Add methodology section explaining close-to-close estimator, rolling window, annualization factor
- Add related resources: implied vol course, vol products course, Black-Scholes tool
- Add CTA footer

#### 2. BlackScholesCalculator → wrap in ToolPageLayout
- Add Helmet
- Add hero: "Black-Scholes Option Pricer" / "Price European options and compute Greeks with the analytical Black-Scholes-Merton framework"
- Methodology: GBM assumption, European exercise only, continuous dividend yield, constant vol
- Related: Greeks course, implied vol course, payoff visualizer
- Already has strong Greeks charts — preserve

#### 3. MonteCarloSimulator → rebuild from maintenance state
- Replace the broken maintenance placeholder with a proper institutional page
- Since the actual simulator Python backend is broken, create a **well-framed informational page** that:
  - Shows what the tool does (GBM simulation, jump-diffusion, VaR)
  - Shows a static demo/preview of expected outputs
  - Has a "Coming Soon" state that looks intentional and premium, not broken
  - Links to Monte Carlo course
  - Fix brand to "The Pricing Library"

#### 4. ModelCalibration → wrap in ToolPageLayout
- Add Helmet
- Add hero: "Volatility Model Calibration" / "Calibrate Black, SABR, and Heston models to implied volatility surfaces"
- Methodology: objective function (RMSE), synthetic data for demo, model parameter constraints
- Related: implied vol course, vol surface tool (PRO), Black-Scholes tool

#### 5. PayoffVisualizer → enhance with ToolPageLayout
- Already has hero — standardize it to use ToolPageLayout pattern
- Add methodology section: payoff = intrinsic value at expiry, Greeks via BS model
- Add related resources: strategy builder, Greeks course, exotic options course
- Add CTA footer

### Phase 3: Upgrade Tools index page & dropdown

#### Tools.tsx index page:
- Fix title from "The Trading Lab" to "The Pricing Library"
- Improve hero copy to be institution-grade
- Fix FAQ to be actually interactive (currently buttons do nothing — `onClick={() => {}}`)

#### ToolsMenu.tsx dropdown:
- Upgrade descriptions to be more specific and outcome-oriented:
  - "Historical volatility calculation" → "Realized vol estimation & rolling analysis"
  - "Options pricing" → "European option pricing & Greeks analytics"
  - "Trajectories simulation" → "Stochastic path simulation & VaR computation"
  - "Calibration and optimization" → "SABR, Heston & Black model fitting"
  - "Options strategies construction" → "Multi-leg strategy payoff analysis"

---

## Files to create:
- `src/components/tools/ToolPageLayout.tsx` — shared page wrapper
- `src/components/tools/MethodologySection.tsx` — methodology block
- `src/components/tools/RelatedResources.tsx` — cross-links block

## Files to modify:
- `src/components/tools/VolatilityCalculator.tsx` — wrap with layout, add Helmet
- `src/components/tools/BlackScholesCalculator.tsx` — wrap with layout, add Helmet
- `src/components/tools/MonteCarloSimulator.tsx` — rebuild as premium "coming soon"
- `src/components/tools/ModelCalibration.tsx` — wrap with layout, add Helmet
- `src/pages/tools/PayoffVisualizer.tsx` — standardize with shared pattern
- `src/pages/Tools.tsx` — fix brand, improve hero, fix FAQ interactivity
- `src/components/navigation/ToolsMenu.tsx` — upgrade descriptions

## No breaking changes:
- All routes preserved
- All existing calculator logic preserved
- All existing chart/Greeks functionality preserved
- Only wrapping components with additional structure

