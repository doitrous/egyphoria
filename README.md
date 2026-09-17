# Egyphoria

Egypt tour itineraries, trip pages, a journal, and an itinerary builder — a Next.js 16 (App
Router) site wired to [seo-runtime](https://github.com/doitrous/seo-runtime)
(`@omary98/seo-runtime-core` + `@omary98/seo-runtime-next`, pinned at `0.1.6`), built from
`doitrous/site-template`. Renders correctly with no hub configured — every route falls back to a
sensible default — and picks up real metadata, entity JSON-LD, and hub-pushed journal articles the
moment `SEO_HUB_URL`/`SEO_HUB_SECRET` are set and a snapshot has synced.

Six locales: `en` (default), `nl`, `fr`, `el`, `tr`, `es`, served at `/{lang}/...`. `/help`,
`/tools/*`, `/authors/*` and `/editorial-guidelines` are locale-free (`?lang=` instead of a path
segment), per the template's own contract.

## Run it locally

```bash
npm install
cp .env.example .env.local        # fill in SITE_URL; leave SEO_HUB_* blank to run with no hub
npm run dev
```

Then check `/en`, `/el/trips/giza-day`, `/en/destinations/giza`, `/help`, `/tools/trip-cost`.

## Environment variables

See `.env.example` for the full list. In short: `SEO_HUB_URL`/`SEO_HUB_SECRET`/`SEO_SITE_SLUG` are
all optional until this site has a hub profile; `SITE_URL` is the public origin (no trailing
slash); `PAYTABS_PROFILE_ID`/`PAYTABS_SERVER_KEY`/`PAYTABS_REGION`/`PAYTABS_CURRENCY` are the same
names the old static build used, for the "Book this journey" checkout flow.

## Where content lives

| I want to… | Edit |
|---|---|
| Change a trip's price | `lib/trips.ts` → `TRIP_PRICES` (also update `app/api/paytabs/create/route.ts`'s own `PRICES` map — see below) |
| Reword UI strings (English) | `content/i18n/en.json` |
| Translate UI strings | `content/i18n/<lang>.json` |
| Edit trip/destination copy (English) | `content/i18n/en.trips.json` |
| Translate trip/destination copy | `content/i18n/<lang>.trips.json` |
| Add a journal post | `content/journal/<slug>.json` (English only today — see TODO below), then register it in `lib/journal.ts`'s `LOCAL_JOURNAL` map |
| Edit a help entry | `content/help/<slug>.json`, registered in `lib/help.ts`'s `LOCAL_HELP` map |
| Edit the trip-cost calculator | `content/tools/trip-cost.json` (one entry per locale) |
| Edit the author bio | `content/authors.json` → `egyphoria-editorial` |
| Restyle | `app/globals.css` (the original design's CSS, ported byte-for-byte, plus a clearly marked "new utility classes" section at the bottom) |
| Client-side behaviour (scroll reveal, itinerary builder, plan dialog) | `components/*.tsx` |

`app/api/paytabs/create/route.ts` keeps its own server-authoritative `PRICES` map rather than
importing `lib/trips.ts`'s — deliberate duplication across the trust boundary (a payment route
should never trust a value it didn't define itself); keep the two in sync by hand.

### Destinations vs. the old site's six place keys

The old static build's `trips.mjs` has six destination keys (`cairo`, `luxor`, `aswan`, `redsea`,
`desert`, `alexandria`). The ticket asked for seven destination pages (`cairo`, `giza`, `luxor`,
`alexandria`, `nile`, `desert`, `red-sea`). `lib/trips.ts` documents the mapping in full
(`DESTINATION_SOURCES`): `cairo` is split into a `cairo` city destination and a `giza` plateau
destination by re-slicing the original `cairo` activity list (no invented content — every activity
already existed), and `aswan` is renamed `nile`. The itinerary builder still plans against the
original six raw keys (`lib/trips.ts`'s `getRawDestinations`) since splitting for SEO has no
reason to fragment the trip planner's own activity pool. `test/trips.test.ts` verifies the split
loses and duplicates nothing.

## Homepage

`app/[lang]/page.tsx` (V2-PHASE-9b, "The Continental Timetable") is a European-departure-board
take on the homepage rather than a full-bleed pyramid hero: blue header band, H1 + standfirst +
yellow "Build my itinerary" CTA, then a real `<table>` departures board of all 8 trips
(`components/DeparturesBoard.tsx`; place/days/from/best-months/→, whole row clickable via a
stretched-link `::after`, rows settle in on load — `board-settle` in `app/globals.css`, skipped
under `prefers-reduced-motion`), a full-bleed Giza station photo, a 7-day timetable strip
(`components/WeekStrip.tsx`) explaining how a week lays out, a 7-destination table
(`components/DestinationsTable.tsx`), the restyled itinerary builder (`TripBuilderForm.tsx`) in a
blue strip, a founders section reusing the existing `behind.*` copy, a reviews section, and a
"Before you go" notices board linking every help entry, the two journal posts, and the trip-cost
tool.

- The founders photo is conditional on `content/founders.json`'s `photo` field (`null` today — no
  real photo asset exists yet; add one and set the path to show it).
- The reviews section (`content/reviews.json`) renders nothing while that file is `[]` — add real
  review objects to bring it back; no placeholder reviews were invented.
- All new UI strings live under the `home.*` key in `content/i18n/<lang>.json`.
  `lib/home-content.ts` is a plain-data mirror of the page's rendered text, used only by
  `test/home.test.ts`'s word-count check — node's native test runner can't load JSX, so it can't
  render the real component; keep the two in sync if either changes.
- Adds an `ItemList` of `TouristTrip`/`Offer` JSON-LD (all 8 trips) alongside the existing
  `TravelAgency` entity JSON-LD `[lang]/layout.tsx` already emits.

## Testing

- `npm test` — `node --test` (native runner, TypeScript stripped, no framework). Covers hreflang
  generation, the `/seo-admin` gate, tool config parsing + one calculation per tool kind, the
  vanilla bundle, local content shape (authors/help), the destination/trip data split, the
  itinerary builder's pure logic, and every legacy URL from the old site's sitemap redirecting in
  one hop to a route this app serves (`test/legacy-redirects.test.ts`).
- `npm run lint` — `eslint`.
- `npm run build` — `next build`, standalone output.
- `./scripts/smoke.sh <base-url>` — run against a built + started server. Passes with no hub
  configured at all.

## How the hub feeds this site

Same contract as the template: metadata/canonical/hreflang/JSON-LD via `lib/seo.ts`'s
`seo.resolve`/`seo.metadata`, entity JSON-LD via `settings.entity`, authors/help/tools via
`settings.authors[]`/`settings.helpEntries[]`/`settings.tools[]` with a local-file fallback
(`content/authors.json`, `content/help/*.json`, `content/tools/*.json`) until a hub profile
exists, and journal articles via `store.listArticles`/`findArticleBySlug` merged with the two
migrated local posts in `content/journal/*.json` (hub wins on a slug collision).

## Hub-written destination/trip copy (`lib/hub-body.ts`)

The hub can write a destination or trip page's descriptive copy through the same article-ingest
channel as journal posts, without a code change, using a fixed slug convention:

- Destination pages: `destination-{id}` — `destination-cairo`, `destination-giza`,
  `destination-luxor`, `destination-alexandria`, `destination-nile`, `destination-desert`,
  `destination-red-sea`.
- Trip pages: `trip-{id}` — `trip-egypt-unfolded`, `trip-nile`, `trip-desert`, `trip-red-sea`,
  `trip-giza-day`, `trip-cairo-day`, `trip-luxor-day`, `trip-alex-day`.

`hubBodyFor(lang, slug)` looks up `store.findArticleBySlug`; when it finds one, the page renders
its `bodyHtml` as the descriptive copy (replacing the trip page's description/detail paragraphs;
added as new content on the destination page, which has none today) plus an FAQ block +
`FAQPage` JSON-LD, and `generateMetadata` prefers its `metaTitle`/`metaDescription` over the
generic local fallback (a real hub `page_seo` record still wins over both). Absent a hub body,
both pages render exactly as they did before this existed.

These 15 slugs are **not** journal posts: `lib/journal.ts`'s `listJournal` and
`app/sitemap.xml/route.ts` both filter `HUB_BODY_SLUGS` out of the article list, and
`lib/legacy-redirects.ts` 301s a direct `/{lang}/journal/{slug}` hit on one of them to the real
destination/trip page.

## Legacy URL redirects

The old static build served English at the root (no `/en` prefix) and every page trailing-slashed.
`lib/legacy-redirects.ts` is a pure, unit-tested function (`test/legacy-redirects.test.ts` runs it
against every `<loc>` from the old `dist/sitemap.xml`) that 301s every old URL shape to this app's
routes in one hop; `proxy.ts` calls it right after the hub's own redirect table and before locale
detection.

## Deploying (Coolify)

`Dockerfile` is multi-stage with `output: "standalone"` (see `next.config.ts`). **Coolify must be
set to the Dockerfile build pack**, not Nixpacks. No build arguments needed; every environment
variable is read at request time.

## Known gaps (`TODO(omar)`)

- `content/authors.json`'s `egyphoria-editorial` entry has placeholder `title`/`credentials`/`bio`
  text — replace with a real bio.
- `content/contact` (`app/[lang]/contact/page.tsx`)'s local `TravelAgency` JSON-LD fallback has an
  empty `sameAs` — add real social profile URLs once they exist.
- `site.config.ts`'s `contact.email`/`contact.phone`/`contact.addressLines` are placeholders.
- `app/[lang]/privacy/page.tsx` and `app/[lang]/terms/page.tsx` are new pages (the old site never
  had them) with generic placeholder legal text — have this reviewed before launch.
- Journal posts (`content/journal/*.json`) render the same English body under every locale's URL —
  commission real nl/fr/el/tr/es translations once a native reviewer is available.
- Every destination and trip page's word count is below the floors in
  `14-word-count-keyword-rules.md` (destinations ~54–98 words against a 300-word Category floor;
  trips ~147–168 words against a 500-word Tour floor) — this reuses only the old site's real copy,
  with nothing invented to pad it out; expanding it with genuine content is follow-up work for a
  human writer.
- The V2-PHASE-9b ticket asks for a `greek` font subset (for `el`) on both `Archivo Narrow` and
  `Archivo`. Neither typeface ships one on Google Fonts — `next/font/google`'s own generated type
  only allows `'latin' | 'latin-ext' | 'vietnamese'` for these two families, and requesting
  `'greek'` fails the build. `el` pages fall back through the CSS font stack to the platform's
  default sans/serif for Greek text (not broken, just not these two typefaces' own letterforms) —
  flagging as a ticket/reality mismatch rather than a bug.
- `content/founders.json` (`photo: null`) and `content/reviews.json` (`[]`) are both intentionally
  empty placeholders — see "Homepage" above.
