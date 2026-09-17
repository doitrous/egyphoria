export type EmbedOptions = { origin: string; slug: string; lang: string; title: string; siteName: string }

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Tool title for <title>/iframe title: every kind's config carries one; fall back to the slug. */
export const toolTitle = (tool: { slug: string; config: Record<string, unknown> }) =>
  typeof tool.config.title === 'string' && tool.config.title ? tool.config.title : tool.slug

/** The paste-anywhere snippet shown under every tool. The <p> outside the iframe is the point —
 * a crawlable link back to the tool page and the home page; an iframe alone passes no link
 * equity. The <script> grows the iframe to the height the embed page posts (see
 * app/tools/[slug]/embed/page.tsx); without it the host shows a scrollbar at 480px. */
export function embedSnippet({ origin, slug, lang, title, siteName }: EmbedOptions): string {
  const page = `${origin}/tools/${slug}`
  return [
    `<iframe src="${page}/embed?lang=${encodeURIComponent(lang)}" title="${escapeHtml(title)}" width="100%" height="480" style="border:0;max-width:100%" loading="lazy"></iframe>`,
    // The tool link is the editorial attribution for the embedded resource and stays followed;
    // the brand link is a pure widget credit, which Google's link-spam policy says to nofollow.
    `<p><a href="${page}">${escapeHtml(title)}</a> — a free tool by <a href="${origin}/" rel="nofollow">${escapeHtml(siteName)}</a></p>`,
    // Only iframes pointing at this origin may resize themselves — never an ad or chat widget.
    `<script>addEventListener("message",function(e){var h=Number(e.data&&e.data.seoToolHeight);if(!h)return;document.querySelectorAll('iframe[src^="${origin}/"]').forEach(function(f){if(f.contentWindow===e.source)f.style.height=h+"px"})})</script>`,
  ].join('\n')
}
