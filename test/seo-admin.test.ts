import assert from 'node:assert/strict'
import test from 'node:test'

// The same gate app/seo-admin/page.tsx calls: readConfig().secret (from SEO_HUB_SECRET) compared
// timing-safe against the request's ?secret= query param. Set the env var before importing
// config.ts — readConfig reads process.env at call time, not at import time.
process.env.SEO_HUB_SECRET = 'test-secret-value'

test('the seo-admin gate rejects a missing or wrong secret', async () => {
  const { readConfig, timingSafeSecret } = await import('@omary98/seo-runtime-core')
  const expected = readConfig().secret
  assert.equal(timingSafeSecret('', expected), false)
  assert.equal(timingSafeSecret('wrong', expected), false)
})

test('the seo-admin gate accepts the configured secret', async () => {
  const { readConfig, timingSafeSecret } = await import('@omary98/seo-runtime-core')
  const expected = readConfig().secret
  assert.equal(timingSafeSecret('test-secret-value', expected), true)
})

test('an unset secret never authorizes anything, even an empty query param', async () => {
  const { timingSafeSecret } = await import('@omary98/seo-runtime-core')
  assert.equal(timingSafeSecret('', ''), false)
})
