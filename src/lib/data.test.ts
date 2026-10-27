import { describe, expect, it } from 'vitest';
import * as data from './data';
import {
  IrregularSchema, PredicateSchema, StemSchema, SuffixSchema, VerbSchema, MIN_EXAMPLES,
} from './schemas';

// data.ts does not validate (to keep Zod out of the browser); this is where the
// raw JSON meets the schemas outside of an Astro build.
describe('JSON files satisfy the Zod schemas', () => {
  it('stem etymology spells the stem name', () =>
    data.stems.forEach((s) => expect(s.etymology.parts.map((p) => p.char).join(''), s.id).toBe(s.name)));
  it('stems', () => data.stems.forEach((s) => expect(StemSchema.safeParse(s).success, s.id).toBe(true)));
  it('suffixes', () => data.suffixes.forEach((s) => {
    const r = SuffixSchema.safeParse(s);
    expect(r.success, `${s.id}: ${r.success ? '' : r.error.message}`).toBe(true);
  }));
  it('verbs', () => expect(VerbSchema.array().safeParse(data.verbs).success).toBe(true));
  it('predicates', () => expect(PredicateSchema.array().safeParse(data.predicates).success).toBe(true));
  it('irregulars', () => expect(IrregularSchema.array().safeParse(data.irregulars).success).toBe(true));
  it('every suffix has at least MIN_EXAMPLES examples', () => {
    for (const s of data.suffixes) expect(s.examples.length, s.id).toBeGreaterThanOrEqual(MIN_EXAMPLES);
  });
});
