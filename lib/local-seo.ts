// Pure, side-effect-free local SEO data — split out of lib/seo.ts so it can be unit-tested
// under plain `node --test` without pulling in createSeo()/seo.start()'s hub-sync side effect
// (lib/seo.ts imports providerPages from here). Relative imports + `.ts` extensions throughout,
// same reasoning as lib/trips.ts: node's own ESM loader doesn't understand the `@/` alias.
import type { ProviderPage } from '@omary98/seo-runtime-next'
import type { SitemapEntry } from '@omary98/seo-runtime-core'
import { SITE_CONFIG } from '../site.config.ts'
import { DESTINATION_IDS, TRIP_IDS, getDestination, getTrip } from './trips.ts'
import { t } from './i18n.ts'
import { LOCAL_JOURNAL_SLUGS, getLocalArticle } from './journal.ts'
import { toAbsolute } from './hreflang.ts'

// Every static route this site serves under /{lang}, in every configured language — this list
// is both the hub's page registry (GET /api/seo/pages) and, together with the runtime's own
// article pages, the sitemap (01-site-setup.md, 07-content-hub.md).
const STATIC_PATHS = ['', '/destinations', '/trips', '/journal', '/photography', '/booking/complete', '/about', '/contact', '/privacy', '/terms']

function titleFor(path: string, lang: string): string {
  // The hub snapshot renders page.title + brandSuffix (skipped when the title already ends
  // with it), so the registry must report the real meta title, not the old hero tagline.
  if (path === '') return t(lang, 'home.metaTitle')
  if (path === '/destinations') return t(lang, 'journeys.eyebrow')
  if (path === '/trips') return t(lang, 'journeys.title')
  if (path === '/journal') return t(lang, 'journal.title')
  if (path === '/photography') return 'Photography'
  if (path === '/booking/complete') return t(lang, 'booking.title')
  if (path === '/about') return t(lang, 'behind.title')
  if (path === '/contact') return t(lang, 'behind.cta')
  if (path === '/privacy') return 'Privacy'
  if (path === '/terms') return 'Terms'
  return path
}

export async function providerPages(): Promise<ProviderPage[]> {
  const now = new Date().toISOString()
  const pages: ProviderPage[] = []
  for (const lang of SITE_CONFIG.locales) {
    for (const path of STATIC_PATHS) {
      pages.push({ key: `page:${path || 'home'}`, type: 'page', lang, path: `/${lang}${path}`, title: titleFor(path, lang), updatedAt: now })
    }
    for (const id of DESTINATION_IDS) {
      const d = getDestination(id, lang)
      pages.push({ key: `destination:${id}`, type: 'category', lang, path: `/${lang}/destinations/${id}`, title: d?.name ?? id, updatedAt: now })
    }
    for (const id of TRIP_IDS) {
      const trip = getTrip(id, lang)
      pages.push({ key: `trip:${id}`, type: 'tour', lang, path: `/${lang}/trips/${id}`, title: trip?.name ?? id, updatedAt: now })
    }
    for (const slug of LOCAL_JOURNAL_SLUGS) {
      const article = getLocalArticle(slug, lang)
      if (article) pages.push({ key: `journal:${slug}`, type: 'article', lang, path: `/${lang}/journal/${slug}`, title: article.title, updatedAt: article.date })
    }
  }
  return pages
}

/**
 * Local title/description fallback for a cold store (no hub snapshot yet, or a page the hub
 * has not covered) — `seo.metadata()` answers with `title: '', description: ''` in that case
 * (core-js's `composeSeo` with `page: null`), which would ship an empty `<title>` forever until
 * a snapshot syncs. Reuses only real, already-published i18n strings and trip copy — nothing
 * invented — same principle as lib/hreflang.ts's `localAlternates` floor for hreflang.
 */
export function localTitle(pathWithoutLang: string, lang: string): string {
  // V2-PHASE-9b: the home page's <title> is the ticket's own string (already ≤ 60 chars and
  // already carrying "| Egyphoria" per locale) — it must not also get brandSuffix appended, so
  // this returns before the generic `titleFor(...) + brandSuffix` fallback below.
  if (pathWithoutLang === '') return t(lang, 'home.metaTitle')
  const tripMatch = pathWithoutLang.match(/^\/trips\/([a-z0-9-]+)$/)
  if (tripMatch) {
    const trip = getTrip(tripMatch[1], lang)
    if (trip) return `${trip.name}${SITE_CONFIG.brandSuffix}`
  }
  const destMatch = pathWithoutLang.match(/^\/destinations\/([a-z0-9-]+)$/)
  if (destMatch) {
    const destination = getDestination(destMatch[1], lang)
    if (destination) return `${destination.name}${SITE_CONFIG.brandSuffix}`
  }
  return `${titleFor(pathWithoutLang, lang)}${SITE_CONFIG.brandSuffix}`
}

/** Same fallback, for the meta description. Trip pages have their own real description copy;
 * everything else falls back to the site's own one general description (content/i18n's
 * `meta.description`) rather than inventing per-page marketing copy. */
export function localDescription(pathWithoutLang: string, lang: string): string {
  if (pathWithoutLang === '') return t(lang, 'home.metaDescription')
  const tripMatch = pathWithoutLang.match(/^\/trips\/([a-z0-9-]+)$/)
  if (tripMatch) {
    const trip = getTrip(tripMatch[1], lang)
    if (trip?.description) return trip.description
  }
  return t(lang, 'meta.description')
}

/**
 * Sitemap fallback for a cold store: `sitemapEntries()` (seo-runtime-core) needs a hub snapshot
 * and returns `[]` without one, which would ship an empty `<urlset>` forever until the hub
 * syncs. Groups `providerPages()` (one entry per lang x route, local journal posts included) by
 * its lang-independent `key`, into hreflang alternates — the same shape `sitemapEntries()`
 * itself builds by grouping hub pages, just sourced locally. See app/sitemap.xml/route.ts.
 */
export function localSitemapEntries(pages: ProviderPage[]): SitemapEntry[] {
  const byKey = new Map<string, ProviderPage[]>()
  for (const p of pages) {
    const group = byKey.get(p.key) ?? []
    group.push(p)
    byKey.set(p.key, group)
  }
  const entries: SitemapEntry[] = []
  for (const group of byKey.values()) {
    const alternates: Record<string, string> = {}
    for (const p of group) alternates[p.lang] = toAbsolute(p.path)
    alternates['x-default'] = alternates[SITE_CONFIG.defaultLocale] ?? Object.values(alternates)[0]
    for (const p of group) {
      entries.push({ loc: toAbsolute(p.path), lastmod: p.updatedAt?.slice(0, 10), changefreq: 'weekly', priority: 0.5, alternates })
    }
  }
  return entries
}
