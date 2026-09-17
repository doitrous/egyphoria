import { pageMetadata } from '@/lib/page-metadata'
import { t, dictFor } from '@/lib/i18n'
import { listTrips, formatPrice } from '@/lib/trips'
import TripGrid from '@/components/TripGrid'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('/trips', lang)
}

export default async function TripsIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const trips = listTrips(lang).map((trip) => ({
    id: trip.id, name: trip.name, description: trip.description, image: trip.image, kind: trip.kind,
    days: trip.days, location: trip.location, tag: trip.tag, price: formatPrice(trip.id), href: `/${lang}/trips/${trip.id}`,
  }))

  return (
    <article data-reveal>
      <h1 dangerouslySetInnerHTML={{ __html: t(lang, 'journeys.title') }} />
      <p dangerouslySetInnerHTML={{ __html: t(lang, 'journeys.intro') }} />
      <TripGrid dict={dictFor(lang)} trips={trips} />
    </article>
  )
}
