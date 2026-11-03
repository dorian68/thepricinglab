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

## Confirmed cause and bounded correction

The diagnostic run `41668237020` at `32b7e82` measured the Home hero grid at
266/358px client width for the 320/412px viewports, but its automatic minimum track
at 400.516px. Both hero children extend from 27px to 427.516px. The terminal's
nowrap rows include a 399.516px Greek strip. Other section grids and the footer
remain within the viewport. Full-page, hero and computed-style evidence is
preserved in that exact-run artifact before any product edit.

The correction changes only the hero grid's track minima and its nested grid
children's minimum widths, and permits the existing terminal rows to wrap. It
does not add body overflow hiding, hide the demo or remove its content. The
terminal's two hardcoded status/time strings become `● DEMO` and `ILLUSTRATIVE`,
with amber rather than green status styling. All numbers, charts and calculation
logic are retained.

The AST contract allows only those exact two label substitutions in HeroBlock.
Cloud acceptance retains the course/ticker checks and adds strict Home document,
hero/title/description/CTA/KPI/terminal/chart bounds and non-clipping checks at all
four widths, plus explicit visible demo labels. Hero copy, metadata, links and
course mathematics must match the baseline. Full-page and hero captures are
available for independent business review. A new exact-commit run is required
before any corrected Home acceptance is claimed.

The first product run, `41669137017` at `63cbe85`, passed all static/build/loading
gates. At 320px the hero is now 266px wide with a 222px title and no clip, but the
strict document-width gate exposed a remaining 367px document: the Home Community
header action ends at 367.16px. The final CTA's nonwrapping action row also places
its buttons outside its panel, where inherited overflow hiding conceals them.
The follow-up correction adds two exact layout hooks (`home-page` and
`home-final-cta`), wraps Home section headings, and stacks the final CTA on narrow
screens. Text, prices, links and logic remain unchanged and the AST contract
permits only those exact class additions. The final CTA's heading, copy, action
row and individual links receive explicit non-clipping and viewport checks; its
absolute decorative sigma may remain clipped inside the panel as before.
Those copy/action rectangles must also stay inside the CTA panel itself, whose
overflow is hidden, in addition to the viewport. Element captures of the final
CTA and Community header accompany the full-page and hero captures.
