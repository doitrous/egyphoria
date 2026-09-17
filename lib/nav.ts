// Menu = keyword pages, named with the real search term (10-internal-linking-menu-footer.md),
// per language. "Journal" and "Help" reuse the existing i18n strings (content/i18n/<lang>.json's
// `nav.journal` / `footer.help`); the other four are new keyword labels this ticket asks for
// that never existed in the old site's i18n files, translated here.
import { t } from './i18n'
import type { MenuItem } from '@/components/SiteMenu'

const KEYWORD_LABELS: Record<string, { egyptTours: string; nileCruises: string; cairoDayTrips: string; tripCost: string }> = {
  en: { egyptTours: 'Egypt tours', nileCruises: 'Nile cruises', cairoDayTrips: 'Day trips from Cairo', tripCost: 'Egypt trip cost' },
  nl: { egyptTours: 'Egypte rondreizen', nileCruises: 'Nijlcruises', cairoDayTrips: 'Dagtochten vanuit Caïro', tripCost: 'Kosten Egypte-reis' },
  fr: { egyptTours: "Circuits en Égypte", nileCruises: 'Croisières sur le Nil', cairoDayTrips: "Excursions d'une journée depuis Le Caire", tripCost: "Coût d'un voyage en Égypte" },
  el: { egyptTours: 'Περιηγήσεις στην Αίγυπτο', nileCruises: 'Κρουαζιέρες στον Νείλο', cairoDayTrips: 'Ημερήσιες εκδρομές από το Κάιρο', tripCost: 'Κόστος ταξιδιού στην Αίγυπτο' },
  tr: { egyptTours: 'Mısır turları', nileCruises: 'Nil nehri turları', cairoDayTrips: "Kahire'den günlük turlar", tripCost: 'Mısır gezi maliyeti' },
  es: { egyptTours: 'Tours por Egipto', nileCruises: 'Cruceros por el Nilo', cairoDayTrips: 'Excursiones de un día desde El Cairo', tripCost: 'Costo de un viaje a Egipto' },
}

export function menuFor(lang: string): MenuItem[] {
  const k = KEYWORD_LABELS[lang] ?? KEYWORD_LABELS.en
  return [
    { label: k.egyptTours, href: `/${lang}` },
    { label: k.nileCruises, href: `/${lang}/destinations/nile` },
    { label: k.cairoDayTrips, href: `/${lang}/trips/cairo-day` },
    { label: k.tripCost, href: `/tools/trip-cost?lang=${lang}` },
    { label: t(lang, 'nav.journal'), href: `/${lang}/journal` },
    { label: t(lang, 'footer.help'), href: `/help?lang=${lang}` },
  ]
}

export const LOCALE_LABELS: Record<string, string> = { en: 'English', nl: 'Nederlands', fr: 'Français', el: 'Ελληνικά', tr: 'Türkçe', es: 'Español' }
