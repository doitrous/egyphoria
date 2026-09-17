import { createSeo } from '@omary98/seo-runtime-next'
// Relative, with `.ts` extensions: node's own ESM loader (used by `npm test`) doesn't understand
// the `@/` alias, and needs the extension explicit too — same reasoning as lib/trips.ts.
import { SITE_CONFIG } from '../site.config.ts'
import { store } from './store.ts'
import { providerPages } from './local-seo.ts'
import { toAbsolute } from './hreflang.ts'

// Re-exported for callers that only need the page registry (e.g. the sitemap fallback) without
// pulling in the runtime instance below.
export { providerPages }

const seoRuntime = createSeo({
  store,
  supported: SITE_CONFIG.locales,
  pages: providerPages,
  // 07-content-hub.md / CONTRACT.md: journal posts render at /{lang}/journal/{slug}.
  articlePath: (lang: string, slug: string) => `/${lang}/journal/${slug}`,
  // <ShareBlock/> is wired into [lang]/layout.tsx and every content page below — opt in so the
  // health ping reports it accurately (packages/CONTRACT.md: Next defaults `share` to false).
  share: true,
})

// `resolveSeo`'s own `canonical` (core-js resolve.ts) is only absolute once the hub has synced
// settings.baseUrls for this lang — on a cold store it falls back to the bare path (e.g. "/en").
// Every page here treats `resolved.canonical` as already absolute (ShareBlock, TouristTrip/
// Offer/BreadcrumbList `url`/`item` fields) — wrapping `resolve` once here, rather than at every
// call site, is the root-cause fix.
export const seo = {
  ...seoRuntime,
  resolve: async (path: string, lang: string) => {
    const resolved = await seoRuntime.resolve(path, lang)
    return { ...resolved, canonical: toAbsolute(resolved.canonical) }
  },
}

// CONTRACT.md: the periodic pull (every 6h) and hourly health ping, started once per server
// process. Never imported by proxy.ts, which reaches into `./store` directly instead — this
// timer must never run on the edge/proxy runtime.
seo.start()
