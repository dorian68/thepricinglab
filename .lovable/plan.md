

## Restore Hero Image on Homepage

The previous version had a **2-column hero layout** with a trading terminal image on the right side. The current hero is text-only (single column).

### What to restore

In `src/pages/Home.tsx`, change the hero section from single-column to a 2-column grid (`md:grid-cols-2`), and add back the image block on the right:

- Unsplash trading image (`https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3`) as a CSS background
- Dark overlay with brightness/contrast filters
- Centered "TRADING TERMINAL ACTIVATED" badge with the brand accent border
- `aspect-[4/3]` ratio, rounded corners

### File changed
- `src/pages/Home.tsx` — hero section only, lines 55-82

No other changes. All content, routing, and styling preserved.

