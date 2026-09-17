'use client'

import { useState } from 'react'
import { planFromTrip, type Destination, type TripForPlan } from '@/lib/itinerary'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = any

/** Trip page's "Make this itinerary mine" and "Book this journey" buttons — ported from
 * src/client/trip.js. Booking calls the PayTabs serverless endpoint (app/api/paytabs/create);
 * on any failure it falls back to a plain message rather than a dead button, same as before. */
export default function TripActions({ lang, dict, trip, destinations }: { lang: string; dict: Dict; trip: TripForPlan; destinations: Record<string, Destination> }) {
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')

  function t(key: string): string {
    const lookup = (d: Dict) => key.split('.').reduce((o: Dict, k: string) => (o == null ? o : o[k]), d)
    return String(lookup(dict) ?? key)
  }

  function makeItMine() {
    const plan = planFromTrip(destinations, t, trip)
    window.dispatchEvent(new CustomEvent('egyphoria:start-plan', { detail: plan }))
  }

  async function book() {
    setBooking(true)
    setBookingError('')
    try {
      const res = await fetch('/api/paytabs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id, tripName: trip.name, lang }),
      })
      if (!res.ok) throw new Error('endpoint')
      const data = await res.json()
      if (data.redirect_url) {
        window.location.href = data.redirect_url
        return
      }
      throw new Error('no-url')
    } catch {
      setBooking(false)
      setBookingError(t('trip.bookingUnavailable'))
    }
  }

  return (
    <div className="trip-actions">
      <button type="button" id="make-mine" onClick={makeItMine}>
        {t('trip.makeMine')}
      </button>
      <button type="button" id="book-trip" onClick={book} disabled={booking}>
        <span className="btn-label">{booking ? t('trip.booking') : t('trip.book')}</span>
      </button>
      {bookingError && <p role="alert">{bookingError}</p>}
    </div>
  )
}
