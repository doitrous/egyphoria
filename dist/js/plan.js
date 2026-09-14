// Itinerary generation — ported from the original data.mjs, generalised to
// take destinations + localised text templates instead of globals.
import { destinations, S, fmt } from './data.js';

export function createPlan({ places, days, pace = 'balanced', interests = [] }) {
  if (!Number.isInteger(days) || days < 1 || days > 14) throw new Error(S('gen.errDays'));
  if (!places.length || places.some(p => !destinations[p])) throw new Error(S('gen.errPlaces'));
  if (places.length > 1 && days < places.length * 2) throw new Error(fmt(S('gen.errShort'), { n: places.length * 2 }));
  const allocation = places.map((_, i) => Math.floor(days / places.length) + (i < days % places.length ? 1 : 0));
  const count = pace === 'slow' ? 1 : pace === 'full' ? 3 : 2;
  const plan = [];
  places.forEach((place, index) => {
    const destination = destinations[place];
    const candidates = destination.activities
      .map((a, i) => ({ text: a[1], score: interests.includes(a[0]) ? 1 : 0, i }))
      .sort((a, b) => b.score - a.score || a.i - b.i);
    let cursor = 0;
    for (let local = 0; local < allocation[index]; local++) {
      let activities = [];
      if (local === 0 && index > 0) {
        activities = [fmt(S('gen.travelDay'), { from: destinations[places[index - 1]].name, to: destination.name })];
      } else {
        for (let n = 0; n < count; n++) {
          if (cursor < candidates.length) {
            const next = candidates[cursor].text;
            if (next.includes('full day') && activities.length) break;
            activities.push(next); cursor++;
            if (next.includes('full day')) break;
          }
        }
        if (!activities.length) activities = [fmt(S('gen.freeDay'), { place: destination.name })];
      }
      plan.push({ place, title: destination.name, activities });
    }
  });
  return plan;
}

export function planFromTrip(trip) {
  if (trip.kind === 'day') return [{ place: trip.places[0], title: trip.name, activities: trip.highlights.map(h => h.replace('|', ': ')) }];
  if (trip.id === 'desert') return trip.highlights.map(h => ({ place: 'desert', title: destinations.desert.name, activities: [h.split('|')[1]] }));
  return createPlan({ places: trip.places, days: trip.days, interests: ['history', 'culture'], pace: 'balanced' });
}

// Plain-text itinerary for the .txt download. `details` is optional.
export function planText(plan, details = {}) {
  const head = [S('plan.txtTitle'), fmt(S('plan.txtSub'), { n: plan.length, unit: plan.length === 1 ? S('journeys.day') : S('journeys.days') })];
  if (details.name) head.push('', `${S('plan.preparedFor')}: ${details.name}`);
  if (details.startDate) head.push(`${S('plan.startDate')}: ${details.startDate}`);
  if (details.travelers) head.push(`${S('plan.travelers')}: ${details.travelers}`);
  return [
    ...head, '',
    ...plan.flatMap((day, index) => [
      `${S('plan.day')} ${index + 1} — ${day.title}`,
      ...day.activities.map(a => `• ${a}`), '',
    ]),
    S('plan.txtDisclaimer'),
  ].join('\n');
}
