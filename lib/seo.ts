import { createSeo, type ProviderPage } from '@omary98/seo-runtime-next'
import { SITE_CONFIG } from '@/site.config'
import { store } from './store'
import { DESTINATION_IDS, TRIP_IDS, getDestination, getTrip } from './trips'
import { t } from './i18n'
import { LOCAL_JOURNAL_SLUGS, getLocalArticle } from './journal'

// Every static route this site serves under /{lang}, in every configured language — this list
// is both the hub's page registry (GET /api/seo/pages) and, together with the runtime's own
// article pages, the sitemap (01-site-setup.md, 07-content-hub.md).
const STATIC_PATHS = ['', '/destinations', '/trips', '/journal', '/photography', '/booking/complete', '/about', '/contact', '/privacy', '/terms']

function titleFor(path: string, lang: string): string {
  if (path === '') return t(lang, 'hero.eyebrow')
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

async function providerPages(): Promise<ProviderPage[]> {
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

export const seo = createSeo({
  store,
  supported: SITE_CONFIG.locales,
  pages: providerPages,
  // 07-content-hub.md / CONTRACT.md: journal posts render at /{lang}/journal/{slug}.
  articlePath: (lang: string, slug: string) => `/${lang}/journal/${slug}`,
  // <ShareBlock/> is wired into [lang]/layout.tsx and every content page below — opt in so the
  // health ping reports it accurately (packages/CONTRACT.md: Next defaults `share` to false).
  share: true,
})

// CONTRACT.md: the periodic pull (every 6h) and hourly health ping, started once per server
// process. Never imported by proxy.ts, which reaches into `./store` directly instead — this
// timer must never run on the edge/proxy runtime.
seo.start()
