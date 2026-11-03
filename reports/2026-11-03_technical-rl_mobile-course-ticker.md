# The Pricing Library — mobile course and illustrative ticker

This separate candidate starts from the performance-validated commit
`bbd3438437084808156f2dc95346f3f5de33791c`, preserving that commit, its branch and
the full measurements from run `41664091429`.

Independent business review identified two inherited presentation issues in the
412×823 mobile captures: the Black-Scholes curriculum panels extend past the
right viewport edge, and the mock ticker is presented beside hardcoded market
open/session labels without a visitor-visible illustration label.

The bounded correction gives the course grid and its children a zero minimum
track width and lets the flex description text wrap. It does not hide overflowing
course content. The two status strings become `ILLUSTRATIVE DATA` and `NOT LIVE`,
with an amber decorative dot. Ticker values, clock logic, course contents,
calculations, prices, metadata and navigation are preserved.

The CLI content contract permits only those exact three string substitutions in
TopStrip; all other unchanged function and catalogue checks remain in force.
CI retains TypeScript, lint, SEO, content/icon and built-asset budgets. The existing
500,000-byte chunk budget remains applicable.

Targeted headless Chrome checks run exclusively on GitHub Actions. Both exact
builds are compared at 320, 412, 768 and 1440 CSS pixels on Home and Black-Scholes.
The candidate must keep the illustration labels visible, keep the curriculum
grid/panels/buttons/text within the viewport without clipping, and retain all four
selectable modules. Titles, headings, canonical/robots tags, links, course text
and mathematics must match the baseline. Captures and element bounds are retained.

This is a targeted presentation check; it does not rerun the six Lighthouse
measurements, claim new production metrics, certify every course or infer any
sitelink probability. No local browser, preview server, GUI or Computer Use is
used. Production publication and independent business acceptance remain separate.
