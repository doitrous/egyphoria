// Menu = keyword pages, named with the real search term (10-internal-linking-menu-footer.md),
// per language. "Journal", "Help" and "Contact" reuse existing i18n strings
// (content/i18n/<lang>.json's `nav.journal` / `footer.help` / `behind.cta`, the last already
// used as the /contact link's anchor text in [lang]/layout.tsx's footer); the other three are
// new keyword labels this ticket asks for that never existed in the old site's i18n files,
// translated here. V2-PHASE-9b fixes the menu to exactly the six items the homepage ticket
// specifies: Egypt tours, Destinations, Trip cost, Journal, Help, Contact.
import { t } from './i18n'
import type { MenuItem } from '@/components/SiteMenu'

const KEYWORD_LABELS: Record<string, { egyptTours: string; destinations: string; tripCost: string; contact: string }> = {
  en: { egyptTours: 'Egypt tours', destinations: 'Destinations', tripCost: 'Trip cost', contact: 'Contact' },
  nl: { egyptTours: 'Egypte rondreizen', destinations: 'Bestemmingen', tripCost: 'Reiskosten', contact: 'Contact' },
  fr: { egyptTours: "Circuits en Égypte", destinations: 'Destinations', tripCost: 'Coût du voyage', contact: 'Contact' },
  el: { egyptTours: 'Περιηγήσεις στην Αίγυπτο', destinations: 'Προορισμοί', tripCost: 'Κόστος ταξιδιού', contact: 'Επικοινωνία' },
  tr: { egyptTours: 'Mısır turları', destinations: 'Destinasyonlar', tripCost: 'Gezi maliyeti', contact: 'İletişim' },
  es: { egyptTours: 'Tours por Egipto', destinations: 'Destinos', tripCost: 'Costo del viaje', contact: 'Contacto' },
}

export function menuFor(lang: string): MenuItem[] {
  const k = KEYWORD_LABELS[lang] ?? KEYWORD_LABELS.en
  return [
    { label: k.egyptTours, href: `/${lang}/trips` },
    { label: k.destinations, href: `/${lang}/destinations` },
    { label: k.tripCost, href: `/tools/trip-cost?lang=${lang}` },
    { label: t(lang, 'nav.journal'), href: `/${lang}/journal` },
    { label: t(lang, 'footer.help'), href: `/help?lang=${lang}` },
    { label: k.contact, href: `/${lang}/contact` },
  ]
}

export const LOCALE_LABELS: Record<string, string> = { en: 'English', nl: 'Nederlands', fr: 'Français', el: 'Ελληνικά', tr: 'Türkçe', es: 'Español' }
