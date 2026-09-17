import Link from 'next/link'

export type BoardRow = {
  id: string
  name: string
  location: string
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
 *
 * Fix round 1, blocker #1: the PLACE column must lead with the actual place, not the poetic
 * trip title — `row.location` (e.g. "CAIRO · LUXOR · ASWAN") is now the first cell's primary
 * line, with `row.name` as a secondary line underneath; the link's accessible text carries
 * both. The ItemList JSON-LD `name` stays the trip name (lib/trips.ts's buildTripItemList).
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
                <span className="board-row-place">{row.location}</span>
                <span className="board-row-title">{row.name}</span>
              </Link>
            </td>
            <td>{row.daysLabel}</td>
            <td>{row.price}</td>
            <td>{row.bestMonths}</td>
            <td aria-hidden="true" className="board-arrow">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <line x1="1" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="2" />
                <path d="M9 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
