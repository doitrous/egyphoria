// Relative, not the `@/` tsconfig alias: node's own ESM loader (used by `npm test`) doesn't
// understand it, only Next's bundler does. Every other module here is only ever imported by
// Next itself, so the alias is fine there.
import { SITE_CONFIG } from '../site.config.ts'

/**
 * Local hreflang fallback for the site's own static routes (home/about/contact), independent of
 * the hub. `resolveSeo`'s own `alternates` come from the hub page's `group` (packages/CONTRACT.md)
 * and are empty on a cold store, so without this a hub-less deploy would ship a [lang] page with
 * no hreflang block at all. Callers merge the hub's alternates OVER this (hub wins when present),
 * so this is purely the floor, not a competing source of truth.
 *
 * `pathWithoutLang` is the route below the locale segment — '' for home, '/about', '/contact'.
 */
export function localAlternates(pathWithoutLang: string): Record<string, string> {
  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '')
  const entries: Record<string, string> = {}
  for (const lang of SITE_CONFIG.locales) {
    entries[lang] = `${base}/${lang}${pathWithoutLang}`
  }
  entries['x-default'] = `${base}/${SITE_CONFIG.defaultLocale}${pathWithoutLang}`
  return entries
}

/**
 * `composeSeo`'s `canonical` (core-js `resolve.ts`) is only absolute once the hub has synced
 * `settings.baseUrls` for this lang — on a cold store, or before that sync, it falls back to the
 * bare path (e.g. `/en`). Every caller (page JSON-LD `url`/`item` fields, `<ShareBlock>`,
 * `<link rel="canonical">`) needs one absolute value regardless, so this is the one place that
 * guarantees it — see lib/seo.ts's wrapped `resolve` and lib/page-metadata.ts.
 */
export function toAbsolute(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_CONFIG.baseUrl).href.replace(/\/$/, '')
}
