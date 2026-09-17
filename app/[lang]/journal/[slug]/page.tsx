import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SeoJsonLd } from '@omary98/seo-runtime-next'
import { pageMetadata } from '@/lib/page-metadata'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { getArticle } from '@/lib/journal'

type Props = { params: Promise<{ lang: string; slug: string }> }

async function load(lang: string, slug: string) {
  const loaded = await getArticle(slug, lang)
  if (!loaded) return null
  const path = `/${lang}/journal/${slug}`
  const resolved = await seo.resolve(path, lang)
  const origin = new URL(resolved.canonical, SITE_CONFIG.baseUrl).origin

  const title = loaded.kind === 'hub' ? loaded.article.title : loaded.article.title
  const description = loaded.kind === 'hub' ? loaded.article.metaDescription : loaded.article.description
  const bodyHtml = loaded.kind === 'hub' ? loaded.article.bodyHtml : loaded.article.bodyHtml
  const date = loaded.kind === 'hub' ? loaded.article.publishedAt : loaded.article.date
  const image = loaded.kind === 'hub' ? loaded.article.imageUrl : `/assets/${loaded.article.image}.jpg`
  const faq = loaded.kind === 'hub' ? loaded.article.faq : []

  const articleJsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description,
    datePublished: date, dateModified: loaded.kind === 'hub' ? loaded.article.updatedAt : date,
    url: resolved.canonical, mainEntityOfPage: resolved.canonical,
  }
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t(lang, 'nav.home'), item: `${origin}/${lang}` },
      { '@type': 'ListItem', position: 2, name: t(lang, 'journal.title').replace(/<[^>]+>/g, ''), item: `${origin}/${lang}/journal` },
      { '@type': 'ListItem', position: 3, name: title, item: resolved.canonical },
    ],
  }
  const faqJsonLd = faq?.length
    ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
    : null
  const jsonld = [...resolved.jsonld, articleJsonLd, breadcrumb, ...(faqJsonLd ? [faqJsonLd] : [])]

  return { title, description, bodyHtml, date, image, faq: faq ?? [], resolved: { ...resolved, jsonld } }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params
  const loaded = await load(lang, slug)
  if (!loaded) return {}
  return pageMetadata(`/journal/${slug}`, lang)
}

export default async function JournalArticlePage({ params }: Props) {
  const { lang, slug } = await params
  const loaded = await load(lang, slug)
  if (!loaded) notFound()

  return (
    <article data-reveal>
      <SeoJsonLd seo={loaded.resolved} />
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href={`/${lang}`}>{t(lang, 'nav.home')}</Link>
          </li>
          <li>
            <Link href={`/${lang}/journal`}>{t(lang, 'journal.title').replace(/<[^>]+>/g, '')}</Link>
          </li>
          <li aria-current="page">{loaded.title}</li>
        </ol>
      </nav>
      <h1>{loaded.title}</h1>
      <p className="journal-meta">
        {t(lang, 'journal.published')} {new Date(loaded.date).toLocaleDateString(lang)}
      </p>
      {loaded.image && <Image src={loaded.image} alt={loaded.title} width={1600} height={900} priority />}
      <div className="journal-body" dangerouslySetInnerHTML={{ __html: loaded.bodyHtml }} />
      {loaded.faq.length > 0 && (
        <section>
          <h2>{t(lang, 'tools.faq')}</h2>
          {loaded.faq.map((f, i) => (
            <div key={i}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
      )}
      <section className="journal-cta">
        <p>{t(lang, 'journal.cta')}</p>
        <Link href={`/${lang}#builder`}>{t(lang, 'journal.ctaButton')}</Link>
      </section>
      <Link href={`/${lang}/journal`}>{t(lang, 'journal.backToJournal')}</Link>
    </article>
  )
}
