'use client'

import { useState } from 'react'
import { createPlan, type Destination } from '@/lib/itinerary'
import { estimateFromTotal } from '@/lib/trips'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = any

// Raw (pre-split) destination ids, exactly as trip.places references them — see lib/trips.ts's
// getRawDestinations. Not the same id set as the 7 SEO destination pages.
const ROUTE_ORDER = ['cairo', 'alexandria', 'desert', 'luxor', 'aswan', 'redsea']
const DEFAULT_CHECKED = new Set(['cairo', 'luxor', 'aswan'])
const INTERESTS = ['history', 'culture', 'nature', 'relax'] as const

/** Home page "Create your itinerary" form — ported from src/client/app.js's builder wiring.
 * Dispatches a "egyphoria:start-plan" CustomEvent that <PlanDialog/> (mounted once in
 * [lang]/layout.tsx) listens for, rather than importing the dialog directly.
 *
 * V2-PHASE-9b (The Continental Timetable) restyle: a decorative day-cell strip mirrors the
 * `days` control (so the form reads like a timetable, "Day 1…Day n" across the top), the
 * destination checkboxes become toggle "station" chips (CSS only — same inputs, same
 * submit-time DOM query below), and a running total row (`selected` state, tracked alongside
 * the existing uncontrolled checkboxes purely for this display) shows days and a real,
 * sourced "from" total via `estimateFromTotal`. None of the existing submit behaviour, props or
 * plan-generation logic changes.
 *
 * Fix round 1, blocker #3: the running total now calls `estimateFromTotal`'s new
 * `BuilderEstimate` shape — a real covering trip's price + name, or no number at all — rather
 * than a summed lower bound that could undercut every bookable trip. `tripNames` (id -> the
 * lang's trip name) lets it name that trip without pulling in `lib/i18n`'s trips file here. */
export default function TripBuilderForm({
  dict, destinations, tripNames,
}: {
  dict: Dict
  destinations: Record<string, Destination>
  tripNames: Record<string, string>
}) {
  const [days, setDays] = useState(7)
  const [pace, setPace] = useState<'slow' | 'balanced' | 'full'>('balanced')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_CHECKED))

  function t(key: string, vars?: Record<string, string | number>): string {
    const lookup = (d: Dict) => key.split('.').reduce((o: Dict, k: string) => (o == null ? o : o[k]), d)
    const value = lookup(dict) ?? key
    return String(value).replace(/\{(\w+)\}/g, (_m, k) => (vars && k in vars ? String(vars[k]) : `{${k}}`))
  }

  const destIds = Object.keys(destinations).sort((a, b) => ROUTE_ORDER.indexOf(a) - ROUTE_ORDER.indexOf(b))

  function toggleDestination(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const places = Array.from(form.querySelectorAll<HTMLInputElement>('[name="destination"]:checked'))
      .map((i) => i.value)
      .sort((a, b) => ROUTE_ORDER.indexOf(a) - ROUTE_ORDER.indexOf(b))
    const interests = Array.from(form.querySelectorAll<HTMLInputElement>('.interest-options input:checked')).map((i) => i.value)
    try {
      const plan = createPlan(destinations, t, { places, days, pace, interests })
      setError('')
      window.dispatchEvent(new CustomEvent('egyphoria:start-plan', { detail: plan }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const estimate = estimateFromTotal([...selected])

  return (
    <form id="builder-form" onSubmit={onSubmit}>
      <div className="builder-day-cells" aria-hidden="true">
        {Array.from({ length: days }, (_, i) => (
          <span key={i} className="builder-day-cell">
            {t('home.weekDaySingle', { n: i + 1 })}
          </span>
        ))}
      </div>
      <fieldset>
        <legend>{t('builder.whereLegend')}</legend>
        <div id="destination-options" className="builder-stations">
          {destIds.map((id) => (
            <label key={id}>
              <input
                type="checkbox"
                name="destination"
                value={id}
                defaultChecked={DEFAULT_CHECKED.has(id)}
                onChange={(e) => toggleDestination(id, e.target.checked)}
              />
              <span>{destinations[id].name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        {t('builder.daysLabel')}
        <input id="duration" type="number" min={1} max={14} value={days} onChange={(e) => setDays(Number(e.target.value))} />
      </label>
      <label>
        {t('builder.paceLabel')}
        <select value={pace} onChange={(e) => setPace(e.target.value as typeof pace)}>
          <option value="slow">{t('builder.paceSlow')}</option>
          <option value="balanced">{t('builder.paceBalanced')}</option>
          <option value="full">{t('builder.paceFull')}</option>
        </select>
      </label>
      <fieldset className="interest-options">
        <legend>{t('builder.interestsLegend')}</legend>
        {INTERESTS.map((key) => (
          <label key={key}>
            <input type="checkbox" value={key} />
            <span>{t(`builder.interest${key[0].toUpperCase()}${key.slice(1)}`)}</span>
          </label>
        ))}
      </fieldset>
      <div className="builder-total" aria-live="polite">
        <span>{t('home.builderTotalDays', { n: days })}</span>
        {estimate.kind === 'covered' ? (
          <span>
            {t('home.builderMatchesTrip', {
              amount: `$${estimate.amount.toLocaleString('en-US')}`,
              tripName: tripNames[estimate.tripId] ?? '',
            })}
          </span>
        ) : (
          <span>{t('home.builderCustomQuote')}</span>
        )}
      </div>
      <p id="builder-error" role="alert">
        {error}
      </p>
      <button type="submit" className="button-primary">
        {t('builder.submit')}
      </button>
      <p className="form-note">{t('builder.formNote')}</p>
    </form>
  )
}
