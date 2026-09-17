import Link from 'next/link'
import { pageMetadata } from '@/lib/page-metadata'
import { t } from '@/lib/i18n'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return { ...(await pageMetadata('/booking/complete', lang)), robots: { index: false, follow: true } }
}

export default async function BookingCompletePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ tranRef?: string }> }) {
  const { lang } = await params
  const { tranRef } = await searchParams
  return (
    <article data-reveal>
      <h1>{t(lang, 'booking.title')}</h1>
      <p>{t(lang, 'booking.intro')}</p>
      {tranRef && (
        <p>
          {t(lang, 'booking.ref')}: {tranRef}
        </p>
      )}
      <p>{t(lang, 'booking.questions')}</p>
      <Link href={`/${lang}`}>{t(lang, 'booking.home')}</Link>
    </article>
  )
}
