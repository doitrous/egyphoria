import Link from 'next/link'

export type WeekStop = { dayLabel: string; place: string }

/**
 * "How a week in Egypt lays out" (V2-PHASE-9b): a seven-day timetable strip — stations across
 * the top, connection cells between them — plus the two anxiety-answering paragraphs the ticket
 * asks for (heat months, distances, what's included). Not a `<table>`: these are typical
 * stops on a route, not eight priced, bookable trips (that's the departures board above), so a
 * plain ordered list of "stations" reads correctly to a screen reader without implying tabular
 * data it doesn't have.
 */
export default function WeekStrip({
  stops, connections, typicalNote, sourceHref, sourceLabel,
}: {
  stops: WeekStop[]
  connections: string[]
  typicalNote: string
  sourceHref: string
  sourceLabel: string
}) {
  return (
    <div className="week-strip">
      <ol className="week-stations">
        {stops.map((stop, i) => (
          <li key={i}>
            <span className="week-day">{stop.dayLabel}</span>
            <span className="week-place">{stop.place}</span>
          </li>
        ))}
      </ol>
      <ul className="week-connections">
        {connections.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <p className="week-note">
        {typicalNote} <Link href={sourceHref}>{sourceLabel}</Link>.
      </p>
    </div>
  )
}
