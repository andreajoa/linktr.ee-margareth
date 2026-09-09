# Scroll Craft — Redesign Progress

Branch: `feat/scrollcraft-homepage`

## Progress

**75% — Visual system + motion implemented**

- [x] Inspect existing repository structure
- [x] Preserve static HTML + existing `/api`, `/dashboard`, `analytics.js`, privacy route and Vercel config
- [x] Inventory existing visual assets and working destination links
- [x] Define Scroll Craft journey, page grammar and feeling curve
- [x] Implement new desktop art direction
- [x] Implement motion system and signature move
- [x] Implement mobile art direction
- [x] Preserve analytics loading, existing destination links and reduced-motion behavior
- [ ] Verification pass: DOM assumptions, CSS/JS integrity, branch diff, responsive/fallback states
- [ ] Final compare/review

## Journey

1. **Welcome / recognition** — immediate human connection and trust.
2. **Authority with warmth** — Margareth, positioning and specialties.
3. **Featured story** — book as emotional entry point.
4. **Free value first** — CAA NEURO as an immediate useful action.
5. **Resource discovery** — premium product cards with clear outcomes.
6. **Emotional reassurance** — mission statement / family-centered message.
7. **Utility hub** — fast access to articles, store, screening, materials and contact.
8. **Close with confidence** — specialties, social proof cues and WhatsApp.

## Page grammar

`HUMAN WELCOME → HERO + FEATURED BOOK → FREE TOOL → PRODUCTS → EMOTIONAL PAUSE → RESOURCE GRID → SPECIALTIES → FOOTER`

## Feeling curve

`Curiosity → Recognition → Trust → Relief → Possibility → Confidence → Action`

## Signature move

A subtle warm **living thread** travels through the experience: copper/terracotta glow, botanical micro-motion and a scroll-reactive SVG line visually connect the journey. Pointer parallax is low-amplitude and desktop-only; product tilt is deliberately restrained.

## Fingerprint gate

The redesign keeps the page unmistakably Margareth Almeida:

- deep navy foundation;
- cream/blush editorial surfaces;
- terracotta/caramel emphasis;
- Cormorant Garamond + Montserrat hierarchy;
- human, family-centered language;
- real profile image and existing real product/book assets preserved in the original DOM;
- no generic SaaS aesthetic;
- no KIE;
- no excessive neon or glassmorphism.

## Mobile art direction

Mobile is composed, not merely stacked:

- hero changes composition rather than only shrinking;
- portrait and featured book rebalance vertically;
- product cards use horizontal snap browsing;
- resources collapse to a one-column touch-friendly utility list;
- motion amplitude is removed/reduced for touch and `prefers-reduced-motion`;
- custom cursor from the previous page is disabled;
- CTA hierarchy remains clear.

## Architecture decision

Instead of replacing the 235 KB monolithic `index.html`, the redesign is implemented as a progressive enhancement layer:

- `scrollcraft.css` — visual system and responsive art direction;
- `scrollcraft.js` — DOM orchestration, journey composition and motion;
- `analytics.js` — keeps its analytics logic and now loads the Scroll Craft enhancement layer.

This preserves the working static architecture, existing APIs, dashboard, analytics behavior, embedded book artwork, product links and current assets.

## Verification target

100% only after: branch diff reviewed, enhancement files resolve, DOM selectors match the existing page, analytics/dashboard remain isolated, reduced-motion works, and no destructive changes to the original page structure are required.
