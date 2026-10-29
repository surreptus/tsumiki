// Runs axe-core (WCAG 2.2 AA plus best practice) over every built page in both themes. Run after `npm run build`.
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { chromium } from 'playwright-core';
import { BASE, serve } from './serve-dist.mjs';

const axePath = createRequire(import.meta.url).resolve('axe-core');
const walk = (d) => readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name === 'index.html' ? [join(d, e.name)] : []));
const paths = walk('dist').map((f) => `${BASE}/${relative('dist', f).replace(/index\.html$/, '')}`);

const { origin, close } = await serve('dist');
const browser = await chromium.launch();
const problems = [];
try {
  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width: 1000, height: 800 } });
    await context.addInitScript((t) => { try { localStorage.setItem('starlight-theme', t); } catch {} }, theme);
    const page = await context.newPage();
    for (const path of paths) {
      await page.goto(origin + path, { waitUntil: 'load' });
      // the conjugator is only interesting once some steps are dimmed
      if (path.endsWith('/reference/conjugator/')) {
        await page.locator('.conj-palette button', { hasText: 'neg' }).first().click();
      }
      await page.addScriptTag({ path: axePath });
      const { violations } = await page.evaluate(() =>
        window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
      for (const v of violations) problems.push(`${theme} ${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0].target.join(' ')}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  close();
}
if (problems.length) {
  console.error(`${problems.length} accessibility problem(s):\n${problems.slice(0, 40).join('\n')}`);
  process.exit(1);
}
console.log(`axe: ${paths.length} pages in dark and light, no violations.`);
