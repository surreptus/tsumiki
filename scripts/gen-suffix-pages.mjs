// Writes a stub MDX page per suffix in src/data/suffixes/, at
// src/content/docs/reference/suffixes/<attach point>/<id>.mdx.
// Never overwrites an existing page, so hand-written prose is safe. Run: node scripts/gen-suffix-pages.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA = 'src/data/suffixes';
const OUT = 'src/content/docs/reference/suffixes';
const TITLES = { te: 'て形', past: 'た形', imperative: '命令形' };
const LABELS = { te: 'て-form · te', past: 'Past tense · ta', imperative: 'Imperative · meirei' };

let created = 0;
for (const dir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const file of readdirSync(join(DATA, dir.name)).filter((f) => f.endsWith('.json'))) {
    const s = JSON.parse(readFileSync(join(DATA, dir.name, file), 'utf8'));
    if (s.attaches_to !== dir.name) throw new Error(`${file}: attaches_to ${s.attaches_to} != folder ${dir.name}`);
    const target = join(OUT, dir.name, `${s.id}.mdx`);
    if (existsSync(target)) continue;
    mkdirSync(join(OUT, dir.name), { recursive: true });
    // Japanese-only title; the sidebar label keeps the romaji.
    const title = TITLES[s.id] ?? s.display ?? s.written ?? s.form;
    const label = LABELS[s.id] ?? `${s.display ?? s.written ?? s.form} · ${s.romaji}`;
    const description = s.meaning.split('. ')[0].replace(/\.$/, '') + '.';
    writeFileSync(
      target,
      `---
title: "${title}"
description: ${JSON.stringify(description)}
sidebar:
  label: "${label}"
---

import SuffixCard from '../../../../../components/SuffixCard.astro';

<SuffixCard id="${s.id}" />
`,
    );
    created++;
  }
}
console.log(`created ${created} suffix pages`);
