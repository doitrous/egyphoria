// V2-PHASE-9 redirect map: the old static build served English at the root (no /en prefix) and
// every page with a trailing slash; the new runtime serves every language under /{lang} with no
// trailing slash, and /help, /tools/{slug}(/embed) and /editorial-guidelines locale-free via
// `?lang=`. This is a pure function (no next/server import) so it is unit-testable with plain
// node --test against every <loc> in the old dist/sitemap.xml (see test/legacy-redirects.test.ts)
// and is called from proxy.ts after the hub redirect check, before locale detection, per the
// ticket's redirect map.
const OTHER_LOCALES = ['nl', 'fr', 'el', 'tr', 'es']
// /help, /help/{slug}, /tools/trip-cost, /tools/trip-cost/embed, /editorial-guidelines: the
// locale-free routes the runtime renders via ?lang= instead of a /{lang} path segment.
const LOCALE_FREE_ROUTE = /^\/(help|tools\/trip-cost(?:\/embed)?|editorial-guidelines)(\/.*)?$/
// Old bare-English content paths that move under /en.
const ENGLISH_CONTENT_ROUTE = /^\/(trips|journal|photography|booking)(\/.*)?$/
// Never touched: API/admin/Next internals, or an actual file (image, font, xml, txt, ...).
const RESERVED = /^\/(api|admin|_next|favicon\.ico)/
const PUBLIC_FILE = /\.(?:jpg|jpeg|png|webp|avif|gif|svg|ico|mp4|webm|txt|xml|json|woff2?)$/i

/**
 * Returns the new path (+ query, no trailing slash) an old URL's pathname should 301 to, or
 * `null` when `pathname` needs no redirect (already canonical, or not a path this site owns an
 * opinion about). Resolves in one hop for every legacy URL — see the unit test.
 */
export function legacyRedirectTarget(pathname: string): string | null {
  if (RESERVED.test(pathname) || PUBLIC_FILE.test(pathname)) return null
  if (pathname === '/') return '/en'

  const hasTrailingSlash = pathname.length > 1 && pathname.endsWith('/')
  const bare = hasTrailingSlash ? pathname.slice(0, -1) : pathname

  const langMatch = bare.match(/^\/(nl|fr|el|tr|es)((?:\/.*)?)$/)
  if (langMatch) {
    const [, lang, rest] = langMatch
    if (rest === '') return hasTrailingSlash ? `/${lang}` : null
    const localeFree = rest.match(LOCALE_FREE_ROUTE)
    if (localeFree) return `${rest}?lang=${lang}`
    return hasTrailingSlash ? `/${lang}${rest}` : null
  }

  if (LOCALE_FREE_ROUTE.test(bare)) {
    return hasTrailingSlash ? bare : null
  }

  if (ENGLISH_CONTENT_ROUTE.test(bare)) {
    return `/en${bare}`
  }

  // Generic trailing-slash strip for everything else (10-internal-linking-menu-footer.md /
  // 01-site-setup.md: canonical URLs never carry a trailing slash) — /authors/{slug}/,
  // /seo-admin/, or any future path, and any already-locale-prefixed new-style path
  // (/en/trips/foo/) that reaches here with a slash still on it.
  if (hasTrailingSlash) return bare

  return null
}

export { OTHER_LOCALES }
