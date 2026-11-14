---
slug: vanilla-options-quote-preview
topic: Black-Scholes public preview
product: european vanilla option
level: beginner
access: free-preview
---

# Black-Scholes — public course preview

This preview lets you test the teaching format before subscribing. The full
Fundamentals course adds the complete derivation, parity controls, signed
Greeks, exercises, corrections, desk memo and source map.

## Promesse du module

Turn a vanilla option request into a clean pricing ticket and understand what
the Black-Scholes price does — and does not — represent.

## Niveau cible et public

- Level: beginner
- Audience: market-finance student or junior analyst
- Preview time: 15 minutes
- Full course access: Starter plan

## Prerequis

- percentages and discounting;
- call and put payoff at expiry;
- no coding required for this preview.

## Objectifs d'apprentissage

At the end of the preview, you can identify the six canonical inputs and run a
first price in the free calculator. The full course is required to validate a
module, complete graded exercises and obtain the complete desk workflow.

## Deroule pratique

### Module 1 - Read the option ticket
- Objectif pratique: identify spot, strike, maturity, rate, dividend yield and volatility.
- Situation de desk: Sales requests an indicative European call quote.
- Notion utile: every input needs a value, unit, timestamp and convention.
- Activite: flag missing or ambiguous fields before calculating.
- Livrable apprenant: controlled six-input ticket.

### Module 2 - Run a first controlled price
- Objectif pratique: use the free deterministic calculator and interpret premium versus intrinsic value.
- Situation de desk: the desk needs a reproducible indicative price, not a trading recommendation.
- Notion utile: model price depends on assumptions; it is not a live executable market quote.
- Activite: change volatility and maturity one at a time and observe the direction of the price.
- Livrable apprenant: two-scenario observation note.

## Cours redige

### Lecon 1 - The six-input ticket

For a European option, record spot **S**, strike **K**, time to maturity **T**,
risk-free rate **r**, continuous dividend yield **q**, and volatility **sigma**.
Before pricing, verify that prices share one currency, rates use a stated
compounding convention, time uses a stated day-count, and volatility is an
annualised decimal. A plausible number with inconsistent conventions is still
an invalid desk result.

### Lecon 2 - What the first price means

The calculator returns a deterministic model value under published inputs. Use
it to understand direction and scale: a call should not be worth less than its
discounted intrinsic lower bound, and higher volatility should not reduce a
plain call or put value when the other inputs are fixed. The result is
educational and must not be presented as live market data or investment advice.

## Formules

The full course derives the closed-form equations and their assumptions. In the
preview, use the calculator to inspect the result and its controls rather than
copying a formula without conventions.

## Ressources

- Free deterministic Black-Scholes calculator.
- Starter: full script, derivation, parity, Greeks, exercises and answer key.
