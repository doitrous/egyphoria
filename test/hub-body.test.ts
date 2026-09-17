import assert from 'node:assert/strict'
import test from 'node:test'
import type { StoredArticle } from '@omary98/seo-runtime-core'
import { store } from '../lib/store.ts'
import { hubBodyFor, hubBodySlugFor, HUB_BODY_SLUGS } from '../lib/hub-body.ts'
import { legacyRedirectTarget } from '../lib/legacy-redirects.ts'
import { listJournal } from '../lib/journal.ts'
import { DESTINATION_IDS, TRIP_IDS } from '../lib/trips.ts'

// store is the shared singleton lib/seo.ts and lib/journal.ts also import — monkey-patching its
// methods for one test and restoring immediately after is the lightest way to exercise the
// "hub has written this slug" branch without a real snapshot file on disk (see seo-fallback.
// test.ts's comment on why the cold-store default is safe to rely on for the "absent" branch).
function fakeArticle(overrides: Partial<StoredArticle>): StoredArticle {
  return {
    externalId: 1, lang: 'en', slug: 'destination-giza', title: 'Giza', metaTitle: 'Giza | Egyphoria',
    metaDescription: 'Giza meta', bodyMd: '', bodyHtml: '<p>Hub-written Giza copy.</p>',
    faq: [{ q: 'Is Giza safe?', a: 'Yes.' }], schemaJsonld: [], imageUrl: null, imageAlt: null,
    authorName: null, authorCredentials: null, references: [], og: {}, extra: {},
    publishedAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as StoredArticle
}

test('HUB_BODY_SLUGS is exactly the 7 destination + 8 trip slugs', () => {
  assert.equal(HUB_BODY_SLUGS.length, 15)
  for (const id of DESTINATION_IDS) assert.ok(HUB_BODY_SLUGS.includes(hubBodySlugFor('destination', id)))
  for (const id of TRIP_IDS) assert.ok(HUB_BODY_SLUGS.includes(hubBodySlugFor('trip', id)))
})

test('hubBodyFor: no hub article for this (lang, slug) -> null (page renders its own existing copy)', async () => {
  const body = await hubBodyFor('en', hubBodySlugFor('destination', 'giza'))
  assert.equal(body, null)
})

test('hubBodyFor: a stored hub article under the fixed slug -> its body + FAQ', async () => {
  const original = store.findArticleBySlug.bind(store)
  store.findArticleBySlug = async (lang: string, slug: string) =>
    lang === 'en' && slug === 'destination-giza' ? fakeArticle({}) : null
  try {
    const body = await hubBodyFor('en', hubBodySlugFor('destination', 'giza'))
    assert.ok(body)
    assert.equal(body!.bodyHtml, '<p>Hub-written Giza copy.</p>')
    assert.equal(body!.metaTitle, 'Giza | Egyphoria')
    assert.equal(body!.faq.length, 1)
    assert.equal(body!.faq[0].q, 'Is Giza safe?')
  } finally {
    store.findArticleBySlug = original
  }
})

test('listJournal excludes HUB_BODY_SLUGS even when the hub has pushed one under a journal-shaped call', async () => {
  const original = store.listArticles.bind(store)
  store.listArticles = async (lang?: string) => [
    fakeArticle({ slug: 'destination-giza', lang: lang ?? 'en' }),
    fakeArticle({ slug: 'a-real-journal-post', lang: lang ?? 'en', title: 'Real post' }),
  ]
  try {
    const items = await listJournal('en')
    assert.ok(!items.some((i) => i.slug === 'destination-giza'), 'destination-giza leaked into the journal listing')
    assert.ok(items.some((i) => i.slug === 'a-real-journal-post'))
  } finally {
    store.listArticles = original
  }
})

test('legacyRedirectTarget: a direct /{lang}/journal/{destination|trip}-{id} hit 301s to the real page', () => {
  assert.equal(legacyRedirectTarget('/en/journal/destination-giza'), '/en/destinations/giza')
  assert.equal(legacyRedirectTarget('/fr/journal/trip-nile'), '/fr/trips/nile')
  // A slug that merely looks like the pattern but isn't one of the 15 is untouched — it's a real
  // (or nonexistent) journal post, not hub-body copy.
  assert.equal(legacyRedirectTarget('/en/journal/destination-nowhere'), null)
})
