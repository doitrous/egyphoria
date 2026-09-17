import assert from 'node:assert/strict'
import test from 'node:test'
import { createPlan, planFromTrip, planText, type Destination } from '../lib/itinerary.ts'

const t = (key: string, vars: Record<string, string | number> = {}) =>
  String(key).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))

const DESTINATIONS: Record<string, Destination> = {
  cairo: { name: 'Cairo', activities: [['history', 'a'], ['culture', 'b'], ['relax', 'c']] },
  luxor: { name: 'Luxor', activities: [['history', 'd'], ['nature', 'e']] },
}

test('createPlan rejects an out-of-range day count', () => {
  assert.throws(() => createPlan(DESTINATIONS, t, { places: ['cairo'], days: 0 }))
  assert.throws(() => createPlan(DESTINATIONS, t, { places: ['cairo'], days: 15 }))
})

test('createPlan rejects an unknown destination', () => {
  assert.throws(() => createPlan(DESTINATIONS, t, { places: ['atlantis'], days: 3 }))
})

test('createPlan rejects too few days for a multi-destination route', () => {
  assert.throws(() => createPlan(DESTINATIONS, t, { places: ['cairo', 'luxor'], days: 2 }))
})

test('createPlan allocates one day per single destination', () => {
  const plan = createPlan(DESTINATIONS, t, { places: ['cairo'], days: 1 })
  assert.equal(plan.length, 1)
  assert.equal(plan[0].place, 'cairo')
  assert.ok(plan[0].activities.length > 0)
})

test('createPlan inserts a travel day when moving between destinations', () => {
  const plan = createPlan(DESTINATIONS, t, { places: ['cairo', 'luxor'], days: 4 })
  assert.equal(plan.length, 4)
  const travelDay = plan.find((d) => d.place === 'luxor' && d.activities[0].startsWith('gen.travelDay'))
  assert.ok(travelDay, 'expected a travel-day entry when the itinerary moves to a new place')
})

test('planFromTrip: a day trip uses its own highlights verbatim (pipe replaced by ": ")', () => {
  const plan = planFromTrip(DESTINATIONS, t, { id: 'giza-day', kind: 'day', places: ['cairo'], days: 1, name: 'A day trip', highlights: ['Morning|See the pyramids'] })
  assert.deepEqual(plan, [{ place: 'cairo', title: 'A day trip', activities: ['Morning: See the pyramids'] }])
})

test('planText renders a header, one line per day, and the disclaimer', () => {
  const plan = [{ place: 'cairo', title: 'Cairo', activities: ['Do a thing'] }]
  const text = planText(t, plan, { name: 'Amir' })
  assert.match(text, /plan\.txtTitle/)
  assert.match(text, /plan\.preparedFor: Amir/)
  assert.match(text, /• Do a thing/)
  assert.match(text, /plan\.txtDisclaimer$/)
})
