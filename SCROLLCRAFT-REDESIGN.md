# Scroll Craft Redesign — Margareth Almeida

## Project type
WEB — existing static HTML/Vercel project. Preserve the current architecture, analytics, API, dashboard and privacy routes. No framework migration.

## Journey
1. **Reconhecimento:** welcome bar + hero tells the visitor immediately who Margareth is and who the page supports.
2. **Confiança:** portrait, specialties and clear neurodevelopment positioning establish professional authority without losing warmth.
3. **Generosidade:** CAA NEURO becomes the first major value exchange and is explicitly free.
4. **Possibilidade:** products/resources appear as outcomes and practical tools, not a generic link list.
5. **Vínculo:** mission band slows the page and introduces an emotional pause.
6. **Ação:** resource grid and WhatsApp close with clear next steps.

## Page grammar
- Welcome cue
- Sticky identity/navigation
- Hero: promise + portrait + featured book
- Free resource spotlight
- Paid/product highlights
- Mission/values pause
- Utility resource grid
- Expertise proof
- Contact/footer

## Feeling curve
Warm welcome → recognition → confidence → generosity → curiosity → emotional connection → clarity → action.

## Signature move
A subtle **“caminho de possibilidades”** scroll rail on desktop, paired with a top progress line. Motion is tied to navigation/progress, not decoration. Scroll reveals, restrained parallax and card tilt reinforce depth.

## Fingerprint gate
The experience is only accepted if these identity fingerprints remain visible throughout:
- Deep navy editorial base
- Cream/blush surfaces
- Terracotta/copper action accents
- Cormorant Garamond editorial headlines + Montserrat support type
- Organic botanical line work / circular paths
- Warm, family-centered imagery
- Rounded premium cards with restrained shadows
- Copy built around acolhimento + ciência + possibilidades

## Mobile art direction
- Hero becomes a deliberate vertical story, not a shrunk desktop grid.
- Portrait remains a major visual anchor.
- Book becomes a compact two-column spotlight.
- Product cards become horizontal snap cards for thumb browsing.
- Resource links become a single readable column.
- Desktop-only scroll rail and decorative leaves are removed.
- Hover-only effects are disabled naturally on touch devices.

## Motion system
- IntersectionObserver reveal with staggered children.
- Scroll progress line + journey dot.
- Desktop pointer parallax on hero portrait.
- Gentle pointer tilt on book/product cards.
- Ambient background orbs.
- `prefers-reduced-motion` disables decorative motion and reveals content immediately.

## Verification pass
- [x] Preserve static project architecture and `/analytics.js`.
- [x] Preserve existing destinations and add explicit tracking labels.
- [x] Reuse existing product assets where available.
- [x] Add only lightweight WebP visual crops where needed.
- [x] No KIE dependency.
- [x] HTML parsed with no duplicate IDs or missing image alt text.
- [x] All `_blank` links include `noopener`.
- [x] Inline JavaScript passes `node --check`.
- [x] CSS parses without syntax errors.
- [x] Desktop layout verified at 1440px with no horizontal overflow.
- [x] Mobile layout verified at 390px with no document horizontal overflow.
- [x] Reduced-motion support present.
- [x] Images use fixed dimensions and lazy loading below the fold.
