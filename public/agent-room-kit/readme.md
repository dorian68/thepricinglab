# The Pricing Library — Agentic Trading Room · Design System

> Dark, dense, Bloomberg-grade **terminal** design system for The Pricing Library's
> **Agentic Fixed Income & Currency (FIC) Trading Room** — an educational + research desk
> cockpit where a user asks a market question in natural language and a team of AI agents
> (Sales → Structurer → Market Data → Quant → Pricing → Trader → Risk → Report) turns it
> into a structured, priced, risk-checked answer.

This system is the **visual source of truth** for the app shell that lives on a subdomain
(`app.tradinglibrary.com` / `AG-TRD.thepricinglibrary.com`), distinct from the marketing
site, and for aligning the existing React implementation at `/agent-room`.

---

## Sources & provenance

- **Product:** The Pricing Library — interactive quant-finance education (option pricing,
  Black-Scholes, Monte Carlo, Greeks, volatility, simulators). Public site:
  `https://thepricinglibrary.com` (client-rendered SPA; bilingual FR/EN).
- **This surface:** the Agentic FIC Trading Room cockpit.
- **Design source of truth:** 11 high-fidelity reference renders provided by the user
  (`uploads/ChatGPT Image 27 juin 2026, *.png`), covering the master Dashboard / Agent
  Room, RFQ Cockpit, Agent Room (10-node workflow), Product Builder, Pricing & Risk,
  Payoff / Scenarios, Trader View, PnL & Greeks, Learning Hub, and Report Center — plus an
  alternate "waveform-logo" shell concept. All tokens, layout, spacing, colour and type
  decisions in this system are extracted from those renders and the accompanying written
  brief.
- **Existing code to align:** a React implementation at `/agent-room` (not attached here).

> ⚠️ **Font substitution flagged:** the brief specifies a monospace family ("JetBrains Mono
> / IBM Plex Mono"). This system standardises on **JetBrains Mono** (loaded from Google
> Fonts) for the entire UI, with **IBM Plex Sans** for long-form description paragraphs. If
> the production app uses a different licensed mono, send the files and we'll swap the
> `@font-face` source — only `tokens/fonts.css` changes.

---

## CONTENT FUNDAMENTALS — how the product talks

The voice is a **professional trading desk that teaches as it works**. Terse, precise,
quantitative — but never cold, because there's always an educational layer.

- **Register:** desk shorthand. Short imperative labels and noun phrases, not sentences:
  `THEO PRICE`, `BID`, `SPREAD`, `RISK SUMMARY · APPROVED`, `Send Quote to Client`,
  `Run Stress Test`, `Rebalance Hedge`.
- **Casing:** **UPPERCASE for all structural labels** — nav items (`TRADER VIEW`), panel
  titles (`MARKET DEPTH`, `HEDGING STRATEGY`), table headers (`SCENARIO`, `P&L IMPACT`),
  eyebrows (`AGENTIC TRADING ROOM · FIXED INCOME DESK`), status words
  (`UNDERSTANDING`, `QUOTING`, `APPROVED`, `LIVE`, `EDUCATIONAL MODE`). Sentence case for
  descriptive helper text and body copy ("Desk execution, hedging strategy and live market
  context.").
- **Person:** addresses the user as **"you" / "your"** ("Understand **your** product
  exposure", "What is **your** request?", "**Your** Quote", "Send Quote to Client"). The
  agents are spoken of in third person ("Our agents collaborate like a real desk").
- **Numbers are first-class.** Every figure carries units (`$3.45 /bbl`, `78.42 USD/bbl`,
  `+0.31%`, `1,024`, `DV01 1.24M €`, `+0.0012`). Tabular, monospace, sign-prefixed
  (`+$12,840`, `−$64,200`). Deltas always coloured (green up / red down). bps shown as
  `−0.02bp`.
- **The hero is a single declarative promise**, mono, with one word in red:
  *"From any market question to a **desk-ready** answer."* / *"What do you want to **price
  or structure?**"*. Beneath it, an invitation in plain language: "Ask anything. Our agents
  structure, price, and analyze financial products for you."
- **Educational layer.** Recurring `LEARNING TIP` / `EDUCATIONAL TIP` / `QUICK INSIGHT`
  cards translate desk jargon: "A call option gives you the right, but not the obligation,
  to buy at the strike price." A persistent **EDUCATIONAL MODE** badge and a **"Switch to
  Pro Mode"** toggle frame the whole experience as learn-while-you-trade.
- **Bilingual reality.** Example prompts appear in French ("J'ai peur que le pétrole
  augmente dans 5 mois, que me proposez-vous ?") and English interchangeably — the product
  is FR/EN. Keep copy translatable; avoid idioms.
- **No emoji in chrome.** The interface uses line **icons**, not emoji. (A flame/star may
  appear in gamified Learning Hub stats, but the desk surfaces are icon-only.)
- **Status is a vocabulary.** A small, consistent set of state words drives the agent
  pipeline and risk system: Understanding · Proposing · Loading · Modeling · Pricing ·
  Quoting · Validating · Simulating · Analyzing · Preparing — and GREEN / AMBER / RED for
  risk, APPROVED / IN PROGRESS / LOCKED for workflow.

---

## VISUAL FOUNDATIONS

**Overall vibe:** a Bloomberg-terminal / trading-desk cockpit. Near-black deep-navy void,
dozens of hairline-bordered panels packed at high density, monospace everything, one vivid
red doing all the signalling. Serious, fast, professional. Information-dense but ordered on
a strict grid.

### Colour
- **Canvas:** near-black deep navy. `--bg-base #07090E` (void / ticker), `--bg-canvas
  #0A0E14` (app), panels one step lighter — `--bg-panel #0D1219`, raised `--bg-panel-2
  #10161E`, inputs/hover `--bg-elevated #131A24`. Chart wells sink to `--bg-inset #0B0F15`.
- **Borders are the primary depth cue**, not shadows: a single **1px hairline**
  `--border-hairline #1A2330` rings almost every panel. Stronger dividers `#283447`.
- **RED is the brand and the primary accent** — `--red-500 #FF2E45` (with `#F5333E`).
  It marks: the active nav item (+ a 2px red underline), primary buttons ("Send Quote to
  Client", "Generate Full Package"), the live/quoting state, key hero word ("desk-ready"),
  chart price lines, **bid** prices, and the `MARKET WATCH` label. Used sparingly enough to
  stay loud.
- **GREEN `--green-500 #2ECC71`** = gains, `LIVE`, positive ticks, **ask** prices, GREEN
  risk status, APPROVED. (Note the desk convention: **bid = red, ask = green**.)
- **Categorical hues** drive agent status and product tags: **amber `#E8A838`** (hedge /
  proposing / quoting / warning), **purple `#9B7BF0`** (modeling / balanced / structured),
  **blue `#4D8DF0`** (loading / validating / data export / links), **cyan `#2BC7D4`**
  (confidence / collaboration). Each tag chip is a tinted-background + coloured-text
  capsule.
- **Text:** off-white `--text-primary #E6EAF1` for headings + key data; `--text-secondary
  #8A94A4` and `--text-muted #6B7585` for labels/captions; `--text-dim #48535F` for faint
  meta and disabled.

### Type
- **Monospace-first.** `JetBrains Mono` carries the whole UI — hero, headings, nav, labels,
  tickers, prices, Greeks. `IBM Plex Sans` only for long description/body paragraphs.
- **Hero** ~42px mono (`--text-5xl`), heavy weight, tight tracking, one red word.
- **Labels** are UPPERCASE mono, ~11px, wide tracking (`--tracking-label .08em`),
  `--text-secondary`.
- **Numbers** use tabular figures (`font-variant-numeric: tabular-nums`) so price columns
  align; always with units and signs.
- **Logo wordmark:** "THE PRICING LIBRARY" set as a tight **two-line** mono block, heavy,
  wide-tracked, white — with a small red tick/diacritic accent. (Alt shell: a red waveform
  glyph + "ThePricingLibrary / Agentic Trading Room".)

### Spacing, grid & radius
- Strict **4 / 8 px grid**. Dense gutters (`--gap-grid 12px`), tight panel padding
  (`--pad-panel 16px`, cards `14px`).
- Layout primitives: top nav `56px`, left sidebar `240px`, right context rail `~320px`,
  market-watch ticker `32px`.
- **4px panel radius** (`--radius-md`) is the signature; chips/progress use `2px`, pills for
  status dots/avatars.

### Backgrounds & texture
- No photography, no illustration in the desk chrome. Depth = flat dark fills + hairlines.
- **Subtle inner gradients** on hero and chart panels: a faint red radial bloom in the hero
  corner (`--grad-hero`), and **area-fill gradients under chart lines** (red or green,
  fading to transparent — `--grad-chart-red/green`). Vol-surface uses a **red-intensity
  heatmap** (Strike × Tenor). A faint 1px **grid** sits behind line charts.

### Borders, shadows, cards
- Cards/panels = flat `--bg-panel` fill + 1px hairline + 4px radius, optional faint top
  inner-gradient. **Shadows are minimal** (`--shadow-md` only for popovers/menus); depth is
  borders and value contrast.
- **Glows** appear on active/live accents: red focus ring + red glow on the active input,
  green glow on `LIVE`, coloured progress bars under agent nodes.

### Animation
- Fast and **mechanical** — no bounce, no playful easing. `--dur-fast 140ms` for hovers and
  the nav underline; `--dur-base 200ms` for tabs/panels. Eases are crisp
  (`--ease-out`, `--ease-snap`).
- **Live signals pulse**: `LIVE` dots and quoting states use a slow opacity pulse
  (`tpl-pulse`); agent progress bars tick left-to-right; numbers may flash on tick.
- Respects `prefers-reduced-motion` (durations collapse to 0).

### Hover / press / focus
- **Hover:** rows/controls lighten one step (`--bg-hover #182230`); ghost buttons gain a
  hairline; links shift blue lighter. No scale on hover.
- **Press:** primary red buttons darken to `--red-700`; controls may nudge 1px.
- **Focus:** red ring (`--glow-focus`, 2px red at 45%) — matches the active-input red border
  in the RFQ box.

### Transparency & blur
- Used sparingly: tinted chip/badge backgrounds (`rgba` of the hue at ~10–14%), chart
  area-fill gradients, and faint overlay scrims on modals. No heavy glassmorphism.

---

## ICONOGRAPHY

- **Style:** thin, geometric **line icons**, ~1.5px stroke, on a 24px grid — matching the
  Lucide / Feather family. Monochrome, inheriting `currentColor` (usually `--text-secondary`,
  red when active). This system uses **[Lucide](https://lucide.dev)** via CDN as the
  closest faithful match to the reference set; see `assets/iconography.md` for the exact
  name map (sidebar, agents, actions).
  > Flagged substitution: the production icons may be a bespoke set — Lucide is the
  > closest open match. Send the real SVGs to swap.
- **Agent icons** are domain glyphs in coloured rings: user (Sales), nodes/blocks
  (Structurer), database (Market Data), sigma Σ (Quant), line-chart (Pricing), target
  (Trader), shield (Risk), document (Report) — each tinted with its status hue.
- **No emoji** in the desk chrome. Unicode math (Σ, Δ, Γ, Θ, ρ, σ, π) appears inline in
  formulas and Greeks labels, set in mono. The Learning Hub (gamified) is the only place a
  flame/star/medal glyph is acceptable.
- **Logo / wordmark** lives in `assets/` as the two-line "THE PRICING LIBRARY" mono mark and
  the alternate waveform mark.

---

## INDEX — what's in this system

| Path | What |
|---|---|
| `styles.css` | Global entry point (@import manifest). Consumers link this. |
| `tokens/` | `fonts · colors · typography · spacing · radius · elevation · motion · base` |
| `assets/` | Logo wordmarks, iconography map, motif notes |
| `components/core/` | Button · IconButton · Badge/Tag · StatCard · Panel · Tabs · SegmentedToggle · Input · Switch |
| `components/charts/` | LineChart · PayoffChart · OrderBook · VolHeatmap · Donut · Sparkline |
| `components/desk/` | AgentNode · IdeaCard · TickerStrip · LearningTip · MetricRow · RfqHeader |
| `ui_kits/trading_room/` | Interactive Trading Room recreation (shell + Dashboard, RFQ Cockpit, Agent Room, Trader View) |
| `guidelines/*.html` | Foundation specimen cards (Design System tab) |
| `SKILL.md` | Agent Skill manifest (for Claude Code download) |

**Namespace:** components are exposed on `window.ThePricingLibraryDesignSystem_f20ac6`.

See the **Design System tab** for live specimen cards of every foundation and component.
