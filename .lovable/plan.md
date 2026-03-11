

# SEO Optimization Plan

## Issues Found

### P0 — Critical SEO Problems

1. **Sitemap URLs don't match actual routes** — Sitemap lists `/courses/black-scholes` but real routes are `/courses/fundamentals/black-scholes`. Google tries to crawl non-existent URLs and gets 404s. This is the single biggest SEO issue.

2. **Brand name inconsistency across titles** — 8 pages still use "The Pricing Lab" instead of "The Pricing Library" in `<title>` tags. Google sees this as two different brands.

3. **Most pages have no canonical URL** — Only pages using `SEOHead` with explicit `canonical` prop get one. ~20 pages use raw `<Helmet>` with no canonical, causing potential duplicate content issues.

4. **No structured data on content pages** — Blog posts have no `Article` schema, courses have no `Course` schema, pricing page has no `FAQPage` schema. Missing rich results in Google.

5. **SEOHead hardcodes `content-language: fr-FR`** — Site is bilingual EN/FR but tells Google it's French-only.

6. **BlogPost.tsx still renders duplicate `<Navbar />`** — Double nav on blog posts.

### P1 — Important

7. **Stale sitemap lastmod dates** — All set to `2024-12-05` (over a year old). Google deprioritizes stale sitemaps.
8. **Missing pages in sitemap** — `/pricing`, `/dashboard`, `/leaderboard`, `/trading/*`, `/jobs`, `/mentoring`, `/notebooks` not in sitemap.
9. **No `WebSite` schema** — Missing sitelinks search box potential.
10. **DesktopNav logo text says "THE PRICING LAB"** — Brand inconsistency visible to users and crawlers.

---

## Implementation

### 1. Fix Sitemap — correct all URLs to match actual routes, add missing pages, update lastmod
**File**: `public/sitemap.xml`

### 2. Unify brand name to "The Pricing Library" everywhere
**Files**: `src/pages/Blog.tsx`, `src/pages/BlogPost.tsx`, `src/pages/Courses.tsx`, `src/pages/Jobs.tsx`, `src/pages/ExerciseDetail.tsx`, `src/components/tools/MonteCarloSimulator.tsx`, `src/components/navigation/DesktopNav.tsx`, `src/pages/trading/Scenarios.tsx`, `src/pages/trading/Backtest.tsx`, `src/pages/tools/PayoffVisualizer.tsx`

### 3. Upgrade SEOHead component
- Remove hardcoded `fr-FR` — use `en` as default (matches `index.html`)
- Always generate a canonical from `window.location.pathname` (not just when prop is passed)
- Add `WebSite` structured data with search action
- Move GA4 script to `index.html` (should load once, not re-inject on every page)

**File**: `src/components/SEOHead.tsx`, `index.html`

### 4. Add Article structured data to BlogPost.tsx
- Add JSON-LD `Article` schema with author, datePublished, image
- Remove duplicate `<Navbar />` import
- Fix brand name

**File**: `src/pages/BlogPost.tsx`

### 5. Add Course structured data to course pages
- Add JSON-LD `Course` schema to `Courses.tsx` listing page

**File**: `src/pages/Courses.tsx`

### 6. Add FAQPage structured data to Pricing page
**File**: `src/pages/Pricing.tsx` (via the FAQ component)

### 7. Fix DesktopNav brand text
**File**: `src/components/navigation/DesktopNav.tsx`

---

## Expected Impact
- **Sitemap fix**: Google can actually crawl real pages instead of getting 404s — immediate indexing improvement
- **Canonical URLs on all pages**: Eliminates duplicate content signals
- **Structured data**: Enables rich results (article cards, course listings, FAQ dropdowns in SERP)
- **Brand consistency**: Google consolidates signals under one entity name
- **Correct language tag**: Proper geo/language targeting

