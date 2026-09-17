'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = any

export type TripCard = {
  id: string; name: string; description: string; image: string; kind: 'multi' | 'day'
  days: number; location: string; tag: string; price: string; href: string
}

const CARD_ALT: Record<string, string> = {
  alexandria: 'Qaitbay Citadel in Alexandria', nile: 'Sailboats on the Nile', giza: 'Pyramids of Giza at sunset',
  luxor: 'Ancient Egyptian temple columns and statues', cairo: 'Lanterns in Khan el-Khalili, Cairo',
  desert: "Chalk formations in Egypt's White Desert",
}

/** Home page trip grid with the All / Multi-day / Day filter — ported from src/client/app.js's
 * renderTrips(). All cards are server-rendered (this is a 'use client' component, but Next still
 * renders it to HTML on the server for the first response) — the filter only hides cards after
 * hydration, it never removes them from the markup a crawler sees. */
export default function TripGrid({ dict, trips }: { dict: Dict; trips: TripCard[] }) {
  const [filter, setFilter] = useState<'all' | 'multi' | 'day'>('all')
  function t(key: string, vars?: Record<string, string | number>): string {
    const lookup = (d: Dict) => key.split('.').reduce((o: Dict, k: string) => (o == null ? o : o[k]), d)
    const value = lookup(dict) ?? key
    return String(value).replace(/\{(\w+)\}/g, (_m, k) => (vars && k in vars ? String(vars[k]) : `{${k}}`))
  }
  const shown = trips.filter((tr) => filter === 'all' || tr.kind === filter)

  return (
    <div>
      <div className="trip-filters" role="group">
        {(['all', 'multi', 'day'] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? t('journeys.filterAll') : f === 'multi' ? t('journeys.filterMulti') : t('journeys.filterDay')}
          </button>
        ))}
      </div>
      <p id="journey-count">{t('journeys.count', { n: String(shown.length).padStart(2, '0') })}</p>
      <div id="trip-grid" className="trip-grid">
        {shown.map((trip) => (
          <article className="trip-card" key={trip.id}>
            <Link className="trip-image" href={trip.href} aria-label={`${t('journeys.explore')} ${trip.name}`}>
              <Image src={`/assets/${trip.image}.jpg`} alt={CARD_ALT[trip.image] ?? "Egypt's Red Sea coast"} width={640} height={420} loading="lazy" />
              {trip.price && <span className="trip-price">{trip.price}</span>}
              <span className="trip-badge">{trip.tag}</span>
            </Link>
            <p className="trip-meta">{trip.location}</p>
            <h3>
              <Link href={trip.href}>{trip.name}</Link>
            </h3>
            <p className="trip-description">{trip.description}</p>
            <div className="trip-footer">
              <span>
                {trip.days} {trip.days === 1 ? t('journeys.day') : t('journeys.days')} · {trip.kind === 'multi' ? t('journeys.multiDay') : t('journeys.dayExperience')}
              </span>
              <Link href={trip.href}>{t('journeys.viewTrip')}</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
