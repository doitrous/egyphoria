'use client'
import { useState } from 'react'
import type { TippingBudgetConfig } from './types'
import { computeTipping } from './calc'

export function TippingBudget({ config }: { config: TippingBudgetConfig }) {
  const [days, setDays] = useState(config.defaultDays)
  const [included, setIncluded] = useState(config.roles.filter((r) => r.defaultIncluded).map((r) => r.key))
  const total = computeTipping(config, days, included)

  const toggle = (key: string) =>
    setIncluded((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  return (
    <div>
      <h2>{config.title}</h2>
      <label>Days <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
      {config.roles.map((r) => (
        <label key={r.key}>
          <input type="checkbox" checked={included.includes(r.key)} onChange={() => toggle(r.key)} /> {r.label}
        </label>
      ))}
      <p>Suggested tipping budget: <strong>{total.toLocaleString()} {config.currency}</strong></p>
    </div>
  )
}
