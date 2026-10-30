import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// A missing rule does not fail the build, it just draws arrows without shafts, so check it here.
describe('illustration styles', () => {
  const css = readFileSync('src/styles/custom.css', 'utf8');
  const dir = 'src/components/illustrations';
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.astro'))) {
    it(`${file} only uses classes that custom.css defines`, () => {
      const used = new Set([...readFileSync(`${dir}/${file}`, 'utf8').matchAll(/class="([^"]+)"/g)]
        .flatMap((m) => m[1].split(/\s+/)).filter((c) => /^il-/.test(c) && c !== 'illus'));
      const missing = [...used].filter((c) => !new RegExp(`\\.${c}(?![\\w-])`).test(css));
      expect(missing, `${file} uses undefined classes`).toEqual([]);
    });
  }
});
