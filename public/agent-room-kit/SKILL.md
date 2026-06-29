---
name: thepricinglibrary-design
description: Use this skill to generate well-branded interfaces and assets for The Pricing Library — specifically its Agentic FIC Trading Room (a dark, Bloomberg-style quant/derivatives desk cockpit) — for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and a UI-kit component library for prototyping.
user-invocable: true
---

# The Pricing Library — Agentic Trading Room · Design Skill

Read `readme.md` first — it is the full design guide (context, content fundamentals, visual
foundations, iconography, and an index of every file). Then explore the other files.

## What this system is
A dark "terminal / trading-desk" design system (near-black deep-navy canvas, vivid red
`#FF2E45` primary accent, signal green, monospace-first JetBrains Mono typography, dense
4/8px grid, 4px hairline-bordered panels) for an AI-agentic Fixed Income & Currency trading
cockpit that turns natural-language market questions into structured, priced, risk-checked
answers.

## How to use it
- **Foundations / tokens:** link `styles.css` (the `@import` manifest). All colour, type,
  spacing, radius, elevation and motion live as CSS custom properties under `tokens/`.
- **Components:** the React primitives in `components/` are bundled and exposed on
  `window.ThePricingLibraryDesignSystem_f20ac6` (Button, Badge, Panel, StatCard, Tabs,
  SegmentedToggle, Input, Switch, LineChart, PayoffChart, OrderBook, VolHeatmap, Donut,
  Sparkline, AgentNode, IdeaCard, TickerStrip, LearningTip, MetricRow, RfqHeader). Each has a
  `.d.ts` (props) and `.prompt.md` (usage). See the `*.card.html` specimens.
- **UI kit:** `ui_kits/trading_room/` is an interactive recreation of the desk (shell +
  Dashboard, RFQ Cockpit, Agent Room, Trader View). Read it to learn the layout patterns.
- **Icons:** Lucide via CDN — see `assets/iconography.md` for the name map.

## When generating
- If creating **visual artifacts** (slides, mocks, throwaway prototypes): copy assets out and
  produce static/standalone HTML files the user can view. Reuse the tokens and components.
- If working on **production code**: copy assets and read the rules here to design as an
  expert in this brand.
- If invoked with no other guidance: ask the user what they want to build, ask a few focused
  questions, then act as an expert designer who outputs HTML artifacts _or_ production code.

## Voice & rules (quick)
Uppercase mono labels; address the user as "you"; numbers carry units and signs and are
coloured (green up / red down); **bid = red, ask = green**; one red accent doing the
signalling; no emoji in desk chrome; always pair desk jargon with an educational aside.
