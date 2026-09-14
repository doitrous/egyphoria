// Minimal markdown → HTML for the content hub. Handles what blog posts need:
// front matter, h2/h3, paragraphs, bold/italic, links, lists, blockquotes,
// and a [[trip:id|label]] shortcode for internal links to trip pages.
// ponytail: hand-rolled subset; swap for `marked` if posts ever need tables/code.

export function frontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':'); if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (/^\d+$/.test(val)) val = Number(val);
    data[key] = val;
  }
  return { data, body: raw.slice(m[0].length) };
}

const escAttr = (s) => String(s).replace(/"/g, '&quot;');

function inline(text, links) {
  return text
    .replace(/\[\[trip:([a-z0-9-]+)\|([^\]]+)\]\]/g, (_, id, label) => `<a href="${escAttr(links.tripUrl(id))}">${label}</a>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${escAttr(href)}"${/^https?:/.test(href) ? ' rel="noopener"' : ''}>${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

export function markdown(src, links = { homeUrl: '/', tripUrl: (id) => `/trips/${id}/` }) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = []; let para = [], list = [], quote = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '), links)}</p>`); para = []; } };
  const flushList = () => { if (list.length) { out.push(`<ul>${list.map(li => `<li>${inline(li, links)}</li>`).join('')}</ul>`); list = []; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${inline(quote.join(' '), links)}</blockquote>`); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushAll(); continue; }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flushAll(); const lvl = Math.min(m[1].length + 1, 4); out.push(`<h${lvl}>${inline(m[2], links)}</h${lvl}>`); }
    else if ((m = line.match(/^[-*]\s+(.*)$/))) { flushPara(); flushQuote(); list.push(m[1]); }
    else if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); }
    else { flushList(); flushQuote(); para.push(line.trim()); }
  }
  flushAll();
  return out.join('\n');
}
