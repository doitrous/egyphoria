// Lets the hub's brain write a destination/trip page's descriptive copy without a code change:
// a hub-pushed article stored under a fixed slug convention (see HUB_BODY_SLUGS below, and the
// README) becomes that page's body copy + FAQ, while the page itself still owns its own facts
// (price, itinerary builder, breadcrumbs, JSON-LD structure) — see app/[lang]/destinations/[id]
// and .../trips/[id]. This is a *body* source, not a journal post: lib/journal.ts's listJournal
// and app/sitemap.xml/route.ts both filter HUB_BODY_SLUGS out of the journal listing/sitemap,
// and lib/legacy-redirects.ts 301s a direct /journal/{slug} hit to the real page.
import type { StoredArticle } from '@omary98/seo-runtime-core'
import { store } from './store.ts'
import { DESTINATION_IDS, TRIP_IDS } from './trips.ts'

export type HubBodyKind = 'destination' | 'trip'

export function hubBodySlugFor(kind: HubBodyKind, id: string): string {
  return `${kind}-${id}`
}

/** The 15 fixed slugs a destination/trip page will ever look up: 7 destinations (destination-
 * cairo, destination-giza, destination-luxor, destination-alexandria, destination-nile,
 * destination-desert, destination-red-sea) + 8 trips (trip-egypt-unfolded, trip-nile,
 * trip-desert, trip-red-sea, trip-giza-day, trip-cairo-day, trip-luxor-day, trip-alex-day). */
export const HUB_BODY_SLUGS: string[] = [
  ...DESTINATION_IDS.map((id) => hubBodySlugFor('destination', id)),
  ...TRIP_IDS.map((id) => hubBodySlugFor('trip', id)),
]

export type HubBody = {
  bodyHtml: string; title: string; metaTitle: string; metaDescription: string
  faq: { q: string; a: string }[]; imageUrl: string | null; imageAlt: string | null
  updatedAt: string
}

/**
 * Looks up a hub-pushed article under the fixed slug convention and returns just the fields a
 * destination/trip page needs from it — `null` on a cold store, or whenever the hub simply
 * hasn't written this particular page's copy yet, in which case the caller renders its own
 * existing copy (see the ticket: "when absent, render exactly what renders today").
 */
export async function hubBodyFor(lang: string, slug: string): Promise<HubBody | null> {
  const article: StoredArticle | null = await store.findArticleBySlug(lang, slug)
  if (!article) return null
  const { bodyHtml, title, metaTitle, metaDescription, faq, imageUrl, imageAlt, updatedAt } = article
  return { bodyHtml, title, metaTitle, metaDescription, faq, imageUrl, imageAlt, updatedAt }
}
