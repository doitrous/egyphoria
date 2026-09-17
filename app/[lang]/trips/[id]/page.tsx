import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SeoJsonLd } from '@omary98/seo-runtime-next'
import { pageMetadata } from '@/lib/page-metadata'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { t, dictFor } from '@/lib/i18n'
import { TRIP_IDS, TRIP_PRICES, getTrip, getDestination, getRawDestinations, formatPrice, CURRENCY } from '@/lib/trips'
import TripActions from '@/components/TripActions'
import { hubBodyFor, hubBodySlugFor } from '@/lib/hub-body'

type Props = { params: Promise<{ lang: string; id: string }> }

// ponytail: no generateStaticParams here — [lang]/layout.tsx reads headers() for the
// resolved locale, so this route can never be prerendered anyway (DYNAMIC_SERVER_USAGE at
// build time if it tries). Rendering per-request, like every other [lang] page, is correct.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  if (!TRIP_IDS.includes(id)) return {}
  const hubBody = await hubBodyFor(lang, hubBodySlugFor('trip', id))
  return pageMetadata(`/trips/${id}`, lang, hubBody ?? undefined)
}

export default async function TripPage({ params }: Props) {
  const { lang, id } = await params
  const trip = getTrip(id, lang)
  if (!trip) notFound()

  const destination = getDestination(trip.destinationId, lang)
  const siblings = trip.siblingIds.map((sid) => getTrip(sid, lang)!).filter(Boolean).slice(0, 2)
  const path = `/${lang}/trips/${id}`
  const resolved = await seo.resolve(path, lang)
  const canonical = resolved.canonical
  const origin = new URL(canonical, SITE_CONFIG.baseUrl).origin
  // The hub's brain can write this trip's descriptive copy under a fixed slug convention (see
  // lib/hub-body.ts) — it replaces only the description/detail paragraphs below; facts
  // (highlights, price, itinerary builder, breadcrumbs, JSON-LD structure) stay as-is either way.
  const hubBody = await hubBodyFor(lang, hubBodySlugFor('trip', id))

  const touristTrip = {
    '@context': 'https://schema.org', '@type': 'TouristTrip', name: trip.name, description: trip.description,
    url: canonical, touristType: trip.kind === 'multi' ? 'Multi-day traveler' : 'Day-trip traveler',
    itinerary: trip.highlights.map((h) => ({ '@type': 'ListItem', name: h.split('|')[0] ?? h, description: h.split('|')[1] ?? h })),
    offers: {
      '@type': 'Offer', price: TRIP_PRICES[trip.id]?.amount, priceCurrency: CURRENCY,
      url: canonical, availability: 'https://schema.org/InStock',
    },
  }
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t(lang, 'nav.home'), item: `${origin}/${lang}` },
      { '@type': 'ListItem', position: 2, name: t(lang, 'journeys.title').replace(/<[^>]+>/g, ''), item: `${origin}/${lang}/trips` },
      { '@type': 'ListItem', position: 3, name: trip.name, item: canonical },
    ],
  }
  const faqPage = hubBody?.faq.length
    ? {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: hubBody.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }
    : null
  const jsonld = [...resolved.jsonld, touristTrip, breadcrumb, ...(faqPage ? [faqPage] : [])]

  return (
    <article data-reveal>
      <SeoJsonLd seo={{ ...resolved, jsonld }} />
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href={`/${lang}`}>{t(lang, 'nav.home')}</Link>
          </li>
          <li>
            <Link href={`/${lang}/trips`}>{t(lang, 'journeys.title').replace(/<[^>]+>/g, '')}</Link>
          </li>
          <li aria-current="page">{trip.name}</li>
        </ol>
      </nav>
      <p className="trip-tag">{trip.tag}</p>
      <h1>{trip.name}</h1>
      <p className="trip-meta">{trip.location}</p>
      <Image src={`/assets/${trip.image}.jpg`} alt={trip.name} width={1600} height={900} priority />

      {hubBody ? (
        <div className="hub-body" dangerouslySetInnerHTML={{ __html: hubBody.bodyHtml }} />
      ) : (
        <>
          <p>
            {trip.description}{' '}
            {destination && (
              <>
                {t(lang, 'trip.route')}: <Link href={`/${lang}/destinations/${destination.id}`}><strong>{destination.name}</strong></Link>.
              </>
            )}
          </p>
          <p>{trip.detail}</p>
        </>
      )}
      {hubBody && hubBody.faq.length > 0 && (
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

      <section>
        <h2>{t(lang, 'trip.highlights')}</h2>
        <ol>
          {trip.highlights.map((h, i) => {
            const [label, text] = h.split('|')
            return (
              <li key={i}>
                <strong>{label}</strong> — {text ?? label}
              </li>
            )
          })}
        </ol>
      </section>

      <section>
        <h2>{t(lang, 'trip.included')}</h2>
        <p>{t(lang, 'trip.disclaimer')}</p>
      </section>

      <aside>
        <p className="trip-price">
          {formatPrice(trip.id)} {CURRENCY} <span>{t(lang, 'trip.perPerson')}</span>
        </p>
        <p>{t(lang, 'trip.priceNote')}</p>
        <TripActions
          lang={lang}
          dict={dictFor(lang)}
          trip={{ id: trip.id, kind: trip.kind, places: trip.places, days: trip.days, name: trip.name, highlights: trip.highlights }}
          destinations={getRawDestinations(lang)}
        />
      </aside>

      {siblings.length > 0 && (
        <section>
          <h2>{t(lang, 'trip.related')}</h2>
          <div className="related-trips">
            {siblings.map((sibling) => (
              <article key={sibling.id}>
                <Link href={`/${lang}/trips/${sibling.id}`}>
                  <Image src={`/assets/${sibling.image}.jpg`} alt={sibling.name} width={640} height={420} loading="lazy" />
                  <h3>{sibling.name}</h3>
                </Link>
                <p>{sibling.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
