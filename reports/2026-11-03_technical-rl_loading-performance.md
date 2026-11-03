# The Pricing Library: homepage loading performance candidate

## Scope and evidence

This isolated candidate starts from the validated SEO commit
`afba39d327f39f7058ba7bdc489d3b70059c0c1b`, on branch
`perf/home-loading-20261103`. The previous worktrees, including uncommitted
reports in the earlier candidate, are preserved.

The public Lighthouse 13.6.0 mobile audit from 3 November 2026 observed:

- performance 66, SEO 100, LCP 6,919.6 ms and TBT 361.9 ms;
- an unminified 2,579,552-byte entry script, 575,382 transferred bytes;
- 344,838 estimated unused bytes in that script, plus 75,202 in Google Analytics;
- a stylesheet-to-font Lucide CDN chain ending at approximately 2.4 seconds,
  with a 220,348-byte icon font and no font-display policy for it.

Evidence: the parent audit run is
`https://github.com/dorian68/quant-web-forge/actions/runs/41655288245`.
These are actual production observations. They do not identify every cause of
the production LCP and do not measure this new candidate.

Source inspection establishes that the release forces `minify: false`, imports
ReactMarkdown/remark-math/rehype-katex synchronously, and loads KaTeX CSS globally.
The homepage does not render the course mathematics component. The Lucide font
is loaded by a blocking external stylesheet even though `lucide-react` is already
a project dependency.

## Bounded changes

- Restore the Vite 5 production esbuild minifier and produce a build manifest.
- Load the existing Markdown/math renderer and its KaTeX styles only when a
  course actually renders it. Keep stripping the same frontmatter and keep the
  same remark/rehype configuration.
- Use the same named Lucide icons as inline SVGs instead of downloading the
  whole icon font. Preserve the existing icon names, sizes, styles and CSS class
  hooks; mark the decorative SVGs as hidden from assistive technology.
- Keep React, authentication, translation and query dependencies cacheable in
  stable chunks, and isolate the deferred KaTeX chunk.

No course, article, catalogue, price, metadata manifest or sitemap is rewritten.
No hosting migration, analytics configuration change or production publication
is included. The validated route/noindex/identity work is preserved.

## Acceptance and validation

The small CLI tests compare every pre-existing top-level function except the
two performance wrappers, every existing state/catalogue/price declaration, and
the course resources against the exact baseline after Git newline normalization.
They also check that all 59 icon names remain supported.

The Linux CI pipeline builds the exact candidate and baseline separately on the
same runner. It checks TypeScript, targeted lint, the existing eight SEO groups,
the content-preservation tests and the generated import graph. Static gates are:

- all JS chunks remain within the existing 500,000-byte product budget;
- the initial gzip JS graph remains at or below 250 KiB;
- Markdown/KaTeX are absent from the initial graph;
- no Lucide CDN font is requested by the candidate entry HTML.

Only then does Chrome run, exclusively on the GitHub Actions runner. Three fresh
mobile Lighthouse samples per variant alternate their order. Both loopback
servers use identical gzip delivery. Seven public/account/error journeys check
headings, canonical/robots tags, links, rendered course math, screenshots and
mobile client-side navigation, with no uncaught errors or failed first-party
requests. The results include the exact candidate commit and the baseline SHA.

Comparison gates reject LCP regression beyond a 15% measurement tolerance, TBT
regression beyond 100 ms, CLS over 0.1, or less than a 30% reduction in first-party
script transfer. Lighthouse scores and timings remain separately reported; a
preview score is never represented as a new production score.

The browser script refuses to run outside `GITHUB_ACTIONS=true`. No local browser,
window, Computer Use call or local preview server is part of this work. Heavy
compilations and browser audits run on GitHub Actions.

## Release status

The first Linux run, `41662053259` at `74fa08a`, passed TypeScript, targeted lint,
eight SEO groups, four preservation groups and the production build. It correctly
rejected an approximately 686.77 kB minified application entry against the unchanged
500,000-byte chunk budget. Baseline builds and browser measurements were skipped.
The dependency split above addresses that measured failure; the next exact-commit
run must pass the same gates before any performance result is accepted.

This file describes the candidate contract, not a completed deployment. The
exact-run artifacts and its final conclusion are authoritative for local-scope
technical acceptance. Business review, synchronisation to the hosting project,
publication and fresh public measurements remain coordinated release steps.
SEO scores and performance measurements are not estimates of sitelink likelihood.
