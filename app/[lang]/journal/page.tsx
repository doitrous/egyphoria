import Image from 'next/image'
import Link from 'next/link'
import { pageMetadata } from '@/lib/page-metadata'
import { t } from '@/lib/i18n'
import { listJournal } from '@/lib/journal'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('/journal', lang)
}

export default async function JournalIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const articles = await listJournal(lang)

  return (
    <article data-reveal>
      <p className="eyebrow">{t(lang, 'journal.eyebrow')}</p>
      <h1>{t(lang, 'journal.title')}</h1>
      <p>{t(lang, 'journal.intro')}</p>
      <div className="journal-grid">
        {articles.map((a) => (
          <article key={a.slug}>
            <Link href={`/${lang}/journal/${a.slug}`}>
              {a.image && <Image src={`/assets/${a.image}.jpg`} alt={a.title} width={640} height={420} loading="lazy" />}
              <h2>{a.title}</h2>
            </Link>
            <p>{a.description}</p>
            <Link href={`/${lang}/journal/${a.slug}`}>{t(lang, 'journal.readMore')}</Link>
          </article>
        ))}
      </div>
    </article>
  )
}
