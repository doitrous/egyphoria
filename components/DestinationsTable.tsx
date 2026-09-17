import Link from 'next/link'

export type DestinationRow = { id: string; name: string; href: string; daysLabel: string; purpose: string }

/**
 * "Destinations, by the days they deserve" (V2-PHASE-9b): the content-hub link block to all
 * seven destination pages, as a real `<table>` — place, suggested days, what it's for. The bold
 * anchor IS the destination name (no separate "view" link, no nested interactive elements).
 */
export default function DestinationsTable({
  colPlace, colDays, colFor, rows,
}: {
  colPlace: string
  colDays: string
  colFor: string
  rows: DestinationRow[]
}) {
  return (
    <table className="destinations-board">
      <thead>
        <tr>
          <th scope="col">{colPlace}</th>
          <th scope="col">{colDays}</th>
          <th scope="col">{colFor}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <Link href={row.href}>
                <strong>{row.name}</strong>
              </Link>
            </td>
            <td>{row.daysLabel}</td>
            <td>{row.purpose}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
