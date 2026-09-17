// V2-PHASE-9b: a plain-data assembly of every text string the home page (app/[lang]/page.tsx)
// renders inside <main>, used only by test/home.test.ts's word-count check. Node's plain
// `--experimental-strip-types` runner (npm test) can't load .tsx/JSX (see lib/page-metadata.ts's
// own comment on this — the same constraint applies here), so this mirrors the page's t()/data
// calls in plain TypeScript rather than rendering the real component. Keep the key list here in
// sync with app/[lang]/page.tsx if either changes.
import { t, dictFor } from './i18n.ts'
import {
  listTrips, listDestinations, formatPriceLabel, formatBestMonths, DESTINATION_SUGGESTED_DAYS,
} from './trips.ts'
import { LOCAL_JOURNAL_SLUGS, getLocalArticle } from './journal.ts'
import { LOCAL_HELP_SLUGS, loadLocalHelpEntry } from './help.ts'
import tripCost from '../content/tools/trip-cost.json' with { type: 'json' }

const STATIC_KEYS = [
  'home.title', 'home.standfirst', 'home.ctaPrimary', 'home.boardCaption',
  'home.colPlace', 'home.colDays', 'home.colFrom', 'home.colBestMonths', 'journeys.viewTrip',
  'home.stationCaption', 'home.weekTitle', 'home.weekPara1', 'home.weekPara2', 'home.weekTypicalNote',
  'home.weekSourceLinkLabel', 'home.destinationsTitle', 'home.destinationsColPlace',
  'home.destinationsColDays', 'home.destinationsColFor', 'home.builderTitle', 'home.builderIntro',
  'home.foundersTitle', 'behind.p1', 'behind.p2', 'behind.founders', 'home.beforeYouGoTitle',
  'home.noticesToolLabel', 'builder.whereLegend', 'builder.daysLabel', 'builder.paceLabel',
  'builder.paceSlow', 'builder.paceBalanced', 'builder.paceFull', 'builder.interestsLegend',
  'builder.interestHistory', 'builder.interestCulture', 'builder.interestNature', 'builder.interestRelax',
  'builder.submit', 'builder.formNote',
]

function words(s: string): number {
  const stripped = String(s ?? '').replace(/<[^>]+>/g, ' ')
  return stripped.split(/\s+/).filter(Boolean).length
}

/** Every text string rendered inside <main> for this locale, in the same shape as the real
 * page's t()/data calls — used only to sum a word count for the ≥500-word SEO floor. */
export function homeMainStrings(lang: string): string[] {
  const strings: string[] = STATIC_KEYS.map((k) => t(lang, k))

  const trips = listTrips(lang)
  for (const trip of trips) {
    strings.push(trip.name)
    strings.push(`${trip.days} ${trip.days === 1 ? t(lang, 'journeys.day') : t(lang, 'journeys.days')}`)
    strings.push(formatPriceLabel(trip.id, t(lang, 'journeys.from')))
    const monthAbbr: string[] = dictFor(lang).home?.months ?? dictFor('en').home.months
    strings.push(formatBestMonths(trip.id, monthAbbr, t(lang, 'home.yearRound')))
  }

  const destinations = listDestinations(lang)
  for (const d of destinations) {
    strings.push(d.name)
    const n = DESTINATION_SUGGESTED_DAYS[d.id]
    strings.push(Array.isArray(n) ? `${n[0]}–${n[1]} ${t(lang, 'journeys.days')}` : `${n} ${t(lang, 'journeys.days')}`)
    strings.push(t(lang, `home.destinationPurpose.${d.id}`))
  }

  for (let day = 1; day <= 2; day++) strings.push(t(lang, 'home.weekDaySingle', { n: day }))
  strings.push(t(lang, 'home.weekDayRange', { a: 3, b: 4 }))
  strings.push(t(lang, 'home.weekDayRange', { a: 5, b: 6 }))
  strings.push(t(lang, 'home.weekDaySingle', { n: 7 }))
  strings.push(t(lang, 'home.weekStopCairo'), t(lang, 'home.weekStopGiza'), t(lang, 'home.weekStopLuxor'))
  strings.push(t(lang, 'home.weekStopNileAswan'), t(lang, 'home.weekStopRedSeaOrCairo'))
  strings.push(t(lang, 'home.weekConnectionCairoLuxor'), t(lang, 'home.weekConnectionLuxorAswan'))

  for (const slug of LOCAL_HELP_SLUGS) {
    const entry = loadLocalHelpEntry(slug, lang)
    if (entry) strings.push(entry.question)
  }
  for (const slug of LOCAL_JOURNAL_SLUGS) {
    const article = getLocalArticle(slug, lang)
    if (article) strings.push(article.title)
  }
  const files = tripCost as Record<string, { config: { title: string } }>
  strings.push(files[lang]?.config.title ?? files.en.config.title)

  return strings
}

export function homeWordCount(lang: string): number {
  return homeMainStrings(lang).reduce((sum, s) => sum + words(s), 0)
}
