// Itinerary generation — ported from the old static build's src/client/plan.js, generalised to
// take a translate function instead of importing a module-level i18n singleton, so it works
// identically on the server (not currently used there) and in the 'use client' dialog. Pure and
// framework-free on purpose: this is the one piece of non-trivial logic in the itinerary builder,
// so it gets the one runnable check (test/itinerary.test.ts) rather than only living inside a
// component nobody can unit test.
export type Destination = { name: string; activities: [string, string][] }
export type PlanDay = { place: string; title: string; activities: string[] }
export type Translate = (key: string, vars?: Record<string, string | number>) => string

export function createPlan(
  destinations: Record<string, Destination>,
  t: Translate,
  { places, days, pace = 'balanced', interests = [] }: { places: string[]; days: number; pace?: 'slow' | 'balanced' | 'full'; interests?: string[] },
): PlanDay[] {
  if (!Number.isInteger(days) || days < 1 || days > 14) throw new Error(t('gen.errDays'))
  if (!places.length || places.some((p) => !destinations[p])) throw new Error(t('gen.errPlaces'))
  if (places.length > 1 && days < places.length * 2) throw new Error(t('gen.errShort', { n: places.length * 2 }))

  const allocation = places.map((_, i) => Math.floor(days / places.length) + (i < days % places.length ? 1 : 0))
  const count = pace === 'slow' ? 1 : pace === 'full' ? 3 : 2
  const plan: PlanDay[] = []

  places.forEach((place, index) => {
    const destination = destinations[place]
    const candidates = destination.activities
      .map((a, i) => ({ text: a[1], score: interests.includes(a[0]) ? 1 : 0, i }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
    let cursor = 0
    for (let local = 0; local < allocation[index]; local++) {
      let activities: string[] = []
      if (local === 0 && index > 0) {
        activities = [t('gen.travelDay', { from: destinations[places[index - 1]].name, to: destination.name })]
      } else {
        for (let n = 0; n < count; n++) {
          if (cursor < candidates.length) {
            const next = candidates[cursor].text
            if (next.toLowerCase().includes('full day') && activities.length) break
            activities.push(next)
            cursor++
            if (next.toLowerCase().includes('full day')) break
          }
        }
        if (!activities.length) activities = [t('gen.freeDay', { place: destination.name })]
      }
      plan.push({ place, title: destination.name, activities })
    }
  })
  return plan
}

export type TripForPlan = { id: string; kind: 'multi' | 'day'; places: string[]; days: number; name: string; highlights: string[] }

export function planFromTrip(destinations: Record<string, Destination>, t: Translate, trip: TripForPlan): PlanDay[] {
  if (trip.kind === 'day') return [{ place: trip.places[0], title: trip.name, activities: trip.highlights.map((h) => h.replace('|', ': ')) }]
  return createPlan(destinations, t, { places: trip.places, days: trip.days, interests: ['history', 'culture'], pace: 'balanced' })
}

export type PlanDetails = { name?: string; email?: string; startDate?: string; travelers?: string; notes?: string }

/** Plain-text itinerary for the .txt download. */
export function planText(t: Translate, plan: PlanDay[], details: PlanDetails = {}): string {
  const unit = plan.length === 1 ? t('journeys.day') : t('journeys.days')
  const head = [t('plan.txtTitle'), t('plan.txtSub', { n: plan.length, unit })]
  if (details.name) head.push('', `${t('plan.preparedFor')}: ${details.name}`)
  if (details.startDate) head.push(`${t('plan.startDate')}: ${details.startDate}`)
  if (details.travelers) head.push(`${t('plan.travellers') ?? t('plan.travelers')}: ${details.travelers}`)
  return [
    ...head,
    '',
    ...plan.flatMap((day, index) => [`${t('plan.day')} ${index + 1} — ${day.title}`, ...day.activities.map((a) => `• ${a}`), '']),
    t('plan.txtDisclaimer'),
  ].join('\n')
}
