---
name: Egyphoria — The Continental Timetable
description: A departures-board homepage for private Egypt trips — real tables, real prices, one reserved yellow action, six languages.
colors:
  signal-blue: "#0b2f6b"
  signal-blue-dark: "#082352"
  signal-blue-tint: "#b9c7e6"
  sun-yellow: "#f2c10f"
  sun-yellow-dark: "#d1a70d"
  ink: "#15181d"
  paper: "#ffffff"
  muted: "#55606c"
  hairline: "#cfd6e3"
typography:
  display:
    fontFamily: "Archivo Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(2.6rem, 4.6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(2rem, 3.2vw, 2.8rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo Narrow, Roboto Condensed, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Archivo, Roboto, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Archivo, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "0.08em"
spacing:
  container-max: "1200px"
  container-gutter: "6%"
components:
  button-primary:
    backgroundColor: "{colors.sun-yellow}"
    textColor: "{colors.ink}"
    typography:
      fontFamily: "Archivo Narrow, Roboto Condensed, sans-serif"
      fontWeight: 700
      fontSize: "15px"
    padding: "16px 28px"
  button-primary-hover:
    backgroundColor: "{colors.sun-yellow-dark}"
  button:
    backgroundColor: "{colors.signal-blue}"
    textColor: "#ffffff"
    typography:
      fontFamily: "Archivo Narrow, Roboto Condensed, sans-serif"
      fontWeight: 700
      fontSize: "15px"
    padding: "16px 24px"
  button-hover:
    backgroundColor: "{colors.signal-blue-dark}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.signal-blue}"
  text-link:
    textColor: "{colors.signal-blue}"
    typography:
      fontFamily: "Archivo, Roboto, sans-serif"
      fontWeight: 600
      fontSize: "14px"
  lang-cell-current:
    backgroundColor: "{colors.sun-yellow}"
    textColor: "{colors.ink}"
    typography:
      fontFamily: "Archivo Narrow, Roboto Condensed, sans-serif"
      fontWeight: 700
      fontSize: "12px"
    width: "34px"
    height: "28px"
---

# Design System: Egyphoria — The Continental Timetable

## Overview

**Creative North Star: "The Continental Timetable"**

Egyphoria's homepage sells a private Egypt trip the way Europeans already trust travel: as an honest board of places, days, prices and connections, in the visual language of Cook's Continental Timetable and the classic European departures board. It refuses the category default — no full-bleed pyramid photo with a search box floating over it. Instead, signal blue fields own whole regions of the page (the header band, the board's top rule, the builder strip, the footer) the way a station's livery owns its concourse, white carries the boards themselves, and one sun-yellow is spent on exactly the things a traveller needs to notice fast: the primary action and the row they're looking at.

The system is dense with real information and light on decoration. Every number on the page — a day count, a price, a month range — is set in tabular figures so it lines up like a printed schedule. Real `<table>` markup carries the departures board and the destinations list because this is tabular data, not a design metaphor to fake with divs. The one authored flourish is restrained: board rows settle into place top-to-bottom on first paint, like flaps dropping into a split-flap display, then the page goes still. Station photography appears only in the gaps between boards, full-bleed, captioned, never behind text.

**Key Characteristics:**
- Signal blue owns regions; it is not a decorative accent, it is a background material.
- Sun-yellow is rationed to the primary action, the active board row, and the current-language cell — nowhere else.
- Real `<table>`s for real tabular content; no div-grid impersonating a table.
- Every figure (price, days, months) in tabular numerals.
- Zero border-radius anywhere in the system; hairline rules do the separating work a shadow or a rounded card would otherwise do.
- One authored motion moment (the board settle), switched off completely under `prefers-reduced-motion: reduce`.

## Colors

A two-color chromatic system — one dominant field color, one tightly rationed accent — laid over ink-on-paper neutrals with a single hairline gray for rules.

### Primary
- **Signal Blue** (`#0b2f6b`): the field color. Fills the header band, the footer, the builder strip, and the departures board's top rule. It is the default action color too (`.button`, nav links, text-links) — blue is "normal," not special.

### Secondary
- **Sun Yellow** (`#f2c10f`): reserved, per the direction contract, for exactly three things — the primary CTA (`button-primary`, "Build my itinerary"), a departures-board row on hover/focus, and the current-locale cell in the language switcher. Its rarity is the point.

### Neutral
- **Ink** (`#15181d`): body text, headings, and the text color that sits on sun-yellow (`--yellow-ink` is the same value as `--ink`).
- **Paper** (`#ffffff`): the page background and the board surface.
- **Muted** (`#55606c`): standfirst copy, table captions/labels, secondary metadata (best-months, section leads).
- **Hairline** (`#cfd6e3`): every rule, border and divider in the system — table row separators, column-header underlines, chip borders, footer top-rule.

### Named Rules
**The One Yellow Rule.** Sun-yellow appears in exactly three places on the homepage — the primary action button, the hovered/focused departures-board row, and the current-language cell — and nowhere else. It never decorates a heading, a badge, or a photo caption.

## Typography

**Display/Board Font:** Archivo Narrow (500/700, self-hosted via `next/font/google`, `display: swap`) — with Roboto Condensed (500/700, `subsets: ['greek']`) layered in as the same CSS variable stack's second font, for Greek glyphs Archivo Narrow doesn't ship.
**Body Font:** Archivo (400/500/600) — with Roboto (400/500/600, `subsets: ['greek']`) layered the same way.

**Character:** A condensed, heavy-set display face for the board, the H1, and every number gives the page a boarding-pass authority; a plain, evenly weighted humanist sans carries the reading copy so the honesty of the standfirst and section text doesn't compete with the board.

### Hierarchy
- **Display** (700, `clamp(2.6rem, 4.6vw, 4.5rem)`, line-height 1.08, letter-spacing -0.02em): the H1 only — "Private Egypt tours, planned around your dates" and its per-locale equivalents.
- **Headline** (700, `clamp(2rem, 3.2vw, 2.8rem)`, line-height 1.08): every H2 — "How a week in Egypt lays out," "Destinations, by the days they deserve," "Build your itinerary," etc.
- **Title** (700, ~1.15–1.3rem): the board's place name (`.board-row-place`), week-strip station names (`.week-place`), founders' names (`.founders-names`).
- **Body** (400/500, ~1.05–1.15rem, line-height 1.6–1.75, ink or muted): the standfirst, section leads, week/founders paragraphs; capped around 36–38rem for line length.
- **Label** (600, 12px, letter-spacing 0.06–0.08em, uppercase, muted): table column headers on both the departures board and the destinations table.

### Named Rules
**The Tabular Numbers Rule.** Every price, day count and month range in the departures board and destinations table sets `font-variant-numeric: tabular-nums` — figures line up column-to-column the way a printed timetable's do.

**The Greek Understudy Rule.** Archivo Narrow and Archivo ship no Greek subset on Google Fonts. Roboto Condensed and Roboto, loaded `subsets: ['greek']` only, sit *after* the Archivo variables in the `--serif`/`--sans` stacks (`app/globals.css`). Font-stack fallback resolves per glyph, not per element, so Latin text keeps rendering in Archivo and only the Greek characters Archivo can't draw fall through to the Roboto pair — a page in `/el` is Archivo Narrow-shaped with a handful of true Greek glyphs standing in.

## Layout

The Continental Timetable's own sections (`home-intro`, `board-wrap`, `home-section`, `destinations-board`) share one container: **max-width 1200px at 6% side padding**. This is narrower than the site's older container (`1800px`/`7%`, still used by the footer, the trip grid, and pre-existing pages) — the new homepage is deliberately a single readable column of boards, not the wide grid the rest of the site uses.

Responsive behavior is table-first, not card-first:
- **≤900px** — the header's keyword menu collapses into a hamburger overlay (`#main-nav.open`, blue-dark background); language cells grow from 34×28 to a wrapped 44×44 touch target.
- **≤820px** — the departures board and its `<thead>` disappear; each row becomes a stacked two-line "flap" (place/title, then days · price · months inline), and the arrow column is dropped entirely. The week strip's stations stack vertically too.
- **≤640px** — the intro row (H1 + CTA) stacks instead of sitting side-by-side; the builder form's padding shrinks; notices-board rows stack their link and label.

**Motion — the one authored moment.** Departures-board rows animate `board-settle` on first paint: `translateY(12px)→0` with `opacity 0→1`, 420ms, `cubic-bezier(.16,1,.3,1)` (exponential ease-out), staggered 40ms per row via an inline `--i` custom property. This is gated behind `@media (prefers-reduced-motion: no-preference)` and the whole system additionally zeroes every transition and animation under `prefers-reduced-motion: reduce`. It replaces an older scroll-triggered `data-reveal`/`RevealOnScroll` scatter that the ticket explicitly removed from the homepage (that component still mounts once from `[lang]/layout.tsx` for other pages).

## Elevation & Depth

Flat by default. The homepage's own surfaces — the board, the builder strip, the founders section, the notices board — carry no `box-shadow` anywhere; depth and separation come from color fields (blue bands owning a region outright) and hairline rules, not from shadows or blur. The two exceptions in the codebase both sit outside this world: the legacy journal index's `.post-card:hover` (`box-shadow: 0 22px 50px rgba(11,20,30,.12)`), and `dialog::backdrop`'s `backdrop-filter: blur(5px)` on the itinerary/plan dialogs — untouched carry-overs, not part of the Continental Timetable's own vocabulary.

### Named Rules
**The Flat Board Rule.** A named-color surface (blue band, white board, yellow row) is flat at rest and stays flat on hover — state changes color, never elevation.

## Shapes

Every corner in the system is square. There is no `border-radius` declared anywhere in `app/globals.css` — not on buttons, chips, table cells, photos, or the language cells. Hairline 1px rules (`#cfd6e3`) do the separating work a rounded card or a shadow would otherwise do: table row dividers, column-header underlines, chip borders, the dashed rule between week-strip connections, the footer's top rule.

### Named Rules
**The Square Corner Rule.** Nothing rounds. A button, a chip, a table row, a photograph and a language cell are all right-angled; the only permitted "shape" event is a 1–2px hairline or a full-bleed photo edge.

## Components

### Buttons
- **Shape:** square, 1px solid border in the button's own fill color, no radius.
- **Primary** (`button-primary`): sun-yellow background, ink text, `16px 28px` padding, Archivo Narrow 700 15px. Reserved solely for "Build my itinerary" and the builder's submit — the homepage's one CTA.
- **Hover/Focus:** primary darkens to `#d1a70d` (`--yellow-dark`) and lifts `translateY(-2px)`; global focus ring is a 3px solid outline in blue, swapped to yellow inside `header`/`footer` where blue would sit invisibly on blue.
- **Secondary** (`.button`, plain, no modifier): signal-blue fill, white text, `16px 24px` padding — the site's ordinary action color everywhere else a CTA isn't the homepage's one reserved yellow moment.
- **Ghost** (`.button.ghost`): transparent fill, blue border and text; inverts to solid blue on hover.
- **Text link** (`.text-link`): no fill; blue text with a 1px hairline underline that solidifies to blue on hover.

### Chips
- **Style:** square, 1px hairline border, transparent background when unselected — used for the builder's destination "stations" and interest toggles.
- **State:** the underlying checkbox is visually hidden and stretched over its `<span>` for the full click target; `:checked` fills the chip signal-blue with white text; `:focus-visible` adds the standard 3px blue outline.

### Inputs
- **Style:** 1px hairline border, transparent background, ink text, `11px 12px` padding, no radius — the builder's day-count number input and pace `<select>`.
- **Focus:** the global 3px solid outline (blue, offset 3px).

### Navigation
- **Header:** signal-blue band; white wordmark "Egyphoria" set in Archivo Narrow 700 22px; a keyword-named menu ("Egypt tours," "Destinations," "Trip cost," "Journal," "Help," "Contact" — real search terms, not generic labels) at 14px/500, `opacity .92→1` plus an underline on hover.
- **Language switcher:** six two-letter cells in a row (`EN NL FR EL TR ES`), each a real `<a hreflang>`, 34×28px with a 1px translucent-white border; the current locale's cell is filled sun-yellow with ink text (`.lang-cell-current`) — the departure-board convention for a platform/language code, deliberately not a dropdown.
- **Mobile (≤900px):** the menu and language row collapse behind a hamburger into a blue-dark overlay panel; language cells grow to 44×44 touch targets.

### Departures Board (signature component)
The homepage's central device: a real `<table>` (with a visually-hidden `<caption>` and `<th scope="col">` headers) listing all eight trips — PLACE · DAYS · FROM (pp) · BEST MONTHS · a bare arrow column. The PLACE cell carries two lines (bold real place name, e.g. "CAIRO · LUXOR · ASWAN," over a smaller muted poetic trip title, e.g. "Egypt, unfolded"). Each row is one link, stretched to cover the whole row via an `::after{position:absolute;inset:0}` pseudo-element rather than an absolutely-positioned anchor, so the row is fully clickable/keyboard-focusable without nested interactive elements and without the link's own text overflowing into neighboring columns. Hover/focus turns the entire row sun-yellow. Below 820px, the header disappears, the arrow column is dropped, and each row becomes a stacked two-line "flap." This is the page's one authored motion moment (see Layout).

## Do's and Don'ts

### Do:
- **Do** keep every route under `/{lang}/` — there is no locale-free homepage path.
- **Do** reserve sun-yellow for exactly three things: the primary CTA, the hovered/focused board row, and the current-language cell.
- **Do** render tabular content (the departures board, the destinations list) as a real `<table>` with `<caption>`/`<th scope>`, not a div-grid pretending to be one.
- **Do** set `font-variant-numeric: tabular-nums` on every price, day count, and month range.
- **Do** layer Roboto Condensed/Roboto *after* Archivo Narrow/Archivo in the font stack for the Greek subset, so Latin glyphs stay in Archivo and only Greek falls through.
- **Do** keep the board-settle motion as the only authored animation, gated behind `prefers-reduced-motion`.
- **Do** render founders/reviews content only when `content/founders.json` / `content/reviews.json` actually has it — no image, no section, no schema when the data is empty or null.

### Don't:
- **Don't** add an eyebrow/kicker above the H1 or any H2 on this homepage — headings carry themselves. (Older, not-yet-migrated pages — `/journal`, `/destinations`, `/about` — still use `.eyebrow`; don't extend that pattern into the Continental Timetable world.)
- **Don't** build icon-card scaffolds (icon + heading + short text in a tile) — tables and rows are the structure here, not cards.
- **Don't** apply gradient text anywhere in this system.
- **Don't** run a hero image or photograph behind the H1 or the board — station photography is full-bleed and appears only *between* boards, never behind text.
- **Don't** round any corner — there is no `border-radius` in this system; buttons, chips, and table cells all stay square.
- **Don't** add a drop shadow to a homepage surface — depth comes from color fields and hairline rules only, not `box-shadow`.
- **Don't** invent a trip price, a founder photo, or a review quote/count — render the owner-supplied JSON/data exactly as given, or render nothing at all.
