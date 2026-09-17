import { pageMetadata, NOINDEX_PATHS } from '@/lib/page-metadata'
import { SITE_CONFIG } from '@/site.config'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const base = await pageMetadata('/terms', lang)
  // Ticket: /{lang}/terms is noindex — see lib/page-metadata.ts's NOINDEX_PATHS.
  return NOINDEX_PATHS.has('/terms') ? { ...base, robots: { index: false, follow: true } } : base
}

// New page (the old static build never had one) — required by 01-site-setup.md's trust-pages
// checklist. TODO(omar): have a lawyer review and replace this generic placeholder before
// launch; it is not translated (English only) for the same reason.
export default async function TermsPage() {
  return (
    <article>
      <h1>Terms of service</h1>
      <p role="note">TODO(omar): placeholder legal text — replace with reviewed terms before launch.</p>
      <p>
        By using egyphoria.com or booking a trip through us, you agree to these terms. Trip prices shown are per person and
        subject to confirmation once your dates, group size and hotel tier are finalized — see each trip page&apos;s
        disclaimer.
      </p>
      <p>
        Bookings are confirmed after payment through our checkout provider (PayTabs). Cancellation and refund terms are
        confirmed with you directly at the time of booking, since they depend on the operators and dates involved.
      </p>
      <p>Questions about a booking or these terms can be sent to {SITE_CONFIG.contact.email}.</p>
    </article>
  )
}
