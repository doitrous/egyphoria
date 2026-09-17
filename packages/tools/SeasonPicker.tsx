'use client'
import { useState } from 'react'
import type { SeasonPickerConfig } from './types'
import { findSeasonMonth } from './calc'

export function SeasonPicker({ config }: { config: SeasonPickerConfig }) {
  const [month, setMonth] = useState(config.months[0]?.month ?? '')
  const picked = findSeasonMonth(config, month)

  return (
    <div>
      <h2>{config.title}</h2>
      <label>
        Month{' '}
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {config.months.map((m) => <option key={m.month} value={m.month}>{m.label}</option>)}
        </select>
      </label>
      {picked && (
        <p>
          {'★'.repeat(picked.rating)}{'☆'.repeat(5 - picked.rating)} — {picked.note}
        </p>
      )}
    </div>
  )
}
