import assert from 'node:assert/strict'
import test from 'node:test'
import { pageMetadata, localeFreeMetadata, NOINDEX_PATHS } from '../lib/page-metadata.ts'
import { seo, providerPages } from '../lib/seo.ts'
import { localSitemapEntries } from '../lib/local-seo.ts'
import { SITE_CONFIG } from '../site.config.ts'

// These import lib/seo.ts (createSeo + seo.start()), unlike the rest of the suite, which avoids
// it — but on this machine there is no .env, so SEO_HUB_URL/SEO_HUB_SECRET are both unset:
// pullSnapshot()/sendHealth() both bail out before any fetch or file write (see sync.ts/
// health.ts), and their setInterval timers are .unref()'d, so this never blocks `node --test`
// from exiting. What's actually exercised here — reading a store with no snapshot on disk yet —
// is exactly the "cold store" case these tests are for.

test('a no-snapshot render of /en has a non-empty title and an absolute canonical', async () => {
  const metadata = await pageMetadata('', 'en')
  assert.ok(metadata.title, 'expected a non-empty title on a cold store')
  assert.ok(String(metadata.title).length > 0)
  const canonical = (metadata.alternates as { canonical?: string } | undefined)?.canonical
  assert.ok(canonical, 'expected a canonical URL')
  assert.ok(canonical!.startsWith(SITE_CONFIG.baseUrl), `canonical ${canonical} is not absolute`)
  assert.ok(metadata.description, 'expected a non-empty description on a cold store')
})

test('seo.resolve() always returns an absolute canonical, even on a cold store (feeds every page JSON-LD url/item field)', async () => {
  const resolved = await seo.resolve('/en/trips/egypt-unfolded', 'en')
  assert.ok(resolved.canonical.startsWith(SITE_CONFIG.baseUrl), `canonical ${resolved.canonical} is not absolute`)
})

test('/sitemap.xml with an empty store lists every providerPages() path, each with an absolute loc', async () => {
  const pages = await providerPages()
  const entries = localSitemapEntries(pages)
  assert.equal(entries.length, pages.length)
  for (const entry of entries) {
    assert.ok(entry.loc.startsWith(SITE_CONFIG.baseUrl), `${entry.loc} is not absolute`)
  }
})

test('a no-snapshot render of the locale-free /help also has a non-empty title and absolute canonical', async () => {
  const metadata = await localeFreeMetadata('/help', 'en')
  assert.ok(metadata.title)
  const canonical = (metadata.alternates as { canonical?: string } | undefined)?.canonical
  assert.ok(canonical?.startsWith(SITE_CONFIG.baseUrl), `canonical ${canonical} is not absolute`)
})

test('privacy and terms are both noindex (NOINDEX_PATHS is the shared source both pages check)', () => {
  assert.ok(NOINDEX_PATHS.has('/privacy'))
  assert.ok(NOINDEX_PATHS.has('/terms'))
})
