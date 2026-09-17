import Image from 'next/image'
import Link from 'next/link'
import { SeoJsonLd } from '@omary98/seo-runtime-next'
import { pageMetadata } from '@/lib/page-metadata'
import { seo } from '@/lib/seo'
import { t, dictFor } from '@/lib/i18n'
import {
  listTrips, listDestinations, getRawDestinations, formatPriceLabel, formatBestMonths,
  DESTINATION_SUGGESTED_DAYS, buildTripItemList,
} from '@/lib/trips'
import { LOCAL_JOURNAL_SLUGS, getLocalArticle } from '@/lib/journal'
import { LOCAL_HELP_SLUGS, loadLocalHelpEntry } from '@/lib/help'
import { reviewRows, type Review } from '@/lib/home-content'
import DeparturesBoard from '@/components/DeparturesBoard'
import WeekStrip from '@/components/WeekStrip'
import DestinationsTable from '@/components/DestinationsTable'
import TripBuilderForm from '@/components/TripBuilderForm'
import tripCost from '@/content/tools/trip-cost.json'
import founders from '@/content/founders.json'
import reviews from '@/content/reviews.json'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('', lang)
}

function daysText(lang: string, n: number | [number, number]): string {
  if (Array.isArray(n)) return `${n[0]}–${n[1]} ${t(lang, 'journeys.days')}`
  return `${n} ${n === 1 ? t(lang, 'journeys.day') : t(lang, 'journeys.days')}`
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const dict = dictFor(lang)
  const monthAbbr: string[] = dict.home?.months ?? dictFor('en').home.months
  const yearRoundLabel = t(lang, 'home.yearRound')

  const trips = listTrips(lang)
  const destinations = listDestinations(lang)
  const destinationsForBuilder = getRawDestinations(lang)

  const path = `/${lang}`
  const resolved = await seo.resolve(path, lang)
  const canonical = resolved.canonical
  const origin = new URL(canonical).origin

  // SEO: an ItemList of the eight TouristTrip rows, in addition to the site-wide TravelAgency
  // entity [lang]/layout.tsx already adds — 14-word-count-keyword-rules.md / the ticket's own
  // SEO section. buildTripItemList lives in lib/trips.ts (not inlined here) so test/home.test.ts
  // can call the exact same function instead of re-deriving the shape (fix round 1, item #17).
  const itemList = buildTripItemList(lang, origin, t(lang, 'home.itemListName'))
  const jsonld = [...resolved.jsonld, itemList]

  const boardRows = trips.map((trip) => ({
    id: trip.id,
    name: trip.name,
    location: trip.location,
    href: `/${lang}/trips/${trip.id}`,
    daysLabel: daysText(lang, trip.days),
    price: formatPriceLabel(trip.id, t(lang, 'journeys.from')),
    bestMonths: formatBestMonths(trip.id, monthAbbr, yearRoundLabel),
  }))
  const tripNames = Object.fromEntries(trips.map((trip) => [trip.id, trip.name]))

  const destinationRows = destinations.map((d) => ({
    id: d.id,
    name: d.name,
    href: `/${lang}/destinations/${d.id}`,
    daysLabel: daysText(lang, DESTINATION_SUGGESTED_DAYS[d.id]),
    purpose: t(lang, `home.destinationPurpose.${d.id}`),
  }))

  const weekStops = [
    { dayLabel: t(lang, 'home.weekDaySingle', { n: 1 }), place: t(lang, 'home.weekStopCairo') },
    { dayLabel: t(lang, 'home.weekDaySingle', { n: 2 }), place: t(lang, 'home.weekStopGiza') },
    { dayLabel: t(lang, 'home.weekDayRange', { a: 3, b: 4 }), place: t(lang, 'home.weekStopLuxor') },
    { dayLabel: t(lang, 'home.weekDayRange', { a: 5, b: 6 }), place: t(lang, 'home.weekStopNileAswan') },
    { dayLabel: t(lang, 'home.weekDaySingle', { n: 7 }), place: t(lang, 'home.weekStopRedSeaOrCairo') },
  ]
  const weekConnections = [t(lang, 'home.weekConnectionCairoLuxor'), t(lang, 'home.weekConnectionLuxorAswan')]

  const journalPost = getLocalArticle('how-many-days-in-egypt', lang)

  const helpNotices = LOCAL_HELP_SLUGS
    .map((slug) => {
      const entry = loadLocalHelpEntry(slug, lang)
      return entry ? { key: slug, label: entry.question, href: `/help/${slug}?lang=${lang}` } : null
    })
    .filter((n): n is { key: string; label: string; href: string } => n !== null)
  const journalNotices = LOCAL_JOURNAL_SLUGS
    .map((slug) => {
      const article = getLocalArticle(slug, lang)
      return article ? { key: slug, label: article.title, href: `/${lang}/journal/${slug}` } : null
    })
    .filter((n): n is { key: string; label: string; href: string } => n !== null)
  const toolTitle = (tripCost as Record<string, { config: { title: string } }>)[lang]?.config.title
    ?? (tripCost as Record<string, { config: { title: string } }>).en.config.title
  const toolNotice = { key: 'trip-cost', label: toolTitle, href: `/tools/trip-cost?lang=${lang}` }

  const foundersData = founders as { photo: string | null; alt: string | null }
  const foundersPhoto = foundersData.photo
  const reviewList = reviewRows(reviews as Review[])

  return (
    <>
      <SeoJsonLd seo={{ ...resolved, jsonld }} />

      <div className="home-intro">
        <div className="home-intro-row">
          <div>
            <h1>{t(lang, 'home.title')}</h1>
            <p className="home-standfirst">{t(lang, 'home.standfirst')}</p>
          </div>
          <a href="#builder" className="button-primary">{t(lang, 'home.ctaPrimary')}</a>
        </div>
      </div>

      <div className="board-wrap">
        <DeparturesBoard
          caption={t(lang, 'home.boardCaption')}
          colPlace={t(lang, 'home.colPlace')}
          colDays={t(lang, 'home.colDays')}
          colFrom={t(lang, 'home.colFrom')}
          colBestMonths={t(lang, 'home.colBestMonths')}
          colGoLabel={t(lang, 'journeys.viewTrip')}
          rows={boardRows}
        />
      </div>

      {/* Fix round 1, blocker #12/#15: below the fold, so no priority/fetchPriority (lazy-load,
          next/image's default) — and alt="" since the figcaption already carries the same text,
          so a screen reader wouldn't otherwise hear it twice. */}
      <figure className="station-photo">
        <Image src="/assets/giza.jpg" alt="" width={1600} height={720} />
        <figcaption>{t(lang, 'home.stationCaption')}</figcaption>
      </figure>

      <section className="home-section" aria-labelledby="week-h2">
        <h2 id="week-h2">{t(lang, 'home.weekTitle')}</h2>
        <p className="week-para">{t(lang, 'home.weekPara1')}</p>
        <p className="week-para">{t(lang, 'home.weekPara2')}</p>
        <div style={{ marginTop: 28 }}>
          <WeekStrip
            stops={weekStops}
            connections={weekConnections}
            typicalNote={t(lang, 'home.weekTypicalNote')}
            sourceHref={journalPost ? `/${lang}/journal/how-many-days-in-egypt` : `/${lang}/journal`}
            sourceLabel={t(lang, 'home.weekSourceLinkLabel')}
          />
        </div>
      </section>

      <section className="home-section" aria-labelledby="destinations-h2">
        <h2 id="destinations-h2">{t(lang, 'home.destinationsTitle')}</h2>
        <DestinationsTable
          colPlace={t(lang, 'home.destinationsColPlace')}
          colDays={t(lang, 'home.destinationsColDays')}
          colFor={t(lang, 'home.destinationsColFor')}
          rows={destinationRows}
        />
      </section>

      <section className="home-section builder-strip" id="builder" aria-labelledby="builder-h2">
        <h2 id="builder-h2">{t(lang, 'home.builderTitle')}</h2>
        <p className="section-lead">{t(lang, 'home.builderIntro')}</p>
        <TripBuilderForm dict={dict} destinations={destinationsForBuilder} tripNames={tripNames} />
      </section>

      <section className="home-section founders-section" aria-labelledby="founders-h2">
        <h2 id="founders-h2">{t(lang, 'home.foundersTitle')}</h2>
        {foundersPhoto && (
          // founders.json's photo path is owner-supplied at deploy time, outside next/image's static asset graph.
          // alt falls back to the founders' names (behind.founders) when founders.json's own alt is unset.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foundersPhoto} alt={foundersData.alt || t(lang, 'behind.founders')} className="founders-photo" />
        )}
        <p>{t(lang, 'behind.p1')}</p>
        <p>{t(lang, 'behind.p2')}</p>
        <p className="founders-names">{t(lang, 'behind.founders')}</p>
      </section>

      {reviewList.length > 0 && (
        <section className="home-section" aria-labelledby="reviews-h2">
          <h2 id="reviews-h2">{t(lang, 'reviews.title')}</h2>
          <ul className="notices-board">
            {reviewList.map((r, i) => (
              <li key={i}>
                <span>{r.quote}</span>
                <span>{r.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="home-section" aria-labelledby="before-you-go-h2">
        <h2 id="before-you-go-h2">{t(lang, 'home.beforeYouGoTitle')}</h2>
        <ul className="notices-board">
          {helpNotices.map((n) => (
            <li key={n.key}>
              <Link href={n.href}>{n.label}</Link>
              <span>{t(lang, 'footer.help')}</span>
            </li>
          ))}
          {journalNotices.map((n) => (
            <li key={n.key}>
              <Link href={n.href}>{n.label}</Link>
              <span>{t(lang, 'nav.journal')}</span>
            </li>
          ))}
          <li key={toolNotice.key}>
            <Link href={toolNotice.href}>{t(lang, 'home.noticesToolLabel')}</Link>
            <span>{toolNotice.label}</span>
          </li>
        </ul>
      </section>
    </>
  )
}
