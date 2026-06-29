# UI Kit — Agentic Trading Room

Interactive, high-fidelity recreation of The Pricing Library's **Agentic FIC Trading Room**
desk cockpit. Open `index.html`.

## What it is
A dark Bloomberg-style desk shell (left sidebar + top nav + market-watch ticker) with four
working screens you can click between via the sidebar:

| Screen | Sidebar item | Notes |
|---|---|---|
| **Dashboard** | click the logo | Hero "From any market question to a desk-ready answer", SPX panel (price + theoretical), vol surface, order book, 8-agent pipeline strip |
| **RFQ Cockpit** | RFQ Cockpit | Natural-language request → interpretation → 5 approach cards → next step; Market Context rail |
| **Agent Room** | Agent Room | 10-node agent workflow (Pipeline/Map), workflow log, confidence donut |
| **Trader View** | Trader View | 6-stat quote strip, quote management, hedging strategy, order book + last trades, position/risk/notes |

Other sidebar items render a placeholder — they're listed in the brief (Product Builder,
Pricing & Risk, Payoff/Scenarios, PnL & Greeks, Report Center) and can be added the same way.

## How it's built
- Composes the design-system **component primitives** from the bundle
  (`window.ThePricingLibraryDesignSystem_f20ac6`) — `Panel, Button, Badge, Input, Tabs,
  SegmentedToggle, StatCard, Sparkline, LineChart, PayoffChart, OrderBook, VolHeatmap, Donut,
  AgentNode, IdeaCard, LearningTip, MetricRow, RfqHeader`. It does not re-implement them.
- Files:
  - `index.html` — loads React + Babel + Lucide + the DS bundle, then the kit scripts; renders the `App` router.
  - `tr-data.js` — all mock data (`window.TR`).
  - `tr-shell.jsx` — `Icon` (Lucide), `Sidebar`, `TopBar`, `Ticker`, logo, user chip.
  - `tr-screens.jsx` — the four screens (`window.TRScreens`).
- **Icons:** Lucide via CDN (see `assets/iconography.md`).
- Designed at **1536-wide**; the shell fills the viewport.

> All figures are mock/indicative ("Not investment advice"). This is a visual + interaction
> recreation, not production trading code.
