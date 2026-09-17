import Link from 'next/link'

export type BoardRow = {
  id: string
  name: string
  href: string
  daysLabel: string
  price: string
  bestMonths: string
}

/**
 * The Continental Timetable's departures board (V2-PHASE-9b): a real `<table>`, eight rows from
 * `lib/trips.ts`, one link per row (the trip name) stretched with CSS to cover the whole row —
 * no nested interactive elements, but the whole row is clickable and keyboard-focusable through
 * that single anchor. This is the page's one authored motion moment: rows settle in from the
 * top on first paint (see `.board tbody tr` in app/globals.css) — an exponential ease-out,
 * 40ms-staggered via the inline `--i` custom property, switched off entirely under
 * `prefers-reduced-motion: reduce`.
 */
export default function DeparturesBoard({
  caption, colPlace, colDays, colFrom, colBestMonths, colGoLabel, rows,
}: {
  caption: string
  colPlace: string
  colDays: string
  colFrom: string
  colBestMonths: string
  colGoLabel: string
  rows: BoardRow[]
}) {
  return (
    <table className="board">
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{colPlace}</th>
          <th scope="col">{colDays}</th>
          <th scope="col">{colFrom}</th>
          <th scope="col">{colBestMonths}</th>
          <th scope="col">
            <span className="visually-hidden">{colGoLabel}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id} style={{ '--i': i } as React.CSSProperties}>
            <td>
              <Link href={row.href} className="board-row-link">
                {row.name}
              </Link>
            </td>
            <td>{row.daysLabel}</td>
            <td>{row.price}</td>
            <td>{row.bestMonths}</td>
            <td aria-hidden="true" className="board-arrow">
              →
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
