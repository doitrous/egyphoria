// `/edge`, not the package root: the package root barrel re-exports the file and SQL stores
// (node:fs/node:sqlite/node:crypto) plus config.ts, and a module executes every one of its own
// imports whether this file uses them or not. Next 16's `proxy.ts` (the renamed `middleware.ts`)
// runs on the Node.js runtime by default, so `lib/store.ts`'s node:fs-backed JsonFileStore runs
// here with no edge-runtime restriction — it's `withSeoRedirects` and `indexNowKeyFile` alone
// that must come from `/edge`.
import { NextResponse, type NextRequest } from 'next/server'
import { indexNowKeyFile } from '@omary98/seo-runtime-core/edge'
import { withSeoRedirects } from '@omary98/seo-runtime-next/edge'
import { SITE_CONFIG } from './site.config'
import { store } from './lib/store'
import { legacyRedirectTarget } from './lib/legacy-redirects'

const seoRedirects = withSeoRedirects(store)

const LOCALE_COOKIE = 'site_locale'
const INDEXNOW_KEY_FILE = /^\/[^/]+\.txt$/
// Reserved surfaces that are never locale-prefixed and never redirect-checked past this point.
const PASSTHROUGH = /^\/(api|admin|seo-admin|authors|help|tools|editorial-guidelines|_next|favicon\.ico|robots\.txt|sitemap\.xml)/
// Anything under /public (images, fonts, etc.) is a file, not a page — never locale-redirect it.
const PUBLIC_FILE = /\.(?:jpg|jpeg|png|webp|avif|gif|svg|ico|mp4|webm|txt|xml|json|woff2?)$/i

function detectLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookie && SITE_CONFIG.locales.includes(cookie)) return cookie

  const header = request.headers.get('accept-language')
  if (header) {
    const ranked = header
      .split(',')
      .map((part) => {
        const [tag, q] = part.trim().split(';q=')
        return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 }
      })
      .sort((a, b) => b.q - a.q)
    for (const { tag } of ranked) {
      const base = tag.split('-')[0]
      if (SITE_CONFIG.locales.includes(base)) return base
    }
  }
  return SITE_CONFIG.defaultLocale
}

export async function proxy(request: NextRequest) {
  // The hub's redirect table, checked first per packages/CONTRACT.md ("Redirects are applied
  // before any auth or session middleware"). withSeoRedirects itself skips /api, /admin and
  // every settings.reservedPrefixes entry.
  const hubRedirect = await seoRedirects({ url: request.url })
  if (hubRedirect) return hubRedirect

  const { pathname, search } = request.nextUrl

  // V2-PHASE-9's own redirect map: the old static build's URLs (root-level English, every path
  // trailing-slashed) 301 to this app's routes — see lib/legacy-redirects.ts and its unit test
  // against every <loc> in the old dist/sitemap.xml. Also covers the general "strip the trailing
  // slash on any non-file, non-API path" rule for any path that reaches here with one still on.
  const legacyTarget = legacyRedirectTarget(pathname)
  if (legacyTarget) {
    // A plain `new URL`, not `request.nextUrl.clone()` + `.pathname =`: NextURL's own `.href`
    // re-applies next.config's trailingSlash formatting on read, silently re-adding the slash
    // legacyRedirectTarget just stripped — skipTrailingSlashRedirect only suppresses Next's
    // *automatic* slash redirect, not this formatting. A plain URL has no such behavior.
    return NextResponse.redirect(new URL(legacyTarget, request.url), 301)
  }

  // IndexNow's key-verification file, checked ahead of locale routing. Narrow on purpose (one
  // path segment, `.txt` only) and answered only when a key is actually configured — otherwise
  // this falls through like any other request.
  if (INDEXNOW_KEY_FILE.test(pathname)) {
    const settings = await store.getSettings().catch(() => null)
    const key = settings && indexNowKeyFile(settings, pathname)
    if (key) return new NextResponse(key, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
  }

  if (PASSTHROUGH.test(pathname) || PUBLIC_FILE.test(pathname)) return NextResponse.next()

  const matched = SITE_CONFIG.locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))
  if (matched) {
    // The root layout owns <html lang dir> but sits above the [lang] segment and has no route
    // params of its own, so the resolved locale rides along as a request header (same pattern
    // as yayatours' src/proxy.ts).
    const headers = new Headers(request.headers)
    headers.set('x-site-lang', matched)
    // [lang]/layout.tsx resolves SEO once per request (SeoJsonLd/SeoGtag) and needs the exact
    // pathname to do it — a layout has no route params of its own for the leaf page's path.
    headers.set('x-site-pathname', pathname + search)
    return NextResponse.next({ request: { headers } })
  }

  const locale = detectLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] }
