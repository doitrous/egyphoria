// Trip and destination data — ported from the old static build's src/trips.mjs (structure,
// English copy) and src/i18n/<lang>.trips.json (translated copy for nl/fr/el/tr/es), which this
// module loads directly rather than re-typing. See content/i18n/<lang>.trips.json.
//
// The ticket asks for "the seven destinations in src/trips.mjs: cairo, giza, luxor, alexandria,
// nile, desert, red-sea" — the old site's actual `destinations` object only has six keys (cairo,
// luxor, aswan, redsea, desert, alexandria; no "giza" or "nile"). DECISION (not spelled out by
// the ticket, made here): split "cairo" into a "cairo" city destination and a "giza" plateau
// destination by re-slicing cairo's own activity list (Giza-plateau-specific entries — the
// pyramids, the Grand Egyptian Museum, Saqqara — move to "giza"; the rest stay under "cairo"),
// and rename "aswan" to "nile" (the Nile-valley destination between Luxor and Aswan) with no
// change to its content. This reuses only real, already-published copy — no invented facts —
// and the index-based split is verified positionally identical across all six locale files by
// test/trips.test.ts.
import en from '../content/i18n/en.trips.json' with { type: 'json' }
import nl from '../content/i18n/nl.trips.json' with { type: 'json' }
import fr from '../content/i18n/fr.trips.json' with { type: 'json' }
import el from '../content/i18n/el.trips.json' with { type: 'json' }
import tr from '../content/i18n/tr.trips.json' with { type: 'json' }
import es from '../content/i18n/es.trips.json' with { type: 'json' }

export type Activity = [string, string]
export type RawDestination = { name: string; activities: Activity[] }
export type RawTrip = {
  name: string; tag: string; description: string; detail: string; location: string; highlights: string[]
}
type TripsFile = { destinations: Record<string, RawDestination>; trips: Record<string, RawTrip> }

// JSON imports' inferred literal types (activities as fixed-length string[][] etc.) are narrower
// than TripsFile's shape but structurally close enough that TS wants an `unknown` waypoint before
// widening — the real content is untyped JSON, so this cast is just accepting that.
const FILES: Record<string, TripsFile> = { en, nl, fr, el, tr, es } as unknown as Record<string, TripsFile>

/** Language-independent trip metadata (id, days, kind, image, base destination). `places` is
 * the ORIGINAL (pre-split) destination-key route ported verbatim from src/trips.mjs — the
 * itinerary builder (lib/itinerary.ts) plans against the raw six destinations (getRawDestinations
 * below), independently of the 7-id destination *pages* the ticket asks for above. Splitting
 * "cairo" into "cairo"/"giza" for SEO has no reason to also fragment the trip planner's own
 * activity pool. */
export const TRIP_META: Record<
  string,
  { kind: 'multi' | 'day'; days: number; image: string; destinationId: string; siblingIds: string[]; places: string[] }
> = {
  'egypt-unfolded': { kind: 'multi', days: 7, image: 'giza', destinationId: 'cairo', siblingIds: ['nile', 'giza-day'], places: ['cairo', 'luxor', 'aswan'] },
  nile: { kind: 'multi', days: 5, image: 'nile', destinationId: 'nile', siblingIds: ['egypt-unfolded', 'luxor-day'], places: ['luxor', 'aswan'] },
  desert: { kind: 'multi', days: 3, image: 'desert', destinationId: 'desert', siblingIds: ['red-sea', 'egypt-unfolded'], places: ['desert'] },
  'red-sea': { kind: 'multi', days: 5, image: 'red-sea', destinationId: 'red-sea', siblingIds: ['desert', 'alex-day'], places: ['redsea'] },
  'giza-day': { kind: 'day', days: 1, image: 'giza', destinationId: 'giza', siblingIds: ['cairo-day', 'egypt-unfolded'], places: ['cairo'] },
  'cairo-day': { kind: 'day', days: 1, image: 'cairo', destinationId: 'cairo', siblingIds: ['giza-day', 'egypt-unfolded'], places: ['cairo'] },
  'luxor-day': { kind: 'day', days: 1, image: 'luxor', destinationId: 'luxor', siblingIds: ['nile', 'egypt-unfolded'], places: ['luxor'] },
  'alex-day': { kind: 'day', days: 1, image: 'alexandria', destinationId: 'alexandria', siblingIds: ['cairo-day', 'giza-day'], places: ['alexandria'] },
}

export const TRIP_IDS = Object.keys(TRIP_META)

/** Per-trip pricing (per person), USD — ported verbatim from the old src/config.mjs. Placeholders. */
export const TRIP_PRICES: Record<string, { amount: number; from: boolean }> = {
  'egypt-unfolded': { amount: 1450, from: true },
  nile: { amount: 980, from: true },
  desert: { amount: 640, from: true },
  'red-sea': { amount: 890, from: true },
  'giza-day': { amount: 120, from: false },
  'cairo-day': { amount: 95, from: false },
  'luxor-day': { amount: 180, from: false },
  'alex-day': { amount: 140, from: false },
}
export const CURRENCY = 'USD'
export function formatPrice(id: string): string {
  const p = TRIP_PRICES[id]
  if (!p) return ''
  return `${p.from ? 'from ' : ''}$${p.amount.toLocaleString('en-US')}`
}

/** Localized name overrides for the two destinations that have no direct old-site equivalent
 * (giza, nile) plus a narrower "Cairo" name once Giza's own content is split out of it. Real
 * place names only — no invented claims. */
const NAME_OVERRIDES: Record<string, Record<string, string>> = {
  cairo: { en: 'Cairo', nl: 'Caïro', fr: 'Le Caire', el: 'Κάιρο', tr: 'Kahire', es: 'El Cairo' },
  giza: { en: 'Giza', nl: 'Gizeh', fr: 'Gizeh', el: 'Γκίζα', tr: 'Giza', es: 'Guiza' },
  nile: {
    en: 'The Nile (Luxor & Aswan)', nl: 'De Nijl (Luxor en Aswan)', fr: 'Le Nil (Louxor et Assouan)',
    el: 'Ο Νείλος (Λούξορ και Ασουάν)', tr: 'Nil (Luksor ve Asvan)', es: 'El Nilo (Luxor y Asuán)',
  },
}

/** destination id -> { raw source destination key in *.trips.json, activity indices to keep }.
 * No `indices` means "keep every activity from the source destination". */
const DESTINATION_SOURCES: Record<string, { from: string; indices?: number[]; image: string }> = {
  cairo: { from: 'cairo', indices: [2, 3, 5, 6, 7], image: 'cairo' },
  giza: { from: 'cairo', indices: [0, 1, 4], image: 'giza' },
  luxor: { from: 'luxor', image: 'luxor' },
  alexandria: { from: 'alexandria', image: 'alexandria' },
  nile: { from: 'aswan', image: 'nile' },
  desert: { from: 'desert', image: 'desert' },
  'red-sea': { from: 'redsea', image: 'red-sea' },
}

export const DESTINATION_IDS = Object.keys(DESTINATION_SOURCES)

/** destination id -> trip ids that belong to it (07-content-hub.md: "member -> pillar", here
 * inverted so the destination/category page can list every trip touching it). */
export const DESTINATION_TRIPS: Record<string, string[]> = {
  cairo: ['egypt-unfolded', 'cairo-day'],
  giza: ['giza-day'],
  luxor: ['egypt-unfolded', 'luxor-day'],
  alexandria: ['alex-day'],
  nile: ['egypt-unfolded', 'nile'],
  desert: ['desert'],
  'red-sea': ['red-sea'],
}

function fileFor(lang: string): TripsFile {
  return FILES[lang] ?? FILES.en
}

export function getDestination(id: string, lang: string): { id: string; name: string; image: string; activities: Activity[] } | null {
  const source = DESTINATION_SOURCES[id]
  if (!source) return null
  const file = fileFor(lang)
  const raw = file.destinations[source.from]
  if (!raw) return null
  const activities = source.indices ? source.indices.map((i) => raw.activities[i]).filter(Boolean) : raw.activities
  const name = NAME_OVERRIDES[id]?.[lang] ?? NAME_OVERRIDES[id]?.en ?? raw.name
  return { id, name, image: source.image, activities }
}

export function listDestinations(lang: string) {
  return DESTINATION_IDS.map((id) => getDestination(id, lang)!).filter(Boolean)
}

export function getTrip(id: string, lang: string) {
  const meta = TRIP_META[id]
  if (!meta) return null
  const raw = fileFor(lang).trips[id]
  if (!raw) return null
  return { id, ...meta, ...raw, price: formatPrice(id) }
}

export function listTrips(lang: string) {
  return TRIP_IDS.map((id) => getTrip(id, lang)!).filter(Boolean)
}

/** English-name lookup for `alt` text and other non-localized internal uses (image credits, etc). */
export function destinationNameEn(id: string): string {
  return getDestination(id, 'en')?.name ?? id
}

/** The original, unsplit six destinations (cairo/luxor/aswan/redsea/desert/alexandria), keyed
 * exactly as trip.places references them — for the itinerary builder only. See the TRIP_META
 * comment above for why this is a separate list from the 7-id destination pages. */
export function getRawDestinations(lang: string): Record<string, RawDestination> {
  return fileFor(lang).destinations
}
