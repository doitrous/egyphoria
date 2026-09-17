import assert from 'node:assert/strict'
import test from 'node:test'
import { SITE_CONFIG } from '../site.config.ts'
import {
  DESTINATION_IDS, DESTINATION_TRIPS, TRIP_IDS, formatPrice, getDestination, getTrip, listDestinations, listTrips,
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
