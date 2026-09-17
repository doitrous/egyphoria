import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import tripCost from '../content/tools/trip-cost.json' with { type: 'json' }
import {
  bmiRange, computeBmi, computeCostEstimate, computeSessions, computeTipping,
  defaultValues, findSeasonMonth, findVisaRule,
} from '../packages/tools/calc.ts'
import type {
  BmiEligibilityConfig, CostEstimatorConfig, SeasonPickerConfig, SessionsEstimatorConfig,
  TippingBudgetConfig, VisaCheckerConfig,
} from '../packages/tools/types.ts'

// ---- config parsing: the one shipped local tool file loads and matches the shape calc.ts expects.

test('trip-cost.json parses into a valid cost-estimator config for every shipped language', () => {
  for (const lang of ['en', 'nl', 'fr', 'el', 'tr', 'es'] as const) {
    const entry = (tripCost as Record<string, { kind: string; config: CostEstimatorConfig; asOf: string }>)[lang]
    assert.equal(entry.kind, 'cost-estimator')
    assert.ok(entry.config.inputs.length > 0)
    assert.match(entry.asOf, /^\d{4}-\d{2}-\d{2}$/)
  }
})

// ---- one calculation per tool kind (trip-cost exercises cost-estimator; the rest are generic
// packages/tools/calc.ts checks, kept as regression coverage for the shared kit egyphoria's own
// tool is built on).

test('cost-estimator: trip-cost totals nights + travelers + hotel tier, no flights', () => {
  const config = (tripCost as Record<string, { config: CostEstimatorConfig }>).en.config
  const values = { nights: 5, travelers: 2, hotelTier: 'mid', includeFlights: false }
  // 5*45 + 2*20 + 35 (mid) + 0 (no flights) = 225 + 40 + 35 = 300
  assert.equal(computeCostEstimate(config, values), 300)
})

test('cost-estimator: default values come straight from each input\'s own default', () => {
  const config = (tripCost as Record<string, { config: CostEstimatorConfig }>).en.config
  assert.deepEqual(defaultValues(config.inputs), { nights: 5, travelers: 2, hotelTier: 'mid', includeFlights: false })
})

test('comparison-table: config parses as plain rows/columns (no calculation, rendered as-is)', () => {
  const config = { title: 't', columns: [{ key: 'a', label: 'A' }], rows: [{ label: 'r', values: { a: 1 } }] }
  assert.equal(config.rows[0].values.a, 1)
})

test('season-picker: finds the configured month by name', () => {
  const config: SeasonPickerConfig = {
    title: 'Best time to visit',
    months: [{ month: 'Oct', label: 'October', rating: 5, note: 'Peak season' }],
  }
  assert.equal(findSeasonMonth(config, 'Oct')?.rating, 5)
  assert.equal(findSeasonMonth(config, 'Feb'), null)
})

test('bmi-eligibility: computes BMI and picks the matching range', () => {
  const config: BmiEligibilityConfig = {
    title: 'Eligibility',
    ranges: [{ maxBmi: 18.5, label: 'Underweight', eligible: false }, { maxBmi: 25, label: 'Normal', eligible: true }],
  }
  const bmi = computeBmi(170, 70) // 70 / 1.7^2 = 24.2
  assert.equal(bmi, 24.2)
  assert.equal(bmiRange(config, bmi)?.label, 'Normal')
})

test('visa-checker: matches nationality case-insensitively', () => {
  const config: VisaCheckerConfig = {
    title: 'Visa', defaultNotice: 'contact us',
    rules: [{ nationality: 'Egyptian', requirement: 'None', notes: 'ID card only' }],
  }
  assert.equal(findVisaRule(config, 'egyptian')?.requirement, 'None')
  assert.equal(findVisaRule(config, 'Martian'), null)
})

test('tipping-budget: sums per-day rate over included roles only', () => {
  const config: TippingBudgetConfig = {
    title: 'Tipping', currency: 'USD', defaultDays: 5,
    roles: [
      { key: 'guide', label: 'Guide', perDay: 10, defaultIncluded: true },
      { key: 'driver', label: 'Driver', perDay: 5, defaultIncluded: false },
    ],
  }
  assert.equal(computeTipping(config, 5, ['guide']), 50)
  assert.equal(computeTipping(config, 5, ['guide', 'driver']), 75)
})

test('sessions-estimator: base sessions plus selected factors, priced per session', () => {
  const config: SessionsEstimatorConfig = {
    title: 'Sessions', currency: 'USD', baseSessions: 3, pricePerSession: 50,
    factors: [{ key: 'severe', label: 'Severe case', extraSessions: 2 }],
  }
  assert.deepEqual(computeSessions(config, []), { sessions: 3, cost: 150 })
  assert.deepEqual(computeSessions(config, ['severe']), { sessions: 5, cost: 250 })
})

// ---- embed snippet: the backlink lives outside the iframe, and the title is HTML-escaped.

test('embedSnippet: iframe to /embed plus a plain link to the tool page and the home page', async () => {
  const { embedSnippet, toolTitle } = await import('../packages/tools/embed.ts')
  const out = embedSnippet({ origin: 'https://example.net', slug: 'trip-cost', lang: 'ar', title: 'Trip <b>Cost</b>', siteName: 'A & B' })
  assert.match(out, /<iframe src="https:\/\/example\.net\/tools\/trip-cost\/embed\?lang=ar" title="Trip &lt;b&gt;Cost&lt;\/b&gt;"/)
  assert.match(out, /<a href="https:\/\/example\.net\/tools\/trip-cost">Trip &lt;b&gt;Cost&lt;\/b&gt;<\/a>/)
  assert.match(out, /<a href="https:\/\/example\.net\/" rel="nofollow">A &amp; B<\/a>/)
  assert.match(out, /iframe\[src\^="https:\/\/example\.net\/"\]/)
  assert.equal(toolTitle({ slug: 's', config: {} }), 's')
  assert.equal(toolTitle({ slug: 's', config: { title: 'T' } }), 'T')
})

// ---- vanilla bundle: public/seo-tools.js (built by scripts/build-vanilla.mjs from
// packages/tools/vanilla.ts) runs standalone and exposes window.SeoTools for all 7 kinds.

test('vanilla bundle: exposes window.SeoTools with all 7 kinds and an embedSnippet function', () => {
  const code = readFileSync(new URL('../public/seo-tools.js', import.meta.url), 'utf8')
  const window: { SeoTools?: { kinds: unknown[]; embedSnippet: unknown }; addEventListener: () => void } = { addEventListener: () => {} }
  const document = { readyState: 'complete', querySelectorAll: () => [], addEventListener: () => {} }
  const context = vm.createContext({ window, document })
  vm.runInContext(code, context)
  assert.equal(window.SeoTools?.kinds.length, 7)
  // The bundle's snippet must carry the same nofollow credit and origin-scoped resize listener
  // as the TS source — a stale committed bundle once shipped without them.
  const snippet = (window.SeoTools as { embedSnippet: (o: object) => string }).embedSnippet({ origin: 'https://example.net', slug: 's', lang: 'en', title: 'T', siteName: 'N' })
  assert.match(snippet, /rel="nofollow"/)
  assert.match(snippet, /iframe\[src\^="https:\/\/example\.net\/"\]/)
})

test('vanilla bundle: the committed public/seo-tools.js is built from the current source', async () => {
  const { build } = await import('esbuild')
  const fresh = await build({ entryPoints: ['packages/tools/vanilla.ts'], bundle: true, minify: true, format: 'iife', target: 'es2019', write: false })
  const committed = readFileSync(new URL('../public/seo-tools.js', import.meta.url), 'utf8')
  assert.equal(committed, fresh.outputFiles[0].text, 'run `npm run build:vanilla` and commit public/seo-tools.js')
})
