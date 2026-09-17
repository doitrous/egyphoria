import Image from 'next/image'
import Link from 'next/link'
import { pageMetadata } from '@/lib/page-metadata'
import { t } from '@/lib/i18n'
import { listDestinations } from '@/lib/trips'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('/destinations', lang)
}

export default async function DestinationsIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const destinations = listDestinations(lang)

  return (
    <article data-reveal>
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href={`/${lang}`}>{t(lang, 'nav.home')}</Link>
          </li>
          <li aria-current="page">{t(lang, 'journeys.eyebrow')}</li>
        </ol>
      </nav>
      <h1>{t(lang, 'journeys.eyebrow')}</h1>
      <p dangerouslySetInnerHTML={{ __html: t(lang, 'journeys.intro') }} />
      <div className="destination-grid">
        {destinations.map((d) => (
          <article key={d.id}>
            <Link href={`/${lang}/destinations/${d.id}`}>
              <Image src={`/assets/${d.image}.jpg`} alt={d.name} width={640} height={420} loading="lazy" />
              <h2>{d.name}</h2>
            </Link>
          </article>
        ))}
      </div>
    </article>
  )
}
