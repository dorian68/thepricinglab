

## Splash Screen Implementation Plan

### Insertion point
The splash component will be rendered inside `App.tsx`, wrapping/overlaying the existing content. It will use `sessionStorage` to show only once per session, and will auto-dismiss after ~1500ms with click-to-skip support.

### Component: `src/components/SplashScreen.tsx`

A fixed full-viewport overlay (`z-50`) with:

**Background layer:**
- Near-black graphite bg (`#0d0f14`)
- Subtle CSS grid-line texture (repeating linear gradients, very faint)

**SVG visual elements (all partially transparent, decorative):**
- Large stylized integral sign (∫) — stroke-draw animation via `stroke-dasharray`/`stroke-dashoffset`
- 3 equations as SVG `<text>` at low opacity (0.06–0.12), positioned asymmetrically:
  - `dSₜ = μSₜdt + σSₜdWₜ`
  - `∂V/∂t + ½σ²S² ∂²V/∂S² + rS ∂V/∂S − rV = 0`
  - `∫ σ²(S,t) dt`
- A subtle sparkline/price path — polyline with stroke-draw animation

**Center content:**
- "The Pricing Library" in JetBrains Mono, clean fade-in + slight translateY
- Subtitle "Quantitative Finance · Option Pricing · Market Intelligence" in smaller text, amber/orange accent (`#e8930c`), delayed fade-in

**Accent color:** Bloomberg amber `#e8930c` used only on subtitle dots and sparkline stroke

**Animation (CSS only, no dependencies):**
- Integral stroke-draw: 800ms ease-out
- Sparkline stroke-draw: 1200ms ease-out
- Title fade-in: 400ms delay, 500ms duration
- Subtitle fade-in: 600ms delay, 500ms duration
- Exit: entire overlay fades out over 400ms

**Timing:**
- Auto-dismiss at 1500ms (starts exit animation)
- Click/tap anywhere or "Skip" link triggers immediate exit
- `prefers-reduced-motion`: skip all animation, show static for 600ms then dismiss

**Session logic:**
- On mount, check `sessionStorage.getItem('tpl-splash-seen')`
- If set, don't render at all
- On dismiss, set `sessionStorage.setItem('tpl-splash-seen', '1')`

### Integration in `App.tsx`
- Import `SplashScreen`
- Render `<SplashScreen />` as first child inside the providers, before `<Router>`
- Component self-manages visibility, returns `null` when done

### Files
- **Create:** `src/components/SplashScreen.tsx`
- **Modify:** `src/App.tsx` — add import + render `<SplashScreen />`

No other files changed. No content regression.

