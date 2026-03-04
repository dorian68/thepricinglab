# 🏦 The Pricing Lab

**Plateforme éducative interactive dédiée à la finance quantitative, au pricing de produits dérivés et à l'ingénierie financière.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)](https://supabase.com)
[![Pyodide](https://img.shields.io/badge/Pyodide-Python%20in%20Browser-306998?logo=python)](https://pyodide.org)

---

## 📌 À propos

**The Pricing Lab** est une application web conçue pour les étudiants, professionnels et passionnés de **finance quantitative**. Elle combine cours interactifs, outils de calcul avancés et exercices pratiques autour des thématiques clés du pricing et de la gestion des risques.

---

## 🎯 Domaines métier couverts

### Valorisation d'options (Option Pricing)
- **Modèle de Black-Scholes** — pricing analytique d'options européennes (calls & puts)
- **Modèle Binomial (CRR)** — arbre binomial pour options européennes et américaines
- **Simulation Monte Carlo** — pricing par simulation stochastique, convergence, intervalles de confiance
- **Options exotiques** — barrières (knock-in/knock-out), options asiatiques, lookback, digitales

### Les Grecques (Greeks)
- **Delta, Gamma, Vega, Theta, Rho** — calcul et interprétation
- **Simulateur interactif** — visualisation de la sensibilité des options aux paramètres de marché
- **Surface de Greeks** — analyse multidimensionnelle

### Volatilité
- **Volatilité implicite** — extraction via inversion du modèle Black-Scholes
- **Surface de volatilité** — construction et visualisation de la vol surface (strike × maturité)
- **Smile & Skew** — analyse des formes de la courbe de volatilité
- **Produits de volatilité** — VIX, variance swaps, volatility trading

### Courbes de taux (Yield Curves)
- **Construction de courbes** — bootstrapping, interpolation
- **Pricing obligataire** — calcul de prix, yield-to-maturity, duration, convexité
- **Analyse de la structure par terme** — taux spot, taux forward

### Stratégies d'options
- **Stratégies vanille** — straddle, strangle, spread (bull/bear), butterfly, condor
- **Stratégies avancées** — iron condor, ratio spreads, calendar spreads
- **Produits structurés** — autocalls, reverse convertibles, barrières avec coupons
- **Diagramme de payoff** — visualisation interactive P&L à maturité
- **Analyse des Greeks agrégés** — Greeks combinés de la stratégie complète

### Gestion des risques
- **Value at Risk (VaR)** — mesure de risque paramétrique
- **Conditional VaR (CVaR / Expected Shortfall)** — risque de queue de distribution
- **Stress testing** — scénarios de choc (volatilité, taux, spot)
- **Calibration de modèles** — ajustement de paramètres sur données de marché

---

## 🛠 Fonctionnalités techniques

| Fonctionnalité | Description |
|---|---|
| 🧮 **Calculateurs financiers** | Black-Scholes, Binomial, Monte Carlo, Greeks, Bond pricing, Yield curves |
| 📊 **Visualisation interactive** | Payoff diagrams, surfaces de volatilité, courbes de taux (Recharts) |
| 🐍 **Éditeur Python in-browser** | Exécution de code Python directement dans le navigateur via Pyodide (NumPy, SciPy, Matplotlib) |
| 📓 **Notebooks interactifs** | Recherche, visualisation et exécution de notebooks Jupyter depuis GitHub |
| 🏗 **Strategy Builder** | Construction visuelle de stratégies d'options multi-legs avec pricing en temps réel |
| 🎮 **Mode Survival** | Quiz progressifs par vagues de difficulté croissante (Beginner → Legendary) |
| 📚 **Cours structurés** | Black-Scholes, Greeks, Monte Carlo, Options exotiques, Vol products, Yield curves |
| 🌐 **Bilingue FR/EN** | Interface entièrement traduite avec i18next |
| 🔐 **Authentification** | Gestion des utilisateurs et rôles (admin/moderator/user) via Supabase Auth |
| 📈 **Dashboard utilisateur** | Suivi de progression, achievements, résultats de quiz |
| 💬 **Chat widget** | Assistant intégré pour l'aide contextuelle |
| 📝 **Blog technique** | Articles sur les Greeks, Monte Carlo vs Binomial, volatilité implicite, options exotiques |

---

## 🧰 Stack technique

| Catégorie | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Supabase (Auth, Database, Edge Functions, RLS) |
| **Python** | Pyodide (NumPy, SciPy, Matplotlib exécutés côté client) |
| **Graphiques** | Recharts, react-d3-tree |
| **Rendu scientifique** | KaTeX (formules mathématiques), Mermaid (diagrammes) |
| **Internationalisation** | i18next, react-i18next |
| **Routing** | React Router v6 |
| **State management** | TanStack React Query, React Context |
| **Markdown** | react-markdown, rehype-katex, remark-math, rehype-raw |
| **Formulaires** | React Hook Form, Zod validation |

---

## 📐 Modèles mathématiques implémentés

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

## 🚀 Lancement local

```sh
git clone <REPO_URL>
cd the-pricing-lab
npm install
npm run dev
```

Prérequis : Node.js 18+ (voir `.node-version`)

---

## 📂 Architecture du projet

```
src/
├── components/          # Composants React (UI, strategies, tools, navigation...)
│   ├── strategies/      # Strategy Builder, PayoffChart, Greeks
│   ├── tools/           # Calculateurs (Black-Scholes, Monte Carlo, Bonds...)
│   ├── python/          # Éditeur Python, Pyodide loader, exercices
│   ├── navigation/      # Navbar, menus (Courses, Tools, Community...)
│   └── ui/              # shadcn/ui components
├── pages/               # Pages de l'application
│   ├── courses/         # Cours (Black-Scholes, Greeks, Monte Carlo...)
│   ├── trading/         # Trading Lab (Strategies, Backtest, Exercices)
│   ├── survival/        # Quiz Survival Mode (6 niveaux)
│   └── community/       # Forum, Playground, Challenges
├── utils/options/       # Logique métier (Black-Scholes, calcul de payoff, templates)
├── services/            # Services (GitHub, Notebooks, Pyodide)
├── hooks/               # Custom hooks
├── i18n/                # Traductions FR/EN
├── types/               # Types TypeScript (strategies, auth, blog...)
└── data/                # Données statiques (blog posts, survival waves)
```

---

## 🔗 Liens

- **Preview** : [the-pricing-lab.lovable.app](https://market-whispers-academy.lovable.app)
- **Lovable Project** : [lovable.dev/projects/70aefe57-b3fa-4664-aaf6-86e47d3ce99d](https://lovable.dev/projects/70aefe57-b3fa-4664-aaf6-86e47d3ce99d)

---

## 📄 Licence

Projet privé — Tous droits réservés.
