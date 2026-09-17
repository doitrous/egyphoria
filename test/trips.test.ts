import assert from 'node:assert/strict'
import test from 'node:test'
import { SITE_CONFIG } from '../site.config.ts'
import {
  DESTINATION_IDS, DESTINATION_TRIPS, TRIP_IDS, estimateFromTotal, formatPrice, getDestination, getTrip,
  listDestinations, listTrips,
} from '../lib/trips.ts'

test('every one of the 7 destinations resolves, with at least one activity, in every configured language', () => {
  assert.equal(DESTINATION_IDS.length, 7)
  for (const lang of SITE_CONFIG.locales) {
    for (const id of DESTINATION_IDS) {
      const d = getDestination(id, lang)
      assert.ok(d, `destination "${id}" missing for ${lang}`)
      assert.ok(d!.name.length > 0)
      assert.ok(d!.activities.length > 0, `destination "${id}" has no activities for ${lang}`)
    }
    assert.equal(listDestinations(lang).length, 7)
  }
})

test('cairo and giza split the same source destination\'s activities with no overlap and no loss', () => {
  const cairoEn = getDestination('cairo', 'en')!
  const gizaEn = getDestination('giza', 'en')!
  assert.equal(cairoEn.activities.length + gizaEn.activities.length, 8, 'cairo + giza should account for all 8 original cairo activities')
  const cairoTexts = new Set(cairoEn.activities.map((a) => a[1]))
  for (const [, text] of gizaEn.activities) assert.ok(!cairoTexts.has(text), `"${text}" duplicated between cairo and giza`)
})

test('every one of the 8 trips resolves, with highlights, in every configured language', () => {
  assert.equal(TRIP_IDS.length, 8)
  for (const lang of SITE_CONFIG.locales) {
    for (const id of TRIP_IDS) {
      const trip = getTrip(id, lang)
      assert.ok(trip, `trip "${id}" missing for ${lang}`)
      assert.ok(trip!.highlights.length > 0, `trip "${id}" has no highlights for ${lang}`)
      assert.ok(['multi', 'day'].includes(trip!.kind))
      // Fix round 1, blocker #1: the board's PLACE column leads with this — never blank.
      assert.ok(trip!.location.length > 0, `trip "${id}" has no location for ${lang}`)
    }
    assert.equal(listTrips(lang).length, 8)
  }
})

test('every destination lists at least one real trip, and every listed trip actually exists', () => {
  for (const id of DESTINATION_IDS) {
    const trips = DESTINATION_TRIPS[id]
    assert.ok(trips?.length, `destination "${id}" links no trips`)
    for (const tripId of trips) assert.ok(TRIP_IDS.includes(tripId), `destination "${id}" links unknown trip "${tripId}"`)
  }
})

test('formatPrice: "from" trips are prefixed, single-price day trips are not', () => {
  assert.equal(formatPrice('egypt-unfolded'), 'from $1,450')
  assert.equal(formatPrice('giza-day'), '$120')
  assert.equal(formatPrice('unknown-trip'), '')
})

// Fix round 1, blocker #3: the builder's running total must never quote a figure cheaper than
// any bookable trip.
test('estimateFromTotal: names the cheapest real trip that covers the whole selection', () => {
  // cairo+luxor+aswan: only "egypt-unfolded" ($1,450) covers all three — not the old $1,255
  // (giza-day $120 + luxor-day $180 + nile $980 summed independently, cheaper than any real
  // trip that actually visits all three places).
  assert.deepEqual(estimateFromTotal(['cairo', 'luxor', 'aswan']), { kind: 'covered', amount: 1450, tripId: 'egypt-unfolded' })
  // luxor+aswan alone: "nile" ($980) covers both and is cheaper than "egypt-unfolded".
  assert.deepEqual(estimateFromTotal(['luxor', 'aswan']), { kind: 'covered', amount: 980, tripId: 'nile' })
})

test('estimateFromTotal: no real trip covers the selection -> no number', () => {
  // No single trip's `places` covers desert+alexandria together.
  assert.deepEqual(estimateFromTotal(['desert', 'alexandria']), { kind: 'none' })
  assert.deepEqual(estimateFromTotal([]), { kind: 'none' })
})
