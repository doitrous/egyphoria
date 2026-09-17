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
