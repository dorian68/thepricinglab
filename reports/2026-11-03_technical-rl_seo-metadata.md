# The Pricing Library: public-route SEO and identity contract

## Scope and baseline

This change starts from the documented public Lovable release `a041349`, in an
isolated worktree on branch `seo/sitelinks-geo-20261103`. The original website
checkout and both October SEO worktrees are preserved.

Read-only production checks on 3 November 2026 found an exact match between the
public 40-URL sitemap and that release; all 40 metadata titles and the historical
alias markers were present in the public JavaScript entrypoint
`/assets/index-BWfXPCVM.js`. This establishes the bounded release baseline; it
does not prove a Git commit from a compiled bundle alone.

The documented product philosophy, functional specification, production
readiness and backend-first/CLI contracts under `THEPRICINGLIBRARY` remain the
governing product references. This patch addresses public discoverability and
navigation only. It does not change pricing, courses, article bodies, account
permissions, payment gates, backend integration or the production hosting setup.

## Acceptance criteria

1. Preserve the 40 published sitemap URLs and their current titles/descriptions.
2. Keep all 14 real courses, six articles and nine tool routes distinguishable
   from unknown URLs; preserve known aliases and the public learning journeys.
3. Give account/workspace pages explicit `noindex, follow` metadata, rather than
   the homepage fallback. Unknown URLs must show the existing NotFound screen
   with matching noindex/error metadata.
4. Emit one coherent identity graph on public content pages and meaningful
   hierarchical breadcrumbs. Do not invent company links, qualifications,
   reviews, prices, publication dates or a search capability.
5. Keep login/signup/dashboard access, while removing Admin and Not Found from
   the public footer.
6. Validate the contract from the CLI, TypeScript, targeted lint and a production
   build. A separate Business Client Mystère review and browser checks follow.

## Implementation

- A shared route resolver now drives both the actual application and its
  metadata. Historical article aliases therefore resolve to the content that
  their canonical already described, rather than relying on a first-article
  fallback. Real tier-prefixed course aliases, including the existing extension
  courses, resolve consistently as well.
- Metadata for unknown pages is explicit; account and interactive workspace
  routes stay reachable and receive `noindex, follow`. Their query strings are
  excluded from canonical URLs and structured output.
- Existing public tool access screens outside the curated sitemap remain
  recognized; missing sitemap membership alone never triggers noindex.
- One `Organization` (name and URL only), `WebSite`, `WebPage` and, where
  relevant, `BreadcrumbList` form a stable graph. It contains no `sameAs`,
  unsupported `SearchAction`, fabricated reviews/ratings or financial claims.
- Route transitions replace the robots directive, deduplicate canonical and
  metadata tags, and remove public-content structured data on utility/error
  screens.
- The public footer no longer promotes `/admin` or `/404`; the ordinary learning,
  account and pricing navigation remains available.

The curated sitemap and metadata manifest are unchanged. No artificial sitemap
dates, paid content or new financial teaching material were added.

## Validation

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS; lockfile dependencies installed in the isolated worktree |
| `npm run smoke:seo` | PASS; 8 contract groups, including all 40 routes, actual content registries, aliases, account/workspace policy, unknown/prototype-key paths, query removal, identity/breadcrumbs and navigation |
| `npx tsc --noEmit -p tsconfig.app.json` | PASS |
| `npx eslint --no-ignore src/App.tsx src/components/RouteMetadata.tsx` | PASS |
| `node --trace-uncaught node_modules/vite/bin/vite.js build` | PASS; 423 transformed modules; 8.46 s; entrypoint `index-nDeM80vK.js` |
| `git diff --check` | PASS |

The first `npm run build` invocation exited with code 1 after the transform
banner and no failure diagnosis. The direct Vite retry above completed
successfully. Its existing Browserslist-age and third-party PURE-annotation
warnings do not indicate a route or metadata failure.

## Verdict and limits

Technical verdict: **PASS for the scoped local implementation**.

The hosting fallback still returns HTTP 200 for client-routed unknown pages.
This patch displays the actual error screen and supplies noindex metadata; it
does not claim to configure a server-level HTTP 404 or domain redirect.
Lovable's verified-crawler prerendering must be checked after publication;
ordinary visitor HTML is not a reliable substitute for indexed-page inspection.

The existing wider production/commercial release gates are unchanged. This
patch is not evidence that those gates have passed, that the new bundle is
published, or that Google has selected sitelinks. No such result or deadline is
guaranteed. Production publication, Search Console checks and the independent
browser review belong to the coordinated release workflow.
