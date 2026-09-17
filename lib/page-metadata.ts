import type { Metadata } from 'next'
import { localeFreeAlternates } from '@omary98/seo-runtime-next'
// Relative, with `.ts` extensions: node's own ESM loader (used by `npm test`) doesn't understand
// the `@/` alias, and needs the extension explicit too — same reasoning as lib/trips.ts.
import { seo } from './seo.ts'
import { localAlternates, toAbsolute } from './hreflang.ts'
import { localTitle, localDescription } from './local-seo.ts'
import { t } from './i18n.ts'
import { SITE_CONFIG } from '../site.config.ts'

/** 01-site-setup.md's noindex list — a shared source so app/[lang]/privacy and .../terms can't
 * drift apart, and so this is unit-testable (the .tsx pages themselves aren't loadable by
 * node's plain --experimental-strip-types runner, which has no JSX support). */
export const NOINDEX_PATHS: ReadonlySet<string> = new Set(['/privacy', '/terms'])

/**
 * `seo.metadata` alone answers `title: ''`, `description: ''` and a relative `canonical` on a
 * cold store (no hub, or no page record for this path yet) — see resolve.ts's composeSeo with
 * `page: null`. This fills all three in from real local content (i18n strings, trip copy,
 * SITE_CONFIG.baseUrl) UNDER whatever the hub provides, same floor-not-competing-source pattern
 * as the hreflang merge below.
 *
 * `hubBody` is the optional middle tier: a destination/trip page whose hub-pushed body
 * (lib/hub-body.ts) carries its own metaTitle/metaDescription passes them here, so they win over
 * the generic local fallback but still lose to a real hub page_seo record (`base.title`/
 * `base.description`) the moment the hub sets one for this exact path.
 */
export async function pageMetadata(
  pathWithoutLang: string, lang: string, hubBody?: { metaTitle?: string; metaDescription?: string },
): Promise<Metadata> {
  const base = await seo.metadata({ path: `/${lang}${pathWithoutLang}`, lang })
  const hubLanguages = (base.alternates as { languages?: Record<string, string> } | undefined)?.languages ?? {}
  const title = base.title || hubBody?.metaTitle || localTitle(pathWithoutLang, lang)
  const description = base.description || hubBody?.metaDescription || localDescription(pathWithoutLang, lang)
  const rawCanonical = (base.alternates as { canonical?: string } | undefined)?.canonical
  const canonical = rawCanonical ? toAbsolute(rawCanonical) : undefined
  return {
    ...base,
    title, description,
    alternates: {
      ...base.alternates,
      canonical,
      languages: { ...localAlternates(pathWithoutLang), ...hubLanguages },
    },
    openGraph: { ...base.openGraph, title: base.openGraph?.title || title, description: base.openGraph?.description || description, url: canonical },
  }
}

/**
 * V2-PHASE-8: the same gap as `pageMetadata`, but for the locale-free routes matched by `?lang=`
 * instead of a `[lang]` segment (`/help`, `/help/{slug}`, `/editorial-guidelines`,
 * `/authors/{slug}`, `/tools/{slug}`) — `seo.metadata` has no stored page record to group
 * alternates from, ever, since these paths carry no `[lang]` segment. `localeFreeAlternates`
 * fills that in from the site's configured locales. Never used on `/tools/{slug}/embed`, which
 * stays canonical-only (packages/CONTRACT.md).
 */
export async function localeFreeMetadata(path: string, lang: string): Promise<Metadata> {
  const base = await seo.metadata({ path, lang })
  const hubLanguages = (base.alternates as { languages?: Record<string, string> } | undefined)?.languages ?? {}
  // Same cold-store gap as pageMetadata's, one function down — these routes never have a stored
  // page record (composeSeo's `page` is always null for them), so `base.title`/`description`
  // are empty until a hub sets settings.helpEntries[]/tools[] etc. The page itself already
  // renders real per-entry content regardless (help question, tool title, author name); this is
  // only the <title>/meta-description floor, using the one general site description rather than
  // guessing a per-slug title from just a path string.
  const title = base.title || `${t(lang, 'meta.title')}`
  const description = base.description || t(lang, 'meta.description')
  const rawCanonical = (base.alternates as { canonical?: string } | undefined)?.canonical
  const canonical = rawCanonical ? toAbsolute(rawCanonical) : undefined
  return {
    ...base,
    title, description,
    alternates: {
      ...base.alternates,
      canonical,
      languages: { ...localeFreeAlternates(SITE_CONFIG.locales, path), ...hubLanguages },
    },
  }
}
