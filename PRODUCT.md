# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: European first-time visitors to Egypt (UK, Netherlands, France, Greece, Turkey, Spain) planning a 7–10 day trip, usually a couple or a family, comparing a guided private trip against doing it themselves. State of mind: excited but anxious — safety, scams, heat, distances, how many days each place deserves, what it really costs. They read in their own language (en, nl, fr, el, tr, es).

Secondary (confirmed but not primary): repeat travellers wanting Nile/desert/Red Sea depth; TourMedX medical-tourism patients adding sightseeing around treatment in Cairo.

## Product Purpose

Egyphoria plans and sells private, small-group trips in Egypt: four multi-day journeys (Egypt Unfolded, the Nile, the Western Desert, the Red Sea) and four day trips from Cairo (Giza, Cairo, Luxor, Alexandria), with an online itinerary builder that assembles a trip from those building blocks and a PayTabs checkout in USD. Success on the homepage = the visitor starts building an itinerary (the primary action, confirmed by the owner); browsing trips and contacting a human are secondary paths.

## Positioning

A trip assembled from the visitor's own dates and interests, led privately, priced openly per trip (per-person prices are published on every trip page and in the itinerary builder), in six European languages. The mechanism a generic tour operator cannot copy: the itinerary builder plus honest, sourced guidance (journal, help center, trip-cost calculator) written under published editorial guidelines.

## Operating Context

Visitors arrive mostly from search (the site is run under the owner's SEO system: hub-managed metadata, help center, tools, journal written weekly by an editorial pipeline and approved by a human). They land on the homepage or a destination/trip page, use the itinerary builder or the trip-cost calculator, then pay online or contact the team. Mobile-first reading; slow hotel Wi-Fi is common.

## Capabilities and Constraints

- Stack: Next 16 App Router, seo-runtime 0.1.6 (hub metadata, hreflang, sitemap, help/tools/authors/editorial from the hub snapshot), Dockerfile on Coolify, no database (JSON file store).
- Routes exist and stay: `/{lang}`, `/{lang}/destinations/{id}`, `/{lang}/trips/{id}`, `/{lang}/journal`, `/{lang}/photography`, `/{lang}/about`, `/{lang}/contact`, `/help`, `/tools/trip-cost`, `/authors/*`, `/editorial-guidelines`.
- SEO rules are binding (repo `seo-structure/*` in the owner's SEO docs): one H1 carrying the broad keyword ("Egypt tours" / "private Egypt tours"), homepage 500–800 words of server-rendered text, keyword-named menu, footer "Popular searches" block, share block, hreflang ×6 + x-default, absolute canonical, CollectionPage/TravelAgency JSON-LD, images WebP/AVIF < 300 KB with width/height, CWV pass on mobile (LCP < 2.5 s).
- Prices in `src`/config are owner-flagged placeholders; show them as the data says ("from $980"), never invent new ones.
- Itinerary builder, plan dialog, trip cards, language switcher, PayTabs checkout are existing functions and must keep working.
- Undecided: destination and trip long-form copy is being written by the editorial pipeline (arrives via the hub); the homepage must read well before it lands.

## Brand Commitments

Name: Egyphoria. Tagline: "Egypt, beyond the expected." Existing wordmark/icon assets in `public/assets/` (egyphoria-logo.png, egyphoria-wordmark-hd.png, egyphoria-icon-hd.png). Voice (from editorial guidelines): honest, specific, no hype; every price, date and claim sourced.

## Evidence on Hand

- Eight real trip products with itineraries and per-person prices (`lib/trips.ts`, `site.config`/prices), seven destination photos (`public/assets/*.jpg`: giza, cairo, luxor, alexandria, nile, desert, red-sea, og-image).
- Two journal articles, five help entries, one trip-cost calculator.
- Owner has confirmed that a founder/guide bio + photo and real customer reviews WILL be supplied; they do not exist in the repo yet. Until delivered, those slots render only as clearly-marked owner placeholders (never fabricated names, quotes, ratings or counts) and are hidden from indexable copy.
- No licence numbers, partner logos, press or statistics exist — do not imply any.

## Product Principles

1. Reduce the first-timer's anxiety with specifics (days, distances, prices, seasons), not adjectives.
2. One primary action everywhere above the fold: build your itinerary.
3. Every claim is something we can show: a real trip, a real price, a real person, a real review.
4. Six languages are first-class: no English-only copy in a localized page, no layout that breaks on long Greek/Turkish strings.
5. Search is the front door: structure, headings and internal links are content, not decoration.
