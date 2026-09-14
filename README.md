# Egyphoria website

A fast, static, multilingual site with an itinerary builder, trip pages,
a content hub (journal), full SEO, and PayTabs checkout.

## Build

```bash
node build.mjs
```

Everything under `dist/` is generated. Source of truth lives in `src/`.
Edit `src/`, run the build, commit `dist/`.

## Test

```bash
node build.mjs && node smoke-test.mjs
```

A zero-dependency SEO smoke test: `dist/sitemap.xml` has at least one
absolute `https://` `<loc>` and a `<lastmod>`, `dist/robots.txt` has a
`Sitemap:` line, and the homepage has an `<h1` and `rel="canonical"`.

## Where things live

| I want to…                    | Edit                                         |
|-------------------------------|----------------------------------------------|
| Change a price                | `src/config.mjs` → `prices`                  |
| Change site domain / currency | `src/config.mjs` → `site`                    |
| Add / remove a language       | `src/config.mjs` → `languages` + `src/i18n/<code>.json` |
| Reword UI text (English)      | `src/i18n/en.json`                           |
| Translate UI text             | `src/i18n/<code>.json`                        |
| Edit trip content (English)   | `src/trips.mjs`                              |
| Translate trip content        | `src/i18n/<code>.trips.json`                  |
| Write a journal article       | add `src/content/blog/<slug>.md`             |
| Restyle                       | `src/styles.css`                             |
| Client behaviour              | `src/client/*.js`                            |

### Journal articles

Drop a markdown file in `src/content/blog/`. Front matter:

```
---
title: ...
description: ...        # used for SEO + card
date: 2026-02-01
image: giza             # an image in dist/assets/ (no extension)
category: GUIDES
readTime: 6
slug: my-post
lang: en
---
Body in markdown. Link internally with [[trip:giza-day|An audience with eternity]].
```

Internal `[[trip:<id>|label]]` links are the easy way to build internal
backlinks from articles to trip pages (good for SEO).

## SEO

Generated automatically: `sitemap.xml` (all languages + `hreflang`
alternates + `lastmod`, from a post's front-matter `date` or otherwise its
content file's mtime), `robots.txt` (explicit allow/disallow per crawler,
including GPTBot/ClaudeBot allowed and CCBot/Bytespider/Meta-ExternalAgent/
Amazonbot disallowed), canonical URLs, Open Graph / Twitter cards, and
JSON-LD (`TravelAgency`, `TouristTrip`/`Offer`, `Blog`, `BlogPosting`).
After deploy, submit `https://egyphoria.com/sitemap.xml` in Google Search
Console.

## Payments (PayTabs)

Checkout needs a host that runs serverless functions (the PayTabs **server
key is secret** and must never reach the browser). The endpoints live in
`api/` and are Vercel-ready.

### Deploy on Vercel

1. Import the repo in Vercel. `vercel.json` already sets build (`node
   build.mjs`) and output (`dist`).
2. In **Project → Settings → Environment Variables**, add:

   | Name                 | Value                               |
   |----------------------|-------------------------------------|
   | `PAYTABS_PROFILE_ID` | your PayTabs profile id             |
   | `PAYTABS_SERVER_KEY` | your PayTabs **server key** (secret) |
   | `PAYTABS_REGION`     | `EGY` (or ARE/SAU/OMN/JOR/GLOBAL)   |
   | `PAYTABS_CURRENCY`   | `USD` (optional)                    |
   | `SITE_URL`           | `https://egyphoria.com`             |

3. In your PayTabs dashboard, allow your domain and set the callback to
   `https://egyphoria.com/api/paytabs-callback`.
4. Deploy. The **Book this journey** button now creates a hosted PayTabs
   payment and redirects the customer; after paying they land on
   `/booking/complete/`.

Prices are enforced **server-side** in `api/paytabs-create.js` (the browser
can't change the amount). Keep that `PRICES` map in sync with
`src/config.mjs`.

`api/paytabs-callback.js` verifies PayTabs' HMAC signature. Add your
fulfilment (email the team / mark paid) where the `ponytail:` stub is.

Never commit real credentials — use `.env` locally (see `.env.example`);
`.env` is gitignored.

## Static-only hosting

If you keep the current static host, everything works **except** live
checkout — the Book button falls back to a "contact us" message. Move to
Vercel (or any serverless host) to enable payments.
