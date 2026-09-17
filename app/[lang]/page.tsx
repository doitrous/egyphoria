import Image from 'next/image'
import Link from 'next/link'
import { pageMetadata } from '@/lib/page-metadata'
import { t, dictFor } from '@/lib/i18n'
import { listTrips, getRawDestinations, formatPrice } from '@/lib/trips'
import TripGrid from '@/components/TripGrid'
import TripBuilderForm from '@/components/TripBuilderForm'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('', lang)
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const dict = dictFor(lang)
  const trips = listTrips(lang).map((trip) => ({
    id: trip.id, name: trip.name, description: trip.description, image: trip.image, kind: trip.kind,
    days: trip.days, location: trip.location, tag: trip.tag, price: formatPrice(trip.id), href: `/${lang}/trips/${trip.id}`,
  }))
  const destinationsForBuilder = getRawDestinations(lang)

  return (
    <>
      <section className="hero" data-reveal>
        <p className="hero-eyebrow">{t(lang, 'hero.eyebrow')}</p>
        <h1>
          {t(lang, 'hero.line1')} {t(lang, 'hero.line2')} {t(lang, 'hero.line3')}
        </h1>
        <p dangerouslySetInnerHTML={{ __html: t(lang, 'hero.description') }} />
        <div className="hero-ctas">
          <a href="#journeys">{t(lang, 'hero.ctaPrimary')}</a>
          <a href="#builder">{t(lang, 'hero.ctaSecondary')}</a>
        </div>
        <Image src="/assets/giza.jpg" alt={t(lang, 'hero.location')} width={1600} height={1000} priority fetchPriority="high" />
      </section>

      <section className="promise" data-reveal>
        <p>{t(lang, 'promise.intro')}</p>
        <ul>
          <li>{t(lang, 'promise.a')}</li>
          <li>{t(lang, 'promise.b')}</li>
          <li>{t(lang, 'promise.c')}</li>
          <li>{t(lang, 'promise.d')}</li>
        </ul>
      </section>

      <section id="journeys" data-reveal>
        <p className="eyebrow">{t(lang, 'journeys.eyebrow')}</p>
        <h2 dangerouslySetInnerHTML={{ __html: t(lang, 'journeys.title') }} />
        <p dangerouslySetInnerHTML={{ __html: t(lang, 'journeys.intro') }} />
        <TripGrid dict={dict} trips={trips} />
        <p className="journeys-note">{t(lang, 'journeys.note')}</p>
      </section>

      <section className="way" data-reveal>
        <p className="eyebrow">{t(lang, 'way.eyebrow')}</p>
        <h2 dangerouslySetInnerHTML={{ __html: t(lang, 'way.title') }} />
        <p>{t(lang, 'way.p1')}</p>
        <p>{t(lang, 'way.p2')}</p>
        <div>
          <h3>{t(lang, 'way.point1Title')}</h3>
          <p>{t(lang, 'way.point1Text')}</p>
        </div>
        <div>
          <h3>{t(lang, 'way.point2Title')}</h3>
          <p>{t(lang, 'way.point2Text')}</p>
        </div>
        <a href="#builder">{t(lang, 'way.cta')}</a>
      </section>

      <section className="behind" data-reveal>
        <p className="eyebrow">{t(lang, 'behind.eyebrow')}</p>
        <h2 dangerouslySetInnerHTML={{ __html: t(lang, 'behind.title') }} />
        <p>{t(lang, 'behind.p1')}</p>
        <p>{t(lang, 'behind.p2')}</p>
        <p className="founders-label">{t(lang, 'behind.foundersLabel')}</p>
        <p>{t(lang, 'behind.founders')}</p>
        <Link href={`/${lang}/about`}>{t(lang, 'behind.cta')}</Link>
      </section>

      <section id="builder" data-reveal>
        <p className="eyebrow">{t(lang, 'builder.eyebrow')}</p>
        <h2 dangerouslySetInnerHTML={{ __html: t(lang, 'builder.title') }} />
        <p dangerouslySetInnerHTML={{ __html: t(lang, 'builder.intro') }} />
        <TripBuilderForm dict={dict} destinations={destinationsForBuilder} />
      </section>

      <section className="closing" data-reveal>
        <p className="eyebrow">{t(lang, 'closing.eyebrow')}</p>
        <h2 dangerouslySetInnerHTML={{ __html: t(lang, 'closing.title') }} />
        <a href="#builder">{t(lang, 'closing.cta')}</a>
      </section>
    </>
  )
}
