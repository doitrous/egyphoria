'use client'

import { useState } from 'react'
import { createPlan, type Destination } from '@/lib/itinerary'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = any

// Raw (pre-split) destination ids, exactly as trip.places references them — see lib/trips.ts's
// getRawDestinations. Not the same id set as the 7 SEO destination pages.
const ROUTE_ORDER = ['cairo', 'alexandria', 'desert', 'luxor', 'aswan', 'redsea']
const DEFAULT_CHECKED = new Set(['cairo', 'luxor', 'aswan'])
const INTERESTS = ['history', 'culture', 'nature', 'relax'] as const

/** Home page "Create your itinerary" form — ported from src/client/app.js's builder wiring.
 * Dispatches a "egyphoria:start-plan" CustomEvent that <PlanDialog/> (mounted once in
 * [lang]/layout.tsx) listens for, rather than importing the dialog directly. */
export default function TripBuilderForm({ dict, destinations }: { dict: Dict; destinations: Record<string, Destination> }) {
  const [days, setDays] = useState(7)
  const [pace, setPace] = useState<'slow' | 'balanced' | 'full'>('balanced')
  const [error, setError] = useState('')

  function t(key: string, vars?: Record<string, string | number>): string {
    const lookup = (d: Dict) => key.split('.').reduce((o: Dict, k: string) => (o == null ? o : o[k]), d)
    const value = lookup(dict) ?? key
    return String(value).replace(/\{(\w+)\}/g, (_m, k) => (vars && k in vars ? String(vars[k]) : `{${k}}`))
  }

  const destIds = Object.keys(destinations).sort((a, b) => ROUTE_ORDER.indexOf(a) - ROUTE_ORDER.indexOf(b))

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

  return (
    <form id="builder-form" onSubmit={onSubmit}>
      <fieldset>
        <legend>{t('builder.whereLegend')}</legend>
        <div id="destination-options">
          {destIds.map((id) => (
            <label key={id}>
              <input type="checkbox" name="destination" value={id} defaultChecked={DEFAULT_CHECKED.has(id)} />
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
      <p id="builder-error" role="alert">
        {error}
      </p>
      <button type="submit">{t('builder.submit')}</button>
      <p className="form-note">{t('builder.formNote')}</p>
    </form>
  )
}
