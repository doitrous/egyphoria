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

console.log(`smoke test passed: ${locs.length} sitemap URLs, all absolute+https, lastmod present; robots.txt has Sitemap:; homepage has h1+canonical.`);
