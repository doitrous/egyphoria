import { pageMetadata } from '@/lib/page-metadata'
import { SITE_CONFIG } from '@/site.config'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('/privacy', lang)
}

// The old static build never had a /privacy page at all — this is new, required by
// 01-site-setup.md's trust-pages checklist. TODO(omar): have a lawyer review and replace this
// generic placeholder before launch; it is not translated (English only) for the same reason.
export default async function PrivacyPage() {
  return (
    <article>
      <h1>Privacy policy</h1>
      <p role="note">TODO(omar): placeholder legal text — replace with a reviewed privacy policy before launch.</p>
      <p>
        Egyphoria collects the information you give us directly — your name, email, travel dates and preferences — when you use the
        itinerary builder, contact us, or book a trip. We use it only to plan and deliver your journey, and to reply to your
        enquiries.
      </p>
      <p>
        We do not sell your personal information. We share booking details only with the operators, guides and partners
        needed to run your specific trip, and with our payment processor (PayTabs) to handle checkout securely.
      </p>
      <p>
        We use standard analytics tools to understand how the site is used, in aggregate. You can ask us what information we
        hold about you, or ask us to delete it, by emailing {SITE_CONFIG.contact.email}.
      </p>
    </article>
  )
}
