import type { Metadata } from 'next'
import { readConfig, timingSafeSecret } from '@omary98/seo-runtime-core'
import { SeoApprovalPanel } from '@omary98/seo-runtime-next/approval-panel'

/**
 * Secret-gated the same way yayatours' /seo-admin is: a `?secret=` query string, since a plain
 * browser visit can't set a custom header — treat the URL like a password, never link to it
 * publicly. `force-dynamic` because the check depends on the request's own query string, not on
 * anything cacheable. `readConfig().secret` never crosses into a client component — this file is
 * a server component and the secret is only ever compared server-side.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function SeoAdminPage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const { secret } = await searchParams
  if (!timingSafeSecret(secret ?? '', readConfig().secret)) return <p>unauthorized</p>
  return <SeoApprovalPanel secret={secret ?? ''} apiBase="/api/seo" />
}
