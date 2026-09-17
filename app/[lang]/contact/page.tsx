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

  // 01-site-setup.md: Contact needs Organization/TravelAgency schema with `sameAs`. The hub's
  // own settings.entity (once configured) already renders on every page via the layout's
  // <SeoJsonLd>; this is the local fallback so /contact carries the schema before that exists.
  // TODO(omar): sameAs is empty — add real social profile URLs once they exist.
  const localEntity = {
    '@context': 'https://schema.org', '@type': 'TravelAgency', name: SITE_CONFIG.name,
    email: contact.email, address: contact.addressLines.join(', '), sameAs: [] as string[],
    url: resolved.canonical,
  }
  const hasHubEntity = resolved.jsonld.some((e) => (e as { '@type'?: string })['@type'] === 'TravelAgency' || (e as { '@type'?: string })['@type'] === 'Organization')
  const jsonld = hasHubEntity ? resolved.jsonld : [...resolved.jsonld, localEntity]

  return (
    <article data-reveal>
      <SeoJsonLd seo={{ ...resolved, jsonld }} />
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
