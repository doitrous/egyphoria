'use client'
import { useState } from 'react'
import type { SessionsEstimatorConfig } from './types'
import { computeSessions } from './calc'

export function SessionsEstimator({ config }: { config: SessionsEstimatorConfig }) {
  const [selected, setSelected] = useState<string[]>([])
  const { sessions, cost } = computeSessions(config, selected)

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  return (
    <div>
      <h2>{config.title}</h2>
      {config.factors.map((f) => (
        <label key={f.key}>
          <input type="checkbox" checked={selected.includes(f.key)} onChange={() => toggle(f.key)} /> {f.label}
        </label>
      ))}
      <p>
        Estimated sessions: <strong>{sessions}</strong> — estimated cost:{' '}
        <strong>{cost.toLocaleString()} {config.currency}</strong>
      </p>
    </div>
  )
}
