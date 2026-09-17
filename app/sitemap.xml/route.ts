import { sitemapEntries, sitemapXml } from '@omary98/seo-runtime-core'
import { seo, providerPages } from '@/lib/seo'
import { localSitemapEntries } from '@/lib/local-seo'
import { HUB_BODY_SLUGS } from '@/lib/hub-body'

export const dynamic = 'force-dynamic'

// seo.sitemapResponse() (seo-runtime-next) needs a hub snapshot and answers an empty <urlset>
// without one — fine once the hub has synced, but that would ship an empty sitemap forever on a
// cold store. Fall back to providerPages() (this site's own route registry, already used to
// register pages with the hub) the moment the hub has nothing to offer.
export async function GET() {
  const snapshot = await seo.config.store.getSnapshot()
  // HUB_BODY_SLUGS' 15 articles are destination/trip page copy, not journal posts — the
  // destination/trip pages themselves are already in `snapshot.pages` (via providerPages, the
  // hub's own page registry) with their own sitemap entry, so excluding these from `articles`
  // here only drops the would-be duplicate /journal/{slug} entry, never the real page.
  const articles = (await seo.config.store.listArticles()).filter((a) => !HUB_BODY_SLUGS.includes(a.slug))
  const hubEntries = snapshot ? sitemapEntries(snapshot, articles, seo.config.articlePath) : []
  const entries = hubEntries.length ? hubEntries : localSitemapEntries(await providerPages())
  return new Response(sitemapXml(entries), { headers: { 'content-type': 'application/xml; charset=UTF-8' } })
}
