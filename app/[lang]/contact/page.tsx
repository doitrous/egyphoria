import { SeoJsonLd } from '@omary98/seo-runtime-next'
import { pageMetadata } from '@/lib/page-metadata'
import { seo } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { SITE_CONFIG } from '@/site.config'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('/contact', lang)
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const path = `/${lang}/contact`
  const resolved = await seo.resolve(path, lang)
  const { contact } = SITE_CONFIG

  // The Organization/TravelAgency fallback now lives in [lang]/layout.tsx (every page under
  // [lang] needs it, not just this one) — see its own comment for why. Nothing contact-specific
  // to add here any more.

  return (
    <article data-reveal>
      <SeoJsonLd seo={resolved} />
      <h1>{t(lang, 'behind.cta')}</h1>
      <ul>
        <li>Email: {contact.email}</li>
        {contact.phone && <li>Phone: {contact.phone}</li>}
        {contact.addressLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </article>
  )
}
