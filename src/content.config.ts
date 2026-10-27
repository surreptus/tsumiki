import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import {
  IrregularSchema, PredicateSchema, StemSchema, SuffixSchema, VerbSchema,
} from './lib/schemas';

const byId = ({ data }: { data: Record<string, unknown> }) => String(data.id);

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),

  // one JSON file per entry
  stems: defineCollection({
    loader: glob({ pattern: '*.json', base: './src/data/stems', generateId: byId }),
    schema: StemSchema,
  }),
  suffixes: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/data/suffixes', generateId: byId }),
    schema: SuffixSchema,
  }),

  // one JSON array per collection
  verbs: defineCollection({ loader: file('src/data/verbs.json'), schema: VerbSchema }),
  predicates: defineCollection({ loader: file('src/data/predicates.json'), schema: PredicateSchema }),
  irregulars: defineCollection({ loader: file('src/data/irregulars.json'), schema: IrregularSchema }),
};
