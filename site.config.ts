/**
 * The one file a new site edits before touching any code (see site-template's README). Everything
 * here is a compile-time constant, not a hub-fed value — the hub settings snapshot (Organization
 * JSON-LD, help entries, authors, tools) layers on top of this at runtime, but the site's own
 * name/locales/contact are decided here because they must exist before any hub has ever synced.
 */
export type SiteConfig = {
  /** Shown in placeholder copy and the default <title> suffix. */
  name: string
  /** Public origin, no trailing slash. Used only for the local hreflang fallback (lib/hreflang.ts). */
  baseUrl: string
  /** First one is the fallback when a request carries no locale hint. */
  locales: string[]
  defaultLocale: string
  /** Appended to every page title unless the title already ends with it (same rule as the hub's brandSuffix). */
  brandSuffix: string
  contact: { email: string; phone: string; whatsapp?: string; addressLines: string[] }
  /**
   * Footer "Popular searches" block (10-internal-linking-menu-footer.md): 6-12 keyword-phrase
   * links to pillar/category pages, per language — the "keyword footer", on every page. Falls
   * back to `en`'s list for a locale with none of its own.
   */
  popularSearches: Record<string, { label: string; href: string }[]>
}

const path = (lang: string, rest: string) => `/${lang}${rest}`

/**
 * Destination and trip names below are duplicated (in English) from content/i18n/*.trips.json so
 * this file stays free of a runtime import into content/ — see lib/trips.ts for the single
 * source of truth used by the destinations/trips pages themselves. TODO(omar): if a destination
 * or trip name changes, update it here too, or lift this list into lib/trips.ts once eslint's
 * import graph allows a content/ -> site.config.ts dependency without a cycle.
 */
function popularSearchesFor(lang: string): { label: string; href: string }[] {
  const LABELS: Record<string, Record<string, string>> = {
    en: { cairo: 'Cairo tours', giza: 'Pyramids of Giza', luxor: 'Luxor temples', nile: 'Nile cruises', 'red-sea': 'Red Sea holidays', desert: 'White Desert safari', alexandria: 'Alexandria day trip', tool: 'Egypt trip cost' },
    nl: { cairo: 'Rondreizen Caïro', giza: 'Piramides van Gizeh', luxor: "Tempels van Luxor", nile: 'Nijlcruises', 'red-sea': 'Vakantie Rode Zee', desert: 'Safari Witte Woestijn', alexandria: 'Dagtocht Alexandrië', tool: 'Kosten Egypte-reis' },
    fr: { cairo: 'Circuits au Caire', giza: 'Pyramides de Gizeh', luxor: 'Temples de Louxor', nile: 'Croisières sur le Nil', 'red-sea': 'Séjour Mer Rouge', desert: 'Safari Désert Blanc', alexandria: "Excursion à Alexandrie", tool: "Coût d'un voyage en Égypte" },
    el: { cairo: 'Εκδρομές στο Κάιρο', giza: 'Πυραμίδες της Γκίζας', luxor: 'Ναοί του Λούξορ', nile: 'Κρουαζιέρες στον Νείλο', 'red-sea': 'Διακοπές στην Ερυθρά Θάλασσα', desert: 'Σαφάρι στην Λευκή Έρημο', alexandria: 'Ημερήσια εκδρομή στην Αλεξάνδρεια', tool: 'Κόστος ταξιδιού στην Αίγυπτο' },
    tr: { cairo: 'Kahire turları', giza: 'Giza Piramitleri', luxor: 'Luksor tapınakları', nile: 'Nil nehri turları', 'red-sea': 'Kızıldeniz tatili', desert: 'Beyaz Çöl safari', alexandria: "İskenderiye günlük turu", tool: 'Mısır gezi maliyeti' },
    es: { cairo: 'Tours por El Cairo', giza: 'Pirámides de Guiza', luxor: 'Templos de Luxor', nile: 'Cruceros por el Nilo', 'red-sea': 'Vacaciones en el Mar Rojo', desert: 'Safari por el Desierto Blanco', alexandria: 'Excursión a Alejandría', tool: 'Costo de un viaje a Egipto' },
  }
  const l = LABELS[lang] ?? LABELS.en
  return [
    { label: l.cairo, href: path(lang, '/destinations/cairo') },
    { label: l.giza, href: path(lang, '/destinations/giza') },
    { label: l.luxor, href: path(lang, '/destinations/luxor') },
    { label: l.nile, href: path(lang, '/destinations/nile') },
    { label: l['red-sea'], href: path(lang, '/destinations/red-sea') },
    { label: l.desert, href: path(lang, '/destinations/desert') },
    { label: l.alexandria, href: path(lang, '/destinations/alexandria') },
    { label: l.tool, href: `/tools/trip-cost?lang=${lang}` },
  ]
}

const LOCALES = ['en', 'nl', 'fr', 'el', 'tr', 'es']

export const SITE_CONFIG: SiteConfig = {
  name: 'Egyphoria',
  baseUrl: process.env.SITE_URL ?? 'http://localhost:3000',
  locales: LOCALES,
  defaultLocale: 'en',
  brandSuffix: ' | Egyphoria',
  contact: {
    email: 'hello@egyphoria.com', // TODO(omar): confirm the real contact email (carried over as a placeholder from the old build.mjs config)
    phone: '', // TODO(omar): the old static site never published a phone number — add one or leave blank
    whatsapp: '',
    addressLines: ['Egypt'], // TODO(omar): add a real office address for /contact and Organization schema
  },
  popularSearches: Object.fromEntries(LOCALES.map((lang) => [lang, popularSearchesFor(lang)])),
}

/** Egyphoria ships no RTL locale today; add one here the day it does. */
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur'])
export const isRtl = (locale: string): boolean => RTL_LOCALES.has(locale)
