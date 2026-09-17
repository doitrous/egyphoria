import { headers } from 'next/headers'
import { SITE_CONFIG, isRtl } from '@/site.config'
import './globals.css'

// The only <html>/<body> in the tree — Next allows exactly one. It has no route params of its
// own (it sits above [lang] and above the locale-free authors/help/tools/seo-admin routes), so
// the resolved locale rides in on a request header set by proxy.ts. Those locale-free routes
// carry no such header; they fall back to the site's default locale and its writing direction.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const lang = requestHeaders.get('x-site-lang') ?? SITE_CONFIG.defaultLocale
  return (
    <html lang={lang} dir={isRtl(lang) ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  )
}
