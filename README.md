# 🏦 The Pricing Lab

**Interactive educational platform dedicated to quantitative finance, derivatives pricing and financial engineering.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)](https://supabase.com)
[![Pyodide](https://img.shields.io/badge/Pyodide-Python%20in%20Browser-306998?logo=python)](https://pyodide.org)

---

## 📌 About

**The Pricing Lab** is a web application designed for students, professionals and enthusiasts in **quantitative finance**. It combines interactive courses, advanced calculation tools and hands-on exercises around key topics in pricing and risk management.

---

## 🎯 Business Domains Covered

### Option Pricing
- **Black-Scholes Model** — analytical pricing of European options (calls & puts)
- **Binomial Model (CRR)** — binomial tree for European and American options
- **Monte Carlo Simulation** — stochastic simulation pricing, convergence, confidence intervals
- **Exotic Options** — barriers (knock-in/knock-out), Asian options, lookback, digitals

### Greeks
- **Delta, Gamma, Vega, Theta, Rho** — calculation and interpretation
- **Interactive Simulator** — visualization of option sensitivity to market parameters
- **Greeks Surface** — multidimensional analysis

### Volatility
- **Implied Volatility** — extraction via Black-Scholes model inversion
- **Volatility Surface** — construction and visualization of the vol surface (strike × maturity)
- **Smile & Skew** — analysis of volatility curve shapes
- **Volatility Products** — VIX, variance swaps, volatility trading

### Yield Curves
- **Curve Construction** — bootstrapping, interpolation
- **Bond Pricing** — price calculation, yield-to-maturity, duration, convexity
- **Term Structure Analysis** — spot rates, forward rates

### Option Strategies
- **Vanilla Strategies** — straddle, strangle, spread (bull/bear), butterfly, condor
- **Advanced Strategies** — iron condor, ratio spreads, calendar spreads
- **Structured Products** — autocalls, reverse convertibles, barriers with coupons
- **Payoff Diagram** — interactive P&L visualization at maturity
- **Aggregated Greeks Analysis** — combined Greeks for the full strategy

### Risk Management
- **Value at Risk (VaR)** — parametric risk measure
- **Conditional VaR (CVaR / Expected Shortfall)** — tail risk measure
- **Stress Testing** — shock scenarios (volatility, rates, spot)
- **Model Calibration** — parameter fitting to market data

---

## 🛠 Technical Features

| Feature | Description |
|---|---|
| 🧮 **Financial Calculators** | Black-Scholes, Binomial, Monte Carlo, Greeks, Bond pricing, Yield curves |
| 📊 **Interactive Visualization** | Payoff diagrams, volatility surfaces, yield curves (Recharts) |
| 🐍 **In-Browser Python Editor** | Run Python code directly in the browser via Pyodide (NumPy, SciPy, Matplotlib) |
| 📓 **Interactive Notebooks** | Search, view and execute Jupyter notebooks from GitHub |
| 🏗 **Strategy Builder** | Visual construction of multi-leg option strategies with real-time pricing |
| 🎮 **Survival Mode** | Progressive quizzes with increasing difficulty waves (Beginner → Legendary) |
| 📚 **Structured Courses** | Black-Scholes, Greeks, Monte Carlo, Exotic Options, Vol Products, Yield Curves |
| 🌐 **Bilingual FR/EN** | Fully translated interface with i18next |
| 🔐 **Authentication** | User and role management (admin/moderator/user) via Supabase Auth |
| 📈 **User Dashboard** | Progress tracking, achievements, quiz results |
| 💬 **Chat Widget** | Built-in assistant for contextual help |
| 📝 **Technical Blog** | Articles on Greeks, Monte Carlo vs Binomial, implied volatility, exotic options |

---

## 🧰 Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Supabase (Auth, Database, Edge Functions, RLS) |
| **Python** | Pyodide (NumPy, SciPy, Matplotlib running client-side) |
| **Charts** | Recharts, react-d3-tree |
| **Scientific Rendering** | KaTeX (math formulas), Mermaid (diagrams) |
| **Internationalization** | i18next, react-i18next |
| **Routing** | React Router v6 |
| **State Management** | TanStack React Query, React Context |
| **Markdown** | react-markdown, rehype-katex, remark-math, rehype-raw |
| **Forms** | React Hook Form, Zod validation |

---

## 📐 Mathematical Models Implemented

```
Black-Scholes:  C = S·e^(-qT)·N(d₁) - K·e^(-rT)·N(d₂)
                d₁ = [ln(S/K) + (r - q + σ²/2)T] / (σ√T)
                d₂ = d₁ - σ√T

Greeks:         Δ = ∂C/∂S    Γ = ∂²C/∂S²    ν = ∂C/∂σ
                Θ = ∂C/∂T    ρ = ∂C/∂r

Monte Carlo:    S_T = S₀ · exp[(r - σ²/2)T + σ√T · Z]
                Price = e^(-rT) · E[max(S_T - K, 0)]

Binomial:       u = e^(σ√Δt)    d = 1/u
                p = (e^(rΔt) - d) / (u - d)
```

---

## 🚀 Getting Started

```sh
git clone <REPO_URL>
cd the-pricing-lab
npm install
npm run dev
```

Prerequisites: Node.js 18+ (see `.node-version`)

---

## 📂 Project Architecture

```
src/
├── components/          # React components (UI, strategies, tools, navigation...)
│   ├── strategies/      # Strategy Builder, PayoffChart, Greeks
│   ├── tools/           # Calculators (Black-Scholes, Monte Carlo, Bonds...)
│   ├── python/          # Python editor, Pyodide loader, exercises
│   ├── navigation/      # Navbar, menus (Courses, Tools, Community...)
│   └── ui/              # shadcn/ui components
├── pages/               # Application pages
│   ├── courses/         # Courses (Black-Scholes, Greeks, Monte Carlo...)
│   ├── trading/         # Trading Lab (Strategies, Backtest, Exercises)
│   ├── survival/        # Survival Mode quizzes (6 levels)
│   └── community/       # Forum, Playground, Challenges
├── utils/options/       # Business logic (Black-Scholes, payoff calculation, templates)
├── services/            # Services (GitHub, Notebooks, Pyodide)
├── hooks/               # Custom hooks
├── i18n/                # FR/EN translations
├── types/               # TypeScript types (strategies, auth, blog...)
└── data/                # Static data (blog posts, survival waves)
```

---

## 🔗 Links

- **Preview**: [the-pricing-lab.lovable.app](https://market-whispers-academy.lovable.app)
- **Lovable Project**: [lovable.dev/projects/70aefe57-b3fa-4664-aaf6-86e47d3ce99d](https://lovable.dev/projects/70aefe57-b3fa-4664-aaf6-86e47d3ce99d)

---

## 📄 License

Private project — All rights reserved.
