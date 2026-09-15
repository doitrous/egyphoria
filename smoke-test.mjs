// SEO smoke test. Zero dependencies. Run after `node build.mjs`:
//   node build.mjs && node smoke-test.mjs
import { readFileSync } from 'node:fs';
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

console.log(`smoke test passed: ${locs.length} sitemap URLs, all absolute+https, lastmod present; robots.txt has Sitemap:; homepage has h1+canonical; trip-cost tool + embed pages present, sitemap excludes the embed page.`);
