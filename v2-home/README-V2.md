# Homepage V2 — what changed and why

This folder is a self-contained, separate homepage. `index.html`, `v2/`, and
everything else at the project root are untouched. Nothing here goes live
until it's explicitly promoted.

## The one architectural change that matters

V1's cinematic intro used `position: fixed` layers sitting inside an empty
`1200vh` spacer, with a single scroll-percentage (`scrollY / documentHeight`)
driving every timing window on the page — including sections far below the
intro. That global coupling is what caused two things we diagnosed together:
a "dead" stretch of scroll between the Quote and Framework where nothing was
happening, and a hard, un-choreographed cut from the atmospheric intro to a
flat page the instant Framework's section (with its own opaque background)
appeared on top of the still-fading environment layers.

V2 replaces that with a `position: sticky` "cinema" stage (`.cinema` /
`.cinema-stage` in `index.html`). Its scroll progress is computed from its
own height only (`getCinemaProgress()` in `main.js`), not the document's.
Hero, Purpose, Quote, and Inspiration all live inside this one stage and
share the same environment layers — Inspiration is the last movement of the
cinema, not the first section of a new page, so there's nothing to "cut off"
between them. When the stage runs out of room, it un-sticks naturally and
real scrolling begins with the Question beat — the hand-off is a property of
CSS sticky positioning, not a hand-tuned percentage gate.

Below the cinema, everything is a normal, real, scrollable document, revealed
with `IntersectionObserver` rather than per-frame polling — lighter than
V1's approach and there's nothing left to go stale as the page grows.

## Specific fixes from our conversation

- **The dead scroll gap** — gone by construction; the cinema's own height is
  the only thing that determines its pacing.
- **Quote → Inspiration overlap** — a deliberate ~2% crossfade (see the
  `SCENES` timing map in `main.js`), unlike the hard Purpose→Quote cut, on
  purpose: Inspiration continues the Quote's thought rather than replacing
  it.
- **The "running head"** — one persistent gold hairline-and-star motif
  (`#motif`) inside the cinema, rather than each scene redrawing its own
  label inconsistently (V1 had this in ink on Purpose, gold on Framework,
  and missing entirely on the Quote).
- **Shared measure at the seam** — Quote, Inspiration, and the Question
  pull-quote all use the same `--measure` column width and centred
  alignment, so the eye doesn't jump position exactly where continuity
  matters most.
- **Perspectives** — pearls carry no on-pearl text anymore. A single shared
  caption below the cluster shows title + date for whichever pearl has
  hover/focus. Same organic pearl positions and sizes as V1.
- **About / Contact** — each gets one short new connective line before its
  existing content (`about-hinge`, `contact-close` in `index.html`). These
  two lines are the only invented copy anywhere in V2 — flagged here
  specifically so they get a look before anything ships.

## What's identical to V1

All copy (Hero, Purpose, Quote, Framework, Pillars, About's three
paragraphs). All imagery and assets. All brand colours, typography, and the
gold hairline/compass-star motif language. The organic Perspectives pearl
cluster (same coordinates, same hover behaviour). The contact form's
validation and Formspree submission logic, ported as-is.

## How to preview

Locally: open `v2-home/index.html` directly in a browser, or serve the
project root with any static server (e.g. `npx serve .`) and visit
`/v2-home/`.

Once pushed (same Cursor workflow as before — this folder just needs to be
added and committed), it'll be live at `mbb-one.vercel.app/v2-home/`
alongside the untouched current homepage at `mbb-one.vercel.app/`. There's a
`noindex` meta tag in `index.html` so it won't get indexed while it's a
review build — remove that line when/if this is promoted to replace V1.
