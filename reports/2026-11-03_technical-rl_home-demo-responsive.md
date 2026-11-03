# The Pricing Library — Home layout and demonstration clarity

This separate branch starts from the validated course/ticker commit
`261e0ee4bc8159e8c749e7be22db508d6231721b`. Both previous candidate branches and
their exact-run evidence remain preserved.

The course/ticker captures establish an inherited Home document width of 428px
at 320px and 412px viewport widths. The 320px capture visibly clips the hero title,
description and calls to action. Source inspection also finds a hardcoded `LIVE`
label and `15:42:18` clock inside HeroBlock's demonstration terminal.

Before any presentation CSS correction, a cloud-only diagnostic run records
actual hero/grid/toolbar/chart, section, footer and newsletter dimensions, computed
grid tracks, minimum widths, scroll extents and viewport outliers. It captures the
full Home page and hero at 320, 412, 768 and 1440 CSS pixels. Product source is
unchanged in this diagnostic commit. A diagnostic PASS certifies only the
retained course/ticker gates, not a corrected or accepted Home layout.

The eventual bounded correction must address the confirmed elements rather than
hide body overflow, and must label the terminal as a demonstration without adding
market data or changing calculations, courses, prices or business logic. Existing
SEO/content and built-asset budgets remain in force. No six-run Lighthouse
campaign, local browser, local preview server or production publication is part
of this separate presentation correction.
