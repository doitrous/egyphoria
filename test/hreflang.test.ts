import assert from 'node:assert/strict'
import test from 'node:test'
import { localAlternates } from '../lib/hreflang.ts'
import { SITE_CONFIG } from '../site.config.ts'

test('localAlternates carries one entry per configured locale plus x-default', () => {
  const alternates = localAlternates('/about')
  for (const lang of SITE_CONFIG.locales) {
    assert.equal(alternates[lang], `${SITE_CONFIG.baseUrl}/${lang}/about`)
  }
  assert.equal(alternates['x-default'], `${SITE_CONFIG.baseUrl}/${SITE_CONFIG.defaultLocale}/about`)
})

test('localAlternates for the home path has no trailing double slash', () => {
  const alternates = localAlternates('')
  assert.equal(alternates.en, `${SITE_CONFIG.baseUrl}/en`)
  assert.ok(!alternates.en.endsWith('//'))
})
