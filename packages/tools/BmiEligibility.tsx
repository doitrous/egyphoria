'use client'
import { useState } from 'react'
import type { BmiEligibilityConfig } from './types'
import { bmiRange, computeBmi } from './calc'

export function BmiEligibility({ config }: { config: BmiEligibilityConfig }) {
  const [heightCm, setHeightCm] = useState(170)
  const [weightKg, setWeightKg] = useState(70)
  const bmi = computeBmi(heightCm, weightKg)
  const range = bmi > 0 ? bmiRange(config, bmi) : null

  return (
    <div>
      <h2>{config.title}</h2>
      <label>Height (cm) <input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} /></label>
      <label>Weight (kg) <input type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} /></label>
      {range && (
        <p>
          BMI: <strong>{bmi}</strong> — {range.label} ({range.eligible ? 'eligible' : 'not eligible'})
        </p>
      )}
    </div>
  )
}
