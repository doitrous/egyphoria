import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SeoJsonLd } from '@omary98/seo-runtime-next'
import { pageMetadata } from '@/lib/page-metadata'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { DESTINATION_IDS, DESTINATION_TRIPS, getDestination, getTrip, formatPrice } from '@/lib/trips'
import { hubBodyFor, hubBodySlugFor } from '@/lib/hub-body'

type Props = { params: Promise<{ lang: string; id: string }> }

// ponytail: no generateStaticParams here — [lang]/layout.tsx reads headers() for the
// resolved locale, so this route can never be prerendered anyway (DYNAMIC_SERVER_USAGE at
// build time if it tries). Rendering per-request, like every other [lang] page, is correct.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  if (!DESTINATION_IDS.includes(id)) return {}
  const hubBody = await hubBodyFor(lang, hubBodySlugFor('destination', id))
  return pageMetadata(`/destinations/${id}`, lang, hubBody ?? undefined)
}

export default async function DestinationPage({ params }: Props) {
  const { lang, id } = await params
  const destination = getDestination(id, lang)
  if (!destination) notFound()

  const path = `/${lang}/destinations/${id}`
  const resolved = await seo.resolve(path, lang)
  const canonical = resolved.canonical
  const tripIds = DESTINATION_TRIPS[id] ?? []
  const trips = tripIds.map((tripId) => getTrip(tripId, lang)!).filter(Boolean)
  // The hub's brain can write this page's descriptive copy under a fixed slug convention (see
  // lib/hub-body.ts) — everything else here (facts, trip list, breadcrumbs, JSON-LD structure)
  // stays exactly as it renders today when the hub hasn't written this one yet.
  const hubBody = await hubBodyFor(lang, hubBodySlugFor('destination', id))

  const collectionPage = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: destination.name, url: canonical,
    hasPart: trips.map((trip) => ({ '@type': 'TouristTrip', name: trip.name, url: `${new URL(canonical, SITE_CONFIG.baseUrl).origin}/${lang}/trips/${trip.id}` })),
  }
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t(lang, 'nav.home'), item: `${new URL(canonical, SITE_CONFIG.baseUrl).origin}/${lang}` },
      { '@type': 'ListItem', position: 2, name: t(lang, 'journeys.eyebrow'), item: `${new URL(canonical, SITE_CONFIG.baseUrl).origin}/${lang}/destinations` },
      { '@type': 'ListItem', position: 3, name: destination.name, item: canonical },
    ],
  }
  const faqPage = hubBody?.faq.length
    ? {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: hubBody.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }
    : null
  const jsonld = [...resolved.jsonld, collectionPage, breadcrumb, ...(faqPage ? [faqPage] : [])]

  return (
    <article data-reveal>
      <SeoJsonLd seo={{ ...resolved, jsonld }} />
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href={`/${lang}`}>{t(lang, 'nav.home')}</Link>
          </li>
          <li>
            <Link href={`/${lang}/destinations`}>{t(lang, 'journeys.eyebrow')}</Link>
          </li>
          <li aria-current="page">{destination.name}</li>
        </ol>
      </nav>
      <h1>{destination.name}</h1>
      <Image src={`/assets/${destination.image}.jpg`} alt={`${destination.name}, Egypt`} width={1600} height={900} priority />
      {hubBody && (
        <>
          <div className="hub-body" dangerouslySetInnerHTML={{ __html: hubBody.bodyHtml }} />
          {hubBody.faq.length > 0 && (
            <section>
              <h2>{t(lang, 'tools.faq')}</h2>
              {hubBody.faq.map((f, i) => (
                <div key={i}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </section>
          )}
        </>
      )}
      <section>
        <h2>{t(lang, 'way.eyebrow')}</h2>
        <ul>
          {destination.activities.map(([, text], i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>{t(lang, 'journeys.eyebrow')}</h2>
        <div className="destination-trip-list">
          {trips.map((trip) => (
            <article key={trip.id}>
              <h3>
                <Link href={`/${lang}/trips/${trip.id}`}>{trip.name}</Link>
              </h3>
              <p>{trip.description}</p>
              <p>
                {trip.days} {trip.days === 1 ? t(lang, 'journeys.day') : t(lang, 'journeys.days')} · {formatPrice(trip.id)}
              </p>
              <Link href={`/${lang}/trips/${trip.id}`}>{t(lang, 'journeys.viewTrip')}</Link>
            </article>
          ))}
        </div>
      </section>
    </article>
  )
}
