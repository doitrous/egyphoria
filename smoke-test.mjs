// SEO smoke test. Zero dependencies. Run after `node build.mjs`:
//   node build.mjs && node smoke-test.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const read = (rel) => readFileSync(join(DIST, rel), 'utf8');

const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.ok(locs.length >= 1, 'sitemap.xml has no <loc> entries');
assert.ok(locs.every(l => l.startsWith('https://')), 'sitemap.xml has a non-absolute/non-https <loc>');
assert.ok(sitemap.includes('<lastmod>'), 'sitemap.xml is missing <lastmod>');

const robots = read('robots.txt');
assert.ok(robots.includes('Sitemap:'), 'robots.txt is missing a Sitemap: line');

const home = read('index.html');
assert.ok(home.includes('<h1'), 'homepage is missing an <h1');
assert.ok(home.includes('rel="canonical"'), 'homepage is missing rel="canonical"');

const toolPage = read('tools/trip-cost/index.html');
assert.ok(toolPage.includes('seo-tool-placeholder'), 'trip-cost tool page is missing seo-tool-placeholder');
assert.ok(toolPage.includes('rel="nofollow"'), 'trip-cost tool page embed snippet is missing rel="nofollow"');

const toolEmbedPage = read('tools/trip-cost/embed/index.html');
assert.ok(toolEmbedPage.includes('noindex'), 'trip-cost embed page is missing noindex');

assert.ok(sitemap.includes('/tools/trip-cost/</loc>'), 'sitemap is missing the trip-cost tool page');
assert.ok(!sitemap.includes('/tools/trip-cost/embed/'), 'sitemap must not list the trip-cost embed page');

const helpIndex = read('help/index.html');
assert.ok(helpIndex.includes('<h1>Help center</h1>'), 'help index is missing its <h1>');
assert.ok(helpIndex.includes('FAQPage'), 'help index is missing FAQPage JSON-LD');
assert.ok(helpIndex.includes('help-list'), 'help index has no entries — expected the populated help.json entries to render');

const helpEntry = read('help/do-i-need-a-visa-to-visit-egypt/index.html');
assert.ok(helpEntry.includes('Do I need a visa to visit Egypt?'), 'help entry is missing its question as <h1>');
assert.ok(helpEntry.includes('"@type":"Article"'), 'help entry is missing Article JSON-LD');
assert.ok(/class="button small" href="[^"]+"/.test(helpEntry), 'help entry is missing its money-page CTA link');

const editorial = read('editorial-guidelines/index.html');
assert.ok(editorial.includes('<h1>Editorial guidelines</h1>'), 'editorial-guidelines page is missing its <h1>');

assert.ok(sitemap.includes('/help/</loc>'), 'sitemap is missing the help index');
assert.ok(sitemap.includes('/help/do-i-need-a-visa-to-visit-egypt/</loc>'), 'sitemap is missing a help entry');
assert.ok(sitemap.includes('/editorial-guidelines/</loc>'), 'sitemap is missing editorial-guidelines');

// share block: present on a blog page and a tool page (bottom of body), absent
// from the non-content booking-complete page.
for (const rel of ['journal/index.html', 'tools/trip-cost/index.html', 'help/index.html']) {
  const html = read(rel);
  assert.ok(html.includes('class="seo-share"'), `${rel} is missing the share block`);
  assert.ok(html.includes('/js/share.js'), `${rel} is missing the share.js upgrade script`);
}
assert.ok(!read('booking/complete/index.html').includes('class="seo-share"'), 'booking/complete is a non-content page and should not carry the share block');

// Empty hub data must still render a normal 200 empty-state page, never skip the file.
{
  const ROOT = dirname(fileURLToPath(import.meta.url));
  const helpFile = join(ROOT, 'src', 'content', 'help.json');
  const original = readFileSync(helpFile, 'utf8');
  try {
    writeFileSync(helpFile, JSON.stringify({ en: [] }));
    execSync('node build.mjs', { cwd: ROOT, stdio: 'pipe' });
    const empty = readFileSync(join(DIST, 'help', 'index.html'), 'utf8');
    assert.ok(empty.includes('No help entries yet.'), 'empty help.json must still render the baked-in empty-state copy');
    assert.ok(!empty.includes('FAQPage'), 'empty help.json must not emit FAQPage JSON-LD with zero questions');
  } finally {
    writeFileSync(helpFile, original);
    execSync('node build.mjs', { cwd: ROOT, stdio: 'pipe' }); // restore real dist/ output
  }
}

console.log(`smoke test passed: ${locs.length} sitemap URLs, all absolute+https, lastmod present; robots.txt has Sitemap:; homepage has h1+canonical; trip-cost tool + embed pages present, sitemap excludes the embed page; help index/entry + editorial-guidelines render with correct JSON-LD and sitemap entries; share block present on content pages and absent from booking/complete; empty help.json still renders a 200 empty-state page.`);
