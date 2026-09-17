import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SeoGtag, SeoJsonLd, SeoWebVitals, ShareBlock } from '@omary98/seo-runtime-next'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { menuFor, LOCALE_LABELS } from '@/lib/nav'
import { withEntityFallback } from '@/lib/entity'
import SiteMenu from '@/components/SiteMenu'
import RevealOnScroll from '@/components/RevealOnScroll'
import PlanDialog from '@/components/PlanDialog'
import { dictFor } from '@/lib/i18n'

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!SITE_CONFIG.locales.includes(lang)) notFound()

  // Set by proxy.ts. Resolving SEO once here lets a single <SeoJsonLd>/<SeoGtag> pair cover
  // every page under [lang] without each one re-fetching it.
  const pathname = (await headers()).get('x-site-pathname') ?? `/${lang}`
  const rawResolved = await seo.resolve(pathname.split('?')[0], lang)
  const pathWithoutLang = pathname.startsWith(`/${lang}`) ? pathname.slice(lang.length + 1) || '' : ''

  // 01-site-setup.md: every page needs Organization/TravelAgency schema. The hub's own
  // settings.entity (once configured) already lands in resolved.jsonld; withEntityFallback is
  // the local fallback so every [lang] page carries it before that hub profile exists — one
  // place (lib/entity.ts), rather than a per-page check like the one this replaced on /contact.
  const resolved = { ...rawResolved, jsonld: withEntityFallback(rawResolved.jsonld) }

  const searches = SITE_CONFIG.popularSearches[lang]?.length ? SITE_CONFIG.popularSearches[lang] : SITE_CONFIG.popularSearches[SITE_CONFIG.defaultLocale]

  return (
    <>
      <SeoJsonLd seo={resolved} />
      <SeoGtag seo={resolved} />
      {process.env.NEXT_PUBLIC_WEB_VITALS === '1' && <SeoWebVitals />}
      <a href="#main-content" className="skip-link">
        {t(lang, 'nav.skip')}
      </a>
      <header>
        <SiteMenu
          lang={lang}
          homeLabel={t(lang, 'nav.home')}
          items={menuFor(lang)}
          locales={SITE_CONFIG.locales.map((code) => ({ code, label: LOCALE_LABELS[code] ?? code }))}
          pathWithoutLang={pathWithoutLang}
          openMenuLabel={t(lang, 'nav.openMenu')}
          closeMenuLabel={t(lang, 'nav.closeMenu')}
          languageLabel={t(lang, 'nav.language')}
        />
      </header>
      <main id="main-content">{children}</main>
      {/* 01-site-setup.md §5: every content page shows a share control. One <ShareBlock/> here
          covers every page rendered under [lang]; /help, /tools/{slug} and /authors/{slug}
          carry their own since they render outside this layout. */}
      <ShareBlock url={resolved.canonical} title={resolved.title} />
      <footer>
        {searches?.length ? (
          <nav aria-label="Popular searches">
            <h2>{t(lang, 'footer.popularSearchesLabel')}</h2>
            <ul>
              {searches.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <nav aria-label="Support">
          <h2>{t(lang, 'footer.supportLabel')}</h2>
          <ul>
            <li>
              <Link href={`/${lang}/about`}>{t(lang, 'footer.behind')}</Link>
            </li>
            <li>
              <Link href={`/${lang}/journal`}>{t(lang, 'footer.journal')}</Link>
            </li>
            <li>
              <Link href={`/help?lang=${lang}`}>{t(lang, 'footer.help')}</Link>
            </li>
            <li>
              <Link href={`/tools?lang=${lang}`}>{t(lang, 'footer.tools')}</Link>
            </li>
            <li>
              <Link href={`/${lang}/contact`}>{t(lang, 'behind.cta')}</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <ul>
            <li>
              <Link href={`/${lang}/privacy`}>Privacy</Link>
            </li>
            <li>
              <Link href={`/${lang}/terms`}>Terms</Link>
            </li>
            <li>
              <Link href={`/editorial-guidelines?lang=${lang}`}>{t(lang, 'footer.editorial')}</Link>
            </li>
          </ul>
        </nav>
        <p>{t(lang, 'footer.tagline')}</p>
        <p>
          {SITE_CONFIG.contact.email}
          {SITE_CONFIG.contact.phone ? ` · ${SITE_CONFIG.contact.phone}` : ''}
        </p>
        <p>
          &copy; <span id="year">{new Date().getFullYear()}</span> Egyphoria. {t(lang, 'footer.rights')}
        </p>
      </footer>
      <RevealOnScroll />
      <PlanDialog lang={lang} dict={dictFor(lang)} />
    </>
  )
}
