// Zod schemas shared by the Astro content collections (src/content.config.ts)
// and the pure conjugation engine (src/lib/data.ts), so both read the same
// JSON files with the same validation.
import { z } from 'astro/zod';

/** The six types every form can have. `clause` = closed clause; `adverb` takes no further suffix either. */
export const TYPES = ['verb', 'i-adj', 'na-adj', 'noun', 'adverb', 'clause'] as const;
export const TypeSchema = z.enum(TYPES);
export type Type = z.infer<typeof TypeSchema>;

/**
 * Conjugation classes. The first four are lexicon verb classes; the rest are
 * the classes of *derived* forms (a derived form conjugates like the last
 * suffix applied, e.g. 食べさせる is `ichidan`, 食べます is `masu`).
 */
export const CLASSES = [
  'ichidan', 'godan', 'suru', 'kuru',
  'i-adj', 'na-adj', 'noun', 'adverb',
  'masu', 'masen', 'desu', 'desu-i',
  'clause',
] as const;
export const ClassSchema = z.enum(CLASSES);
export type Cls = z.infer<typeof ClassSchema>;

export const VERB_CLASSES = ['ichidan', 'godan', 'suru', 'kuru'] as const;
export const VerbClassSchema = z.enum(VERB_CLASSES);
export type VerbClass = z.infer<typeof VerbClassSchema>;

export const STEM_IDS = [
  'renyokei', 'mizenkei', 'ishikei', 'kateikei', 'meireikei', 'te_stem', 'ta_stem', 'gokan',
] as const;
export const StemIdSchema = z.enum(STEM_IDS);
export type StemId = z.infer<typeof StemIdSchema>;

export const ATTACH_POINTS = [...STEM_IDS, 'dictionary', 'plain-clause'] as const;
export const AttachSchema = z.enum(ATTACH_POINTS);
export type Attach = z.infer<typeof AttachSchema>;

/** Final kana of a godan dictionary form. */
export const GODAN_FINALS = ['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'] as const;
export const GodanFinalSchema = z.enum(GODAN_FINALS);
export type GodanFinal = z.infer<typeof GodanFinalSchema>;

export const StateSchema = z.enum(['lemma', 'past', 'closed']);
export type State = z.infer<typeof StateSchema>;

export const VowelSchema = z.enum(['a', 'i', 'u', 'e', 'o']);
export type Vowel = z.infer<typeof VowelSchema>;

/**
 * A tail rewrite: drop `drop` characters from the end of the word, then append `add`.
 * `reading` overrides the rule for the kana reading (needed for 来る, whose kanji
 * stays put while the reading changes).
 */
export const RuleSchema = z.object({
  drop: z.number().int().min(0),
  add: z.string(),
  reading: z.object({ drop: z.number().int().min(0), add: z.string() }).optional(),
});
export type Rule = z.infer<typeof RuleSchema>;

// ---------------------------------------------------------------- stems
/** How to read a stem's name: one entry per character, plus a memory hook. */
export const EtymologySchema = z.object({
  reading: z.string().describe('Full kana reading of the name'),
  literal: z.string().describe('Word-for-word English, e.g. "connecting-use form"'),
  parts: z.array(z.object({
    char: z.string(),
    reading: z.string().describe('Romaji reading of this character in the name'),
    meaning: z.string(),
  })).min(1),
  mnemonic: z.string(),
});

export const StemSchema = z.object({
  id: StemIdSchema,
  name: z.string().describe('Traditional Japanese name, e.g. 連用形'),
  romaji: z.string(),
  label: z.string().describe('Learner-friendly label'),
  etymology: EtymologySchema,
  description: z.string(),
  rules: z.object({
    ichidan: RuleSchema.optional(),
    godan: z.partialRecord(GodanFinalSchema, RuleSchema).optional(),
    suru: RuleSchema.optional(),
    kuru: RuleSchema.optional(),
    'i-adj': RuleSchema.optional(),
    'na-adj': RuleSchema.optional(),
    noun: RuleSchema.optional(),
    masu: RuleSchema.optional(),
    masen: RuleSchema.optional(),
    desu: RuleSchema.optional(),
  }),
  /** Ids from the `irregulars` collection that override this stem. */
  exceptions: z.array(z.string()).default([]),
  order: z.number().int().default(0),
});
export type StemData = z.infer<typeof StemSchema>;

// ---------------------------------------------------------------- suffixes
export const ExampleSchema = z.object({
  japanese: z.string(),
  reading: z.string().describe('Full kana reading of `japanese` (kept as data; not displayed)'),
  gloss: z.string(),
});

/** Every suffix needs at least three examples. */
export const MIN_EXAMPLES = 3;

/**
 * An alternative form of a suffix, chosen by the stem it follows. `after` tests the
 * stem's final vowel; `classes` tests the class of the form being extended (needed
 * where the sound alone cannot decide: 書こう vs 来よう both follow こ). When both
 * are given, both must hold.
 */
/** How a suffix differs from a neighbour that learners confuse it with. */
export const CompareSchema = z.object({
  id: z.string().optional().describe('Suffix id, when the neighbour has its own page'),
  label: z.string().optional().describe('Display name, when the neighbour has no page yet'),
  difference: z.string(),
}).refine((c) => c.id || c.label, { message: 'compare needs `id` or `label`' });

export const AllomorphSchema = z.object({
  after: z.array(VowelSchema).min(1).optional(),
  classes: z.array(ClassSchema).min(1).optional(),
  form: z.string(),
  written: z.string().optional().describe('Conventional spelling of the form, when it differs'),
}).refine((a) => a.after || a.classes, { message: 'allomorph needs `after` or `classes`' });

const StateList = z.array(StateSchema).min(1);

export const VariantSchema = z.object({
  when: z.object({
    classes: z.array(ClassSchema).optional(),
    types: z.array(TypeSchema).optional(),
  }),
  attaches_to: AttachSchema.optional(),
  form: z.string().optional(),
  prefix: z.string().optional(),
  allomorphs: z.array(AllomorphSchema).optional(),
  input_type: z.array(TypeSchema).optional(),
  output_type: z.union([TypeSchema, z.literal('same')]).optional(),
  output_class: ClassSchema.optional(),
  accepts: StateList.optional(),
});
export type Variant = z.infer<typeof VariantSchema>;

export const SuffixSchema = z.object({
  id: z.string(),
  form: z.string().describe('Kana form; "" for zero-suffix functions such as the te-form'),
  written: z.string().optional().describe('Conventional kanji spelling, e.g. 方'),
  display: z.string().optional().describe('Name used in titles and tables when it differs from the form, e.g. てください'),
  prefix: z.string().optional().describe('Honorific prefix written before the stem, e.g. お in お書きになる'),
  romaji: z.string(),
  attaches_to: AttachSchema,
  input_type: z.array(TypeSchema).min(1),
  output_type: z.union([TypeSchema, z.literal('same')]),
  output_class: ClassSchema.optional(),
  output_state: z.enum(['past']).optional(),
  allomorphs: z.array(AllomorphSchema).optional(),
  variants: z.array(VariantSchema).optional(),
  accepts: StateList.optional(),
  noun_link: z.enum(['bare', 'da', 'na', 'na-no']).optional()
    .describe('How nouns / na-adjectives connect to a plain-clause suffix'),
  aux_verb: z.string().optional().describe('Lexicon id whose irregularities the output inherits'),
  constraints: z.object({
    polarity: z.enum(['pos', 'neg']).optional(),
    tense: z.enum(['nonpast', 'past']).optional(),
    politeness: z.enum(['plain', 'any']).optional(),
  }).optional(),
  effects: z.object({
    polarity: z.literal('neg').optional(),
    polite: z.literal(true).optional(),
  }).optional(),
  layer: z.number().optional().describe('Canonical stacking rank; see Composition rules'),
  meaning: z.string(),
  register: z.string().optional(),
  /** Short usage notes: nuance, restrictions, common mistakes. */
  usage: z.array(z.string()).default([]),
  compare: z.array(CompareSchema).default([]),
  related: z.array(z.string()).default([]),
  examples: z.array(ExampleSchema).min(MIN_EXAMPLES),
}).refine((s) => s.output_type !== 'verb' || s.output_class, {
  message: 'output_class is required when output_type is "verb"',
  path: ['output_class'],
});
export type SuffixData = z.infer<typeof SuffixSchema>;

// ---------------------------------------------------------------- lexicon
export const VerbSchema = z.object({
  id: z.string(),
  kanji: z.string().describe('Written form (equal to `kana` for kana-only words)'),
  kana: z.string(),
  class: VerbClassSchema,
  meaning: z.string(),
  lookalike: z.boolean().default(false).describe('Godan verb that ends in -iru/-eru'),
  notes: z.string().optional(),
});
export type VerbData = z.infer<typeof VerbSchema>;

export const PredicateSchema = z.object({
  id: z.string(),
  kanji: z.string(),
  kana: z.string(),
  class: z.enum(['i-adj', 'na-adj', 'noun']),
  meaning: z.string(),
  conjugates_like: z.string().optional().describe('Lexicon id whose irregularities apply'),
  notes: z.string().optional(),
});
export type PredicateData = z.infer<typeof PredicateSchema>;

// ---------------------------------------------------------------- irregulars
export const IrregularSchema = z.object({
  id: z.string(),
  category: z.enum(['class', 'suppletion', 'sound-change', 'honorific', 'adjective']),
  title: z.string(),
  note: z.string(),
  match: z.object({
    verbs: z.array(z.string()).optional(),
    classes: z.array(ClassSchema).optional(),
  }),
  /** Restrict to one suffix (e.g. する → さ only before れる/せる). */
  suffix: z.string().optional(),
  stems: z.array(StemIdSchema).optional(),
  /**
   * stem   – replace the stem the class rule would give
   * lemma  – rewrite the lemma first, then run the normal class rule
   * form   – replace the finished stem+suffix result
   */
  target: z.enum(['stem', 'lemma', 'form']),
  rule: RuleSchema,
  /** Lexicon id the result inherits irregularities from (いらっしゃる → irassharu). */
  key: z.string().optional(),
  /** Conjugation class of the replacement, when it differs from the suffix's output class (参る is godan). */
  output_class: ClassSchema.optional(),
});
export type IrregularData = z.infer<typeof IrregularSchema>;
