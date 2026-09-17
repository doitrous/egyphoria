// Relative, with a `.ts` extension: node's own ESM loader (used by `npm test`) doesn't
// understand the `@/` alias — same reasoning as lib/trips.ts.
import { SITE_CONFIG } from '../site.config.ts'

/**
 * 01-site-setup.md: every page needs Organization/TravelAgency schema. Given the jsonld array
 * `seo.resolve()` already produced, appends the local TravelAgency fallback only if the hub
 * hasn't already supplied one. Extracted out of `[lang]/layout.tsx` (fix round 1, item #17) so
 * test/home.test.ts can exercise this exact function instead of re-deriving the same logic —
 * `.tsx` files can't be imported by node's plain `--experimental-strip-types` runner once they
 * contain JSX, even for a non-JSX export, so the shared logic has to live in a `.ts` file.
 */
export function withEntityFallback(jsonld: Record<string, unknown>[]): Record<string, unknown>[] {
  const hasHubEntity = jsonld.some((e) => e['@type'] === 'TravelAgency' || e['@type'] === 'Organization')
  if (hasHubEntity) return jsonld
  const localEntity = {
    '@context': 'https://schema.org', '@type': 'TravelAgency', name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl, logo: `${SITE_CONFIG.baseUrl}${SITE_CONFIG.logoPath}`,
    sameAs: SITE_CONFIG.contact.sameAs,
  }
  return [...jsonld, localEntity]
}
