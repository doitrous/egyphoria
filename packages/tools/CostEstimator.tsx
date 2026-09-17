'use client'
import { useState } from 'react'
import type { CostEstimatorConfig } from './types'
import { computeCostEstimate, defaultValues } from './calc'

export function CostEstimator({ config }: { config: CostEstimatorConfig }) {
  const [values, setValues] = useState(defaultValues(config.inputs))
  const total = computeCostEstimate(config, values)

  return (
    <div>
      <h2>{config.title}</h2>
      {config.inputs.map((input) => (
        <label key={input.key}>
          {input.label}{' '}
          {input.type === 'number' && (
            <input
              type="number" min={input.min} max={input.max} value={Number(values[input.key])}
              onChange={(e) => setValues({ ...values, [input.key]: Number(e.target.value) })}
            />
          )}
          {input.type === 'select' && (
            <select value={String(values[input.key])} onChange={(e) => setValues({ ...values, [input.key]: e.target.value })}>
              {input.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          {input.type === 'toggle' && (
            <input
              type="checkbox" checked={Boolean(values[input.key])}
              onChange={(e) => setValues({ ...values, [input.key]: e.target.checked })}
            />
          )}
        </label>
      ))}
      <p>
        Estimated total: <strong>{total.toLocaleString()} {config.currency}</strong>
      </p>
    </div>
  )
}
