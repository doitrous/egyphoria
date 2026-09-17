import type { Metadata } from 'next'
import { localeFreeAlternates } from '@omary98/seo-runtime-next'
import { seo } from './seo'
import { localAlternates } from './hreflang'
import { SITE_CONFIG } from '@/site.config'

/**
 * `seo.metadata` alone answers empty `alternates.languages` on a cold store (no hub, or no page
 * group configured yet) — see resolve.ts's composeSeo. This merges the local hreflang fallback
 * UNDER whatever the hub provides, so a [lang] page always ships hreflang + x-default even before
 * any hub snapshot exists, and the hub's own alternates win the moment it has real ones.
 */
export async function pageMetadata(pathWithoutLang: string, lang: string): Promise<Metadata> {
  const base = await seo.metadata({ path: `/${lang}${pathWithoutLang}`, lang })
  const hubLanguages = (base.alternates as { languages?: Record<string, string> } | undefined)?.languages ?? {}
  return {
    ...base,
    alternates: {
      ...base.alternates,
      languages: { ...localAlternates(pathWithoutLang), ...hubLanguages },
    },
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
  return {
    ...base,
    alternates: {
      ...base.alternates,
      languages: { ...localeFreeAlternates(SITE_CONFIG.locales, path), ...hubLanguages },
    },
  }
}
