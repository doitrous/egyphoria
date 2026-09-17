import type { ComparisonTableConfig } from './types'

/** No interactivity needed, so this stays a plain (server-renderable) component. */
export function ComparisonTable({ config }: { config: ComparisonTableConfig }) {
  return (
    <div>
      <h2>{config.title}</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            {config.columns.map((c) => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {config.rows.map((row) => {
            const nums = config.columns.map((c) => Number(row.values[c.key]))
            const min = config.highlightMin ? Math.min(...nums.filter((n) => !Number.isNaN(n))) : null
            return (
              <tr key={row.label}>
                <th>{row.label}</th>
                {config.columns.map((c) => {
                  const v = row.values[c.key]
                  const isMin = min !== null && Number(v) === min
                  return <td key={c.key}>{isMin ? <strong>{v}</strong> : v}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
