// Fails when an internal link or #anchor in the built site points at nothing. Run after `npm run build`.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BASE } from './serve-dist.mjs';

const walk = (d) => readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.html') ? [join(d, e.name)] : []));

const pageFor = (path) => {
  const rel = path.slice(BASE.length) || '/';
  for (const c of [rel.endsWith('/') ? `${rel}index.html` : rel, `${rel}/index.html`]) if (existsSync(join('dist', c))) return join('dist', c);
  return existsSync(join('dist', rel)) && !rel.endsWith('/') ? join('dist', rel) : null;
};

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};

const problems = [];
let count = 0;
for (const file of walk('dist')) {
  const html = readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/<a [^>]*href="([^"]+)"/g)) {
    if (!href.startsWith(`${BASE}/`) && !href.startsWith('#')) continue;
    count++;
    const [path, hash] = href.split('#');
    const target = path ? pageFor(path.split('?')[0]) : file;
    if (!target) { problems.push(`${file}: ${href} (no such page)`); continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) problems.push(`${file}: ${href} (no such anchor)`);
  }
}
if (problems.length) {
  console.error(`${problems.length} broken link(s):\n${[...new Set(problems)].slice(0, 40).join('\n')}`);
  process.exit(1);
}
console.log(`${count} internal links checked, none broken.`);
