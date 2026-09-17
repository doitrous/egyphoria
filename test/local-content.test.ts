import assert from 'node:assert/strict'
import test from 'node:test'
import { readdirSync } from 'node:fs'
import authors from '../content/authors.json' with { type: 'json' }
import { SITE_CONFIG } from '../site.config.ts'

// ---- local fallback content: shape matches what lib/authors.ts / lib/help.ts expect, mirroring
// test/tools.test.ts's config-parsing checks for the local tool files.

test('content/authors.json: every entry has the Author fields minus slug', () => {
  for (const [slug, author] of Object.entries(authors as Record<string, Record<string, unknown>>)) {
    assert.ok(slug.length > 0)
    for (const key of ['name', 'title', 'credentials', 'sameAs', 'bio']) {
      assert.ok(key in author, `${slug} is missing "${key}"`)
    }
    assert.ok(Array.isArray((author as { sameAs: unknown }).sameAs))
  }
})

test('content/help/*.json: every one of the 5 migrated entries has the HelpEntry fields minus slug/lang', async () => {
  const files = readdirSync(new URL('../content/help/', import.meta.url)).filter((f) => f.endsWith('.json'))
  assert.equal(files.length, 5, 'expected the 5 entries ported from the old src/content/help.json')
  for (const file of files) {
    const mod = (await import(`../content/help/${file}`, { with: { type: 'json' } })) as { default: Record<string, Record<string, unknown>> }
    const entry = mod.default.en
    for (const key of ['question', 'answerHtml', 'moneyPageUrl', 'updatedAt']) {
      assert.ok(key in entry, `${file} is missing "${key}"`)
    }
    assert.match(entry.updatedAt as string, /^\d{4}-\d{2}-\d{2}$/)
  }
})

test('SITE_CONFIG.popularSearches: every configured locale has a list of {label, href} entries (10-internal-linking-menu-footer.md)', () => {
  for (const lang of SITE_CONFIG.locales) {
    assert.ok(lang in SITE_CONFIG.popularSearches, `${lang} has no popularSearches entry`)
    assert.ok(SITE_CONFIG.popularSearches[lang].length >= 6 && SITE_CONFIG.popularSearches[lang].length <= 12)
    for (const s of SITE_CONFIG.popularSearches[lang]) {
      assert.ok(typeof s.label === 'string' && s.label.length > 0)
      assert.ok(typeof s.href === 'string' && s.href.startsWith('/'))
    }
  }
})
