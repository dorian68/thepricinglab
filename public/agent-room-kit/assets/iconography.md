# Iconography — The Pricing Library / Agentic Trading Room

**Family:** thin geometric line icons, ~1.5px stroke, 24px grid — the **Lucide** set
(https://lucide.dev), the closest open match to the reference renders. Monochrome,
`currentColor`, red when active.

> ⚠️ Substitution flagged: production may ship a bespoke icon set. Lucide is the closest
> faithful open match. Send real SVGs to swap — only this map and the kit references change.

## Load (CDN)

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>lucide.createIcons();</script>
<!-- usage -->
<i data-lucide="line-chart" style="width:18px;height:18px"></i>
```

In React kits, the `lucide` global is used with `<i data-lucide="name">` + a
`lucide.createIcons()` pass after render.

## Name map

### Sidebar / primary nav
| Surface | Lucide name |
|---|---|
| RFQ Cockpit | `message-square-text` / `send` |
| Agent Room | `workflow` / `git-fork` |
| Product Builder | `blocks` / `package` |
| Pricing & Risk | `crosshair` / `target` |
| Payoff / Scenarios | `git-branch` / `activity` |
| Trader View | `candlestick-chart` / `bar-chart-3` |
| PnL & Greeks | `sigma` / `function-square` |
| Report Center | `file-text` |
| Market Data | `bar-chart-2` |
| Watchlist | `star` |
| Tools | `settings-2` |
| Learning Hub | `graduation-cap` |

### Agent pipeline glyphs (tinted by status hue)
| Agent | Lucide name | Hue |
|---|---|---|
| Sales Agent | `user-round` | red (understanding) |
| Structurer | `boxes` / `layout-grid` | amber (proposing) |
| Market Data | `database` | blue (loading) |
| Quant Agent | `sigma` | purple (modeling) |
| Pricing Agent | `line-chart` | green (pricing) |
| Trader Agent | `target` | amber (quoting) |
| Risk Manager | `shield-check` | blue (validating) |
| Execution Agent | `send` / `zap` | red (simulating) |
| PnL & Greeks | `sigma` / `pi` | green (analyzing) |
| Report Agent | `file-text` | purple (preparing) |

### Actions & UI
| Use | Lucide name |
|---|---|
| Send / submit | `send` |
| Copy (RFQ ID) | `copy` |
| Download / export | `download` |
| Notifications | `bell` |
| Search | `search` |
| More menu | `more-vertical` |
| Auto-save OK | `check-circle-2` |
| Info | `info` |
| Settings gear | `settings` |
| External / arrow | `arrow-right` / `arrow-up-right` |
| Edit | `pencil` |
| Lock (locked module) | `lock` |
| View / preview | `eye` |
| Learning tip | `graduation-cap` / `lightbulb` |
| Risk approved | `shield-check` |
| Live status dot | filled circle (CSS), not an icon |

## Math glyphs (inline, mono)
Greeks and stats use Unicode set in JetBrains Mono: **Σ Δ Γ Θ ρ Vega σ π** — never icons.
e.g. Delta, Gamma, Vega, Theta (Daily), Rho, Vanna, Charm.

## Emoji
None in the desk chrome. The gamified **Learning Hub** is the only surface where a
flame / star / medal glyph is acceptable.
