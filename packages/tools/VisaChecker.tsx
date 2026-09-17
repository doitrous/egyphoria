'use client'
import { useState } from 'react'
import type { VisaCheckerConfig } from './types'
import { findVisaRule } from './calc'

export function VisaChecker({ config }: { config: VisaCheckerConfig }) {
  const [nationality, setNationality] = useState('')
  const rule = nationality ? findVisaRule(config, nationality) : null

  return (
    <div>
      <h2>{config.title}</h2>
      <label>
        Nationality{' '}
        <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
          <option value="">Select…</option>
          {config.rules.map((r) => <option key={r.nationality} value={r.nationality}>{r.nationality}</option>)}
        </select>
      </label>
      {nationality && (
        <p>{rule ? `${rule.requirement} — ${rule.notes}` : config.defaultNotice}</p>
      )}
    </div>
  )
}
