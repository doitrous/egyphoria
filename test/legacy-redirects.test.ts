import assert from 'node:assert/strict'
import test from 'node:test'
import { legacyRedirectTarget } from '../lib/legacy-redirects.ts'
import { SITE_CONFIG } from '../site.config.ts'
import { DESTINATION_IDS, TRIP_IDS } from '../lib/trips.ts'
import { LOCAL_JOURNAL_SLUGS } from '../lib/journal.ts'

// Every <loc> path from the old build's dist/sitemap.xml (captured before dist/ was deleted per
// the ticket's step 6 — 126 URLs, https://egyphoria.com origin stripped). Every one of them must
// 301 through legacyRedirectTarget, in a single hop, to a path this app actually serves.
const OTHER_LOCALES = ['nl', 'fr', 'el', 'tr', 'es']
const TRIP_SLUGS = ['alex-day', 'cairo-day', 'desert', 'egypt-unfolded', 'giza-day', 'luxor-day', 'nile', 'red-sea']
const HELP_SLUGS = ['best-time-to-visit-egypt', 'do-i-need-a-visa-to-visit-egypt', 'how-much-does-a-trip-to-egypt-cost', 'is-egypt-safe-for-tourists', 'what-should-i-pack-for-egypt']
const JOURNAL_SLUGS = ['first-time-pyramids-of-giza', 'how-many-days-in-egypt']

function oldSitemapPaths(): string[] {
  const paths: string[] = ['/']
  const perLangBlock = (prefix: string) => {
    paths.push(`${prefix}/`)
    for (const slug of TRIP_SLUGS) paths.push(`${prefix}/trips/${slug}/`)
    paths.push(`${prefix}/journal/`)
    for (const slug of JOURNAL_SLUGS) paths.push(`${prefix}/journal/${slug}/`)
    paths.push(`${prefix}/photography/`)
    paths.push(`${prefix}/tools/trip-cost/`)
    paths.push(`${prefix}/help/`)
    for (const slug of HELP_SLUGS) paths.push(`${prefix}/help/${slug}/`)
    paths.push(`${prefix}/editorial-guidelines/`)
  }
  // Bare English (root, no /en prefix, per the old build).
  paths.push('/editorial-guidelines/', '/help/', '/photography/', '/tools/trip-cost/', '/journal/')
  for (const slug of HELP_SLUGS) paths.push(`/help/${slug}/`)
  for (const slug of JOURNAL_SLUGS) paths.push(`/journal/${slug}/`)
  for (const slug of TRIP_SLUGS) paths.push(`/trips/${slug}/`)
  for (const lang of OTHER_LOCALES) perLangBlock(`/${lang}`)
  return [...new Set(paths)]
}

/** The exact set of routes this app serves, independent of lib/seo.ts (which starts the hub
 * sync timer at module scope — not something a unit test should trigger). Mirrors
 * lib/seo.ts's STATIC_PATHS plus the locale-free routes the app renders itself. */
function isServedRoute(pathWithQuery: string): boolean {
  const [path, query] = pathWithQuery.split('?')
  const lang = new URLSearchParams(query ?? '').get('lang')
  const localeFreeOk = query === undefined || (lang !== null && SITE_CONFIG.locales.includes(lang))

  if (/^\/(help|editorial-guidelines)$/.test(path)) return localeFreeOk
  if (/^\/help\/[^/]+$/.test(path)) return localeFreeOk && HELP_SLUGS.includes(path.split('/')[2])
  if (/^\/tools\/trip-cost(\/embed)?$/.test(path)) return localeFreeOk

  const langMatch = path.match(/^\/(en|nl|fr|el|tr|es)((?:\/.*)?)$/)
  if (!langMatch) return false
  const rest = langMatch[2]
  if (rest === '') return true
  if (['/destinations', '/trips', '/journal', '/photography', '/booking/complete', '/about', '/contact', '/privacy', '/terms'].includes(rest)) return true
  const destMatch = rest.match(/^\/destinations\/([^/]+)$/)
  if (destMatch) return DESTINATION_IDS.includes(destMatch[1])
  const tripMatch = rest.match(/^\/trips\/([^/]+)$/)
  if (tripMatch) return TRIP_IDS.includes(tripMatch[1])
  const journalMatch = rest.match(/^\/journal\/([^/]+)$/)
  if (journalMatch) return LOCAL_JOURNAL_SLUGS.includes(journalMatch[1])
  return false
}

test('every URL in the old sitemap 301s in one hop to a route this app serves', () => {
  const paths = oldSitemapPaths()
  assert.ok(paths.length > 100, 'sanity check: expected >100 legacy paths')
  for (const oldPath of paths) {
    const target = legacyRedirectTarget(oldPath)
    assert.ok(target, `expected a redirect for ${oldPath}, got none`)
    assert.ok(!target!.endsWith('/') || target === '/', `${oldPath} -> ${target} still has a trailing slash`)
    assert.ok(isServedRoute(target!), `${oldPath} -> ${target}, which is not a served route`)
    // One hop: redirecting the target again should be a no-op.
    assert.equal(legacyRedirectTarget(target!.split('?')[0]), null, `${target} should already be canonical`)
  }
})

test('legacyRedirectTarget leaves API, admin and files alone', () => {
  assert.equal(legacyRedirectTarget('/api/seo/health'), null)
  assert.equal(legacyRedirectTarget('/robots.txt'), null)
  assert.equal(legacyRedirectTarget('/sitemap.xml'), null)
  assert.equal(legacyRedirectTarget('/assets/giza.jpg'), null)
})

test('legacyRedirectTarget handles the tool embed row too (not in the old sitemap, but in the ticket\'s redirect map)', () => {
  assert.equal(legacyRedirectTarget('/tools/trip-cost/embed/'), '/tools/trip-cost/embed')
  assert.equal(legacyRedirectTarget('/el/tools/trip-cost/embed/'), '/tools/trip-cost/embed?lang=el')
  assert.ok(isServedRoute('/tools/trip-cost/embed'))
  assert.ok(isServedRoute('/tools/trip-cost/embed?lang=el'))
})

test('legacyRedirectTarget: / -> /en, and booking/complete gets an /en prefix', () => {
  assert.equal(legacyRedirectTarget('/'), '/en')
  assert.equal(legacyRedirectTarget('/booking/complete/'), '/en/booking/complete')
})

test('legacyRedirectTarget leaves already-canonical new-style paths alone', () => {
  assert.equal(legacyRedirectTarget('/en'), null)
  assert.equal(legacyRedirectTarget('/en/trips/giza-day'), null)
  assert.equal(legacyRedirectTarget('/help'), null)
  assert.equal(legacyRedirectTarget('/help/do-i-need-a-visa-to-visit-egypt'), null)
})
