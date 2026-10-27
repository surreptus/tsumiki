// Loads the JSON in src/data/ for the conjugation engine. This path exists so the engine can
// run outside Astro (Vitest, and the client-side Conjugator) where `astro:content` is unavailable.
//
// No runtime validation here, to keep Zod out of the browser bundle: the same files are
// validated with the same schemas by the content collections at build time and by
// src/lib/data.test.ts.
import type { IrregularData, PredicateData, StemData, SuffixData, VerbData } from './schemas';
import verbsRaw from '../data/verbs.json';
import predicatesRaw from '../data/predicates.json';
import irregularsRaw from '../data/irregulars.json';

const stemFiles = import.meta.glob('../data/stems/*.json', { eager: true, import: 'default' });
const suffixFiles = import.meta.glob('../data/suffixes/**/*.json', { eager: true, import: 'default' });

export const stems = (Object.values(stemFiles) as StemData[]).sort((a, b) => a.order - b.order);

export const suffixes = Object.entries(suffixFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, raw]) => raw as SuffixData);

export const verbs = verbsRaw as unknown as VerbData[];
export const predicates = predicatesRaw as unknown as PredicateData[];
export const irregulars = irregularsRaw as unknown as IrregularData[];
