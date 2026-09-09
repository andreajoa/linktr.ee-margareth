# Scroll Craft — Redesign Progress

Branch: `feat/scrollcraft-homepage`

## Progress

**15% — Architecture + journey mapped**

- [x] Inspect existing repository structure
- [x] Preserve static HTML + existing `/api`, `/dashboard`, `analytics.js`, privacy route and Vercel config
- [x] Inventory existing visual assets and working destination links
- [x] Define Scroll Craft journey, page grammar and feeling curve
- [ ] Implement new desktop art direction
- [ ] Implement motion system and signature move
- [ ] Implement mobile art direction
- [ ] Preserve analytics, accessibility and reduced-motion behavior
- [ ] Verification pass: HTML/CSS/JS integrity, links, responsive states, motion/reduced motion
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

`NAV → HERO → FEATURED STORY → FREE TOOL → PRODUCTS → EMOTIONAL PAUSE → RESOURCE GRID → SPECIALTIES → FOOTER`

## Feeling curve

`Curiosity → Recognition → Trust → Relief → Possibility → Confidence → Action`

## Signature move

A subtle warm **living thread** travels through the experience: copper/terracotta glow, botanical micro-motion and scroll-reactive highlights that visually connect hero, cards and section transitions without becoming distracting.

## Fingerprint gate

The page must still feel unmistakably Margareth Almeida:

- deep navy foundation;
- cream/blush editorial surfaces;
- terracotta/caramel emphasis;
- elegant serif + clean sans-serif hierarchy;
- human, family-centered language;
- real Margareth portrait and real product assets;
- no generic SaaS aesthetic;
- no excessive glassmorphism or neon effects.

## Mobile art direction

Mobile is composed, not merely stacked:

- compact sticky navigation;
- portrait and book spotlight re-balanced above the fold;
- horizontal snap products/resources where useful;
- motion amplitude reduced;
- large touch targets;
- no custom cursor;
- CTA hierarchy retained.

## Verification target

100% only after: markup sanity, all primary destinations preserved, no missing local assets, no horizontal overflow at phone width, reduced-motion support, keyboard focus states, analytics script retained, and branch diff reviewed.
