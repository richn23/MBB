# MBB Loyalty: handoff for Claude Code

This is a technical handoff for whoever (human or Claude Code) picks up this build next. It assumes no memory of prior sessions. Companion doc: `mbb-loyalty-brief-mvp.md` in the same folder, which covers the non-technical brief (what the page is for, MVP scope, open content decisions). Read that first for context, this doc for the actual code state.

## Where this lives

`C:\Users\richa\Desktop\Meaning Beyond Brands\loyalty\`

Three files: `index.html`, `style.css`, `script.js`. Sibling folders `Assets/` and `images/` hold the images referenced below. This is a sub-section of the existing Meaning Beyond Brands site, served at `/loyalty`, not linked from the main site's nav. Plain static HTML/CSS/JS. No build step, no framework, no npm, no external JS library. One Google Fonts import (Cormorant Garamond + Jost). That constraint should stay: match the main site's plain-static approach, don't introduce tooling.

## Was it built? Yes, fully, and then some

The 7-section page exists, is fully styled, is responsive (spot-checked at 1440x900 and 390x844), and has no HTML/CSS syntax errors. But it went through eleven rounds of visual effects iteration beyond what the MVP needs, driven by a "make it feel like layered paper art" exploration. The client (Richard) has now asked to reset and rebuild toward a simpler MVP. This doc describes the current (over-built) state and what to strip down.

## Current state in detail

### HTML structure (`index.html`)

Seven `<section>` elements in this order, each with class `reveal` (except hero): `hero`, `problem`, `story`, `mechanism`, `insight`, `why-mbb`, `close`. Each non-hero section (and hero) currently opens with two decorative `<div>` children before its real content:

```html
<div class="layer-bg" aria-hidden="true"></div>
<div class="layer-radial tone-light|tone-dark" aria-hidden="true"></div>
```

(Hero and Close have bespoke equivalents instead: `.compass-rings` and `.quiet-glow-wrap` respectively, both doing the same job.)

After the `</section>` elements, there's a `.site-frame` block: four fixed `<div class="frame-edge">` bars (top/right/bottom/left) forming a stationery-paper border around the whole viewport, present on every page as you scroll underneath it.

`<script src="script.js">` closes the body.

### CSS (`style.css`, ~597 lines)

Key systems, in the order they'd need to be touched:

1. **`:root` custom properties**: base palette (sage/navy/gold + variants), frame tokens (`--frame-size`, `--frame-paper`, `--frame-line`), die-cut shadow tokens (`--diecut-light-near/mid`, `--diecut-dark-near/mid`), and 3D depth tokens (`--z-bg: -38px`, `--z-radial: -28px`, `--z-text: -10px`). Keep the palette and frame tokens. The die-cut and 3D tokens are candidates to remove if simplifying (see below).

2. **`html{ scroll-snap-type:y mandatory; }`** plus `scroll-snap-align:start` and `min-height:100svh` on every `section`. This forces the page into 7 discrete "snap pages," each occupying a full viewport height, rather than a normal scrolling document. This is the single biggest structural decision to revisit for MVP: a normal long-scroll page (no snap) is simpler, more forgiving on content-heavy sections (Why MBB currently can overflow past 100svh and just grows, which is a little awkward with snap), and matches what most people expect from a one-page pitch site.

3. **`perspective:1200px` on the generic `section` rule**, plus `translateZ()` on three tiers (`.layer-bg`, `.layer-radial`, and the text content) via the `--z-*` tokens. This is the real CSS 3D depth stack: a literal implementation of a client-supplied cm-based spec (background 1cm back, radial glow 0.25cm forward of that, text 0.5cm forward of the radial). It's genuine 3D, not a visual trick, and it works, but it's presentation polish layered on top of content that doesn't need it to be readable.

4. **The `.reveal` / `.in` / `.out` system**: each section's real content starts at `opacity:0`, translated down and back (`translateZ(var(--z-text)) translateY(70px)`), and script.js toggles `.in` (content settles into place, staggered per child via `transition-delay`) or `.out` (content exits upward) based on scroll position. This is what makes the page feel like "pages" rather than a scroll. Simplifying to MVP likely means keeping a much lighter version of this (a single fade/slide-up on first entering view, no exit animation, no Z depth) or removing it in favor of the content just being visible.

5. **Die-cut shadow tokens** (`--diecut-*`), applied to: hero medallion, story card, mechanism circles, insight rule, founder photo, credibility cards, close emblem. These are just `box-shadow`/`filter:drop-shadow` values giving flat shapes a "lifted paper" look. Cheap to keep even in a simplified build if the paper-craft aesthetic still matters; cheap to strip if not.

6. **`data-depth` scroll-parallax attributes** on: `.atmos-palm`, `.compass-rings` (hero), `.texture-wash` (problem, story), `.quiet-glow-wrap` (close). Driven by script.js's scroll handler, these drift at a different rate than the page as it scrolls, via a `--depth-y` custom property. Removing scroll-snap does not automatically remove the need for this system if you want to keep any parallax at all; if going fully plain, remove the `data-depth` attributes and the JS block that drives them.

7. **Ambient decorative animations, independent of scroll**: the hero's three rotating compass rings plus a soft rotating glow sweep (`spin-cw`/`spin-ccw`, `ring-glow` keyframes), and the close section's slowly rotating `quiet-glow`. These are low cost, self-contained CSS animations, not tied to scroll-snap or 3D depth. Safe to keep regardless of what else gets simplified, if the brand wants a touch of ambient motion.

8. **The fixed stationery frame** (`.site-frame`, `.frame-edge`): independent of everything else above, purely a fixed decorative border. Fine to keep as-is in any rebuild; it doesn't interact with scroll behavior or the 3D stack.

9. **Per-section background gradients**: currently living on each section's `.layer-bg` child rather than the section itself (moved there in round 11 to give it its own Z depth). If `.layer-bg` divs are removed, these gradients need to move back onto the section element directly (`.problem{ background: ...; }` etc, values are unchanged, just the selector target changes).

### JS (`script.js`, 94 lines)

One IIFE. Does three things on a single rAF-throttled scroll/resize handler:
- Toggles `.hero-exit` on the hero based on whether its bottom edge has passed the viewport's vertical centre.
- Toggles `.in`/`.out` on every `.reveal` section the same way (geometry-based, not IntersectionObserver, specifically because a fast scroll-snap jump can skip a page's threshold-crossing callback; this was a real bug caught and fixed in round 9).
- Computes and sets `--depth-y` on every `[data-depth]` element for the parallax drift.

Respects `prefers-reduced-motion`: skips all of the above, just adds `.in` to every reveal section immediately.

If scroll-snap and the reveal/depth systems are removed for MVP, this file likely shrinks to little or nothing (maybe just the ambient CSS animations, which need no JS at all, since they're pure CSS `@keyframes`).

## What needs to be rebuilt for MVP

Given the brief's MVP scope (plain, clean, fast, readable, no effects required to make the point), the concrete rebuild is:

1. Remove `scroll-snap-type` from `html` and `scroll-snap-align`/fixed `min-height:100svh` behavior from `section` (a sensible `min-height` or just natural content height is fine, just not snap-locked). Page becomes a normal scrolling document.
2. Remove `perspective` from `section` and all `translateZ()` uses (the `--z-bg`/`--z-radial`/`--z-text` tokens and every place they're referenced). Delete the "3D DEPTH LAYERS" CSS block and the `.layer-bg`/`.layer-radial` divs from every section in the HTML, moving each section's background gradient back onto the section element directly.
3. Simplify the `.reveal`/`.in`/`.out` system to a single lightweight entrance animation (fade and slight rise, once, first time a section scrolls into view) with no exit animation and no per-child staggering, or remove scroll-triggered reveal entirely if Richard wants the content simply visible on load/scroll like a normal page. This is a judgment call worth a quick check with him rather than assuming.
4. Remove the `data-depth` attributes and the corresponding `--depth-y` logic in script.js, unless keeping a very subtle version is wanted purely for the hero.
5. Keep as-is: the palette/font tokens, the fixed stationery frame, the die-cut shadow treatments (they're cheap and give the flat shapes some dimension without needing scroll effects), and the ambient hero ring rotation/glow sweep (self-contained, doesn't need scroll).
6. Once simplified, re-run the same QA that's been done throughout this project: check HTML tag balance and CSS brace balance, screenshot every section at a desktop and a mobile viewport, confirm no horizontal overflow, and confirm real content (not a decorative layer) is the topmost element at each section's text via `document.elementFromPoint` hit-testing if any positioned decorative element remains, since round 11 hit a real bug there (see "Known gotchas" below).

## Known gotchas worth carrying forward

- **Stacking order**: any `position:absolute` decorative element added as a sibling of plain (static-positioned) text will render on top of that text unless the text's container gets `position:relative; z-index:1` (or higher than the decorative element). This bit Mechanism, Insight, and Why MBB in round 11 the moment decorative layers were added there for the first time. Currently handled via `.mechanism > *, .insight > *, .why-mbb > *{ position:relative; z-index:1; }` plus `.hero > *`, `.problem > *, .story > *`, `.close > *` equivalents elsewhere. If layer divs are removed per the rebuild above, these z-index rules become unnecessary and can go too, but check before deleting: some sections (problem, story) also use them to keep the `.texture-wash` overlay behind text, which is a separate concern from the removed 3D layers.
- **`transform` on an element with a running CSS animation**: a CSS `@keyframes` animation targeting `transform` (like the ring rotations or `quiet-glow`'s spin) fully overrides any other transform set on that same element while it's running. That's why `.quiet-glow` is split into a positioning wrapper (`.quiet-glow-wrap`, handles placement/depth) and an inner element (`.quiet-glow`, handles only the rotation). Keep that split if the rotation is kept; don't try to collapse it back onto one element.
- **JS should never set `el.style.transform` directly** on an element that already has its own transform in CSS (centering, animation, etc). The `--depth-y` custom-property pattern exists specifically to avoid JS silently wiping out an element's own CSS transform. If any scroll-driven JS motion is kept, keep this pattern.
- **Playwright/Chromium path in this sandbox**, if QA is re-run here: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (versioned path; the unversioned `/opt/pw-browsers/chromium/...` path does not exist).

## Standing rules for this project (apply regardless of who builds it)

- No em dashes anywhere: not in page copy, not in code comments, not in docs. Use a period, colon, or comma instead.
- Design crossover with the main MBB site is fine (palette, type, motifs). Copy crossover is not: written copy for this page must be original, never lifted or closely paraphrased from the main site's existing content.
- No AI-generated or custom-illustrated artwork budget for this build. Stick to plain geometric shapes, CSS effects, and the existing image assets listed below.
- When given exact numeric specs (measurements, colors, timing), implement them literally rather than approximating.

## Assets in use

`emblem.png`, `compass-star.png`, `water-sparkle-wide.jpg`, `founder.jpeg`, `atmos-palm.png`, all under `Assets/` or `images/` relative to the loyalty folder. No other images currently referenced.

## Content status

All copy for the 7 sections is written and was approved earlier in the project, with one loose end: the "Why MBB" founder line has two slightly different versions between the live HTML and an older doc (`mbb-loyalty-full-copy-v1.md`). Needs Richard to confirm which is final before this is considered locked. Separately, the close section currently ends on a statement with no actionable next step (no link, no contact prompt); what that should be is still an open question for Richard, not a technical gap.

## Suggested order of operations for the next build session

1. Confirm with Richard: proceed with the strip-down described above, and get his answer on the founder line and the close section's call to action.
2. Strip scroll-snap and the 3D layer system first (biggest structural change, touches every section).
3. Simplify or remove the reveal/exit animation system.
4. Remove now-dead JS (`data-depth` handling) if no parallax is being kept.
5. Re-run the QA pass described above.
6. Ship, then treat any of the removed effects work as a possible "phase 2, once the core page is signed off" item, not a lost cause, since the code for it already exists.
