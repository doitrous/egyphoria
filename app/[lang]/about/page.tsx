import { pageMetadata } from '@/lib/page-metadata'
import { t } from '@/lib/i18n'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('/about', lang)
}

// 01-site-setup.md's About requirements (who runs the site, what it does, where, when founded,
// team names) — the old site's only "who we are" copy, from src/i18n/*.json's `behind` block.
export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <article data-reveal>
      <p className="eyebrow">{t(lang, 'behind.eyebrowIdentity')}</p>
      <h1 dangerouslySetInnerHTML={{ __html: t(lang, 'behind.signature') }} />
      <p className="eyebrow">{t(lang, 'behind.eyebrow')}</p>
      <h2 dangerouslySetInnerHTML={{ __html: t(lang, 'behind.title') }} />
      <p>{t(lang, 'behind.p1')}</p>
      <p>{t(lang, 'behind.p2')}</p>
      <p className="founders-label">{t(lang, 'behind.foundersLabel')}</p>
      <p>{t(lang, 'behind.founders')}</p>
      <p dangerouslySetInnerHTML={{ __html: t(lang, 'behind.principle') }} />
      {/* settings.entity (Organization/TravelAgency JSON-LD, hub-configured) renders on every
          page via <SeoJsonLd> in the [lang] layout — see app/[lang]/contact/page.tsx for the
          local fallback used before the hub has one configured. */}
    </article>
  )
}
