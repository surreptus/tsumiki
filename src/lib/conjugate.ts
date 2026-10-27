// The conjugation engine: stems are functions from a word to a string, suffixes
// are functions from a typed form to a typed form, and `compose` chains them.
// Pure TypeScript; all rules live in src/data/ and are injected via `createEngine`.
import { vowelOf } from './kana';
import type {
  Cls, IrregularData, Rule, State, StemData, StemId, SuffixData, Type, Variant,
} from './schemas';
import * as data from './data';

// ------------------------------------------------------------------ types

export interface Surface {
  /** Written form, kanji included. */
  text: string;
  /** Full kana reading. */
  reading: string;
}

/** A typed intermediate result of a derivation. */
export interface Form extends Surface {
  type: Type;
  /** Conjugation class: decides which stem rules apply to this form. */
  cls: Cls;
  /** lemma = uninflected; past = plain past; closed = a finished clause. */
  state: State;
  polarity: 'pos' | 'neg';
  tense: 'nonpast' | 'past';
  polite: boolean;
  /** Lexicon id whose irregularities this form inherits (行く, ある, いい ...). */
  key?: string;
}

export type ErrorCode =
  | 'unknown-word'
  | 'unknown-suffix'
  | 'type-mismatch'
  | 'wrong-state'
  | 'closed-clause'
  | 'no-stem'
  | 'constraint';

export interface ConjError {
  code: ErrorCode;
  message: string;
  suffixId: string;
  expected?: string[];
  got?: string;
}

export type ApplyResult =
  | { ok: true; form: Form; type: Type; stem?: { id: StemId; surface: Surface }; warnings: string[] }
  | { ok: false; error: ConjError };

export interface Step {
  index: number;
  suffixId: string;
  input: Form;
  output: Form;
  /** The stem the suffix attached to, when it attached to one. */
  stem?: { id: StemId; surface: Surface };
  warnings: string[];
}

export interface Derivation {
  start: Form;
  steps: Step[];
  /** Final form; absent when the chain failed. */
  result?: Form;
  /** The first error, with the zero-based index of the failing step. */
  error?: ConjError & { step: number };
}

export interface Word {
  id: string;
  kanji: string;
  kana: string;
  cls: Cls;
  type: Type;
  conjugatesLike?: string;
  meaning: string;
}

export class ConjugationError extends Error {
  constructor(public readonly error: ConjError) {
    super(error.message);
    this.name = 'ConjugationError';
  }
}

// ------------------------------------------------------------------ labels

export const TYPE_LABELS: Record<Type, string> = {
  verb: 'verb',
  'i-adj': 'い-adjective',
  'na-adj': 'な-adjective',
  noun: 'noun',
  adverb: 'adverb',
  clause: 'closed clause',
};

/** Compact names for chips and tables, where the full label overflows. */
export const TYPE_SHORT: Record<Type, string> = {
  ...TYPE_LABELS,
  'i-adj': 'い-adj',
  'na-adj': 'な-adj',
  clause: 'clause',
};

export const CLASS_LABELS: Record<Cls, string> = {
  ichidan: 'ichidan verb',
  godan: 'godan verb',
  suru: 'する verb',
  kuru: '来る',
  'i-adj': 'い-adj',
  'na-adj': 'な-adj',
  noun: 'noun',
  adverb: 'adverb',
  masu: 'ます-form',
  masen: 'ません-form',
  desu: 'です (after noun / な-adjective)',
  'desu-i': 'です (after い-adjective)',
  clause: 'closed clause',
};

/** Why a class lacks a stem, for the classes where that is a rule worth teaching. */
const NO_STEM_HINTS: Partial<Record<Cls, string>> = {
  masu: 'A ます-form only continues as ません, ました, まして or ましょう. Put the other suffix before ます.',
  masen: 'ません can only be followed by でした. Put the other suffix before ます.',
  desu: 'です after a noun or な-adjective only continues as でした. Put the other suffix before です.',
  'desu-i': 'です after an い-adjective ends the chain. Put tense and negation first: 高かったです, not 高いでした.',
};

// ------------------------------------------------------------------ helpers

function tailRule(s: string, drop: number, add: string): string {
  if (drop > s.length) throw new Error(`cannot drop ${drop} characters from "${s}"`);
  return s.slice(0, s.length - drop) + add;
}

/**
 * Apply a tail rule to both the written form and the reading. When the rule's
 * reading part differs from the text part (来る), the text rule is used only if the
 * written tail is kanji; if the tail is plain kana (連れてくる) the reading rule
 * applies to both.
 */
function applyRule(surface: Surface, rule: Rule): Surface {
  const r = rule.reading ?? rule;
  const reading = tailRule(surface.reading, r.drop, r.add);
  const droppedReading = surface.reading.slice(surface.reading.length - r.drop);
  const tailIsKana = r.drop === 0 || surface.text.endsWith(droppedReading);
  const text = rule.reading && !tailIsKana
    ? tailRule(surface.text, rule.drop, rule.add)
    : tailRule(surface.text, r.drop, r.add);
  return { text, reading };
}

const concat = (a: Surface, b: Surface): Surface => ({
  text: a.text + b.text,
  reading: a.reading + b.reading,
});

const pastTense = (form: Form) => form.tense === 'past';

function describe(form: Form): string {
  return `${form.text} (${TYPE_LABELS[form.type]}${form.state === 'past' ? ', past' : ''})`;
}

// ------------------------------------------------------------------ engine

export interface EngineData {
  stems: StemData[];
  suffixes: SuffixData[];
  words: Word[];
  irregulars: IrregularData[];
}

export function wordsFromLexicon(lex: {
  verbs: typeof data.verbs;
  predicates: typeof data.predicates;
}): Word[] {
  return [
    ...lex.verbs.map((v): Word => ({
      id: v.id, kanji: v.kanji, kana: v.kana, cls: v.class, type: 'verb', meaning: v.meaning,
    })),
    ...lex.predicates.map((p): Word => ({
      id: p.id, kanji: p.kanji, kana: p.kana, cls: p.class, type: p.class,
      conjugatesLike: p.conjugates_like, meaning: p.meaning,
    })),
  ];
}

export function createEngine(db: EngineData) {
  const stemById = new Map(db.stems.map((s) => [s.id, s]));
  const suffixById = new Map(db.suffixes.map((s) => [s.id, s]));

  // ---------------------------------------------------------------- lexicon

  function findWord(query: string): Word | undefined {
    return (
      db.words.find((w) => w.id === query) ??
      db.words.find((w) => w.kanji === query) ??
      db.words.find((w) => w.kana === query)
    );
  }

  function startForm(word: Word | string): Form {
    const w = typeof word === 'string' ? findWord(word) : word;
    if (!w) {
      throw new ConjugationError({
        code: 'unknown-word',
        message: `Unknown word "${String(word)}".`,
        suffixId: '',
      });
    }
    return {
      text: w.kanji,
      reading: w.kana,
      type: w.type,
      cls: w.cls,
      state: 'lemma',
      polarity: 'pos',
      tense: 'nonpast',
      polite: false,
      key: w.conjugatesLike ?? w.id,
    };
  }

  // ---------------------------------------------------------------- stems

  function matchRows(form: Form, target: IrregularData['target'], stemId?: StemId, suffixId?: string) {
    const rows = db.irregulars.filter((row) => {
      if (row.target !== target) return false;
      const byVerb = !!form.key && !!row.match.verbs?.includes(form.key);
      const byClass = !!row.match.classes?.includes(form.cls);
      if (!byVerb && !byClass) return false;
      if (row.suffix !== undefined && row.suffix !== suffixId) return false;
      if (target === 'form' && row.suffix === undefined) return false;
      if (stemId !== undefined && row.stems && !row.stems.includes(stemId)) return false;
      if (stemId !== undefined && !row.stems && target !== 'form') return false;
      return true;
    });
    const score = (r: IrregularData) =>
      (r.match.verbs?.includes(form.key ?? '') ? 2 : 0) + (r.suffix !== undefined ? 1 : 0);
    return rows.sort((a, b) => score(b) - score(a));
  }

  function classRule(stem: StemData, cls: Cls, reading: string): Rule | undefined {
    if (cls === 'godan') return stem.rules.godan?.[reading.slice(-1) as keyof typeof stem.rules.godan];
    return stem.rules[cls as keyof StemData['rules']] as Rule | undefined;
  }

  /**
   * The stem of a form, or undefined if its class has no such stem.
   * `suffixId` lets suffix-specific irregulars (する → さ before れる) apply.
   */
  function stemSurface(form: Form, stemId: StemId, suffixId?: string): Surface | undefined {
    const stem = stemById.get(stemId);
    if (!stem) return undefined;

    const direct = matchRows(form, 'stem', stemId, suffixId)[0];
    if (direct) return applyRule(form, direct.rule);

    let lemma: Surface = form;
    const rewrite = matchRows(form, 'lemma', stemId, suffixId)[0];
    if (rewrite) lemma = applyRule(form, rewrite.rule);

    const rule = classRule(stem, form.cls, lemma.reading);
    return rule ? applyRule(lemma, rule) : undefined;
  }

  /** The irregular row (if any) that changes this stem, for flagging exceptions in tables. */
  function irregularFor(form: Form, stemId: StemId, suffixId?: string): IrregularData | undefined {
    return matchRows(form, 'stem', stemId, suffixId)[0] ?? matchRows(form, 'lemma', stemId, suffixId)[0];
  }

  /** `stem(食べる, 'mizenkei')` → '食べ'. Throws if the word or stem does not exist. */
  function stem(word: Word | Form | string, stemId: StemId): string {
    const form = typeof word === 'object' && 'state' in word ? word : startForm(word);
    const surface = stemSurface(form, stemId);
    if (!surface) {
      throw new ConjugationError({
        code: 'no-stem',
        message: `${CLASS_LABELS[form.cls]} ${form.text} has no ${stemId}.`,
        suffixId: '',
      });
    }
    return surface.text;
  }

  // ---------------------------------------------------------------- apply

  function resolve(suffix: SuffixData, form: Form) {
    const variant: Variant | undefined = suffix.variants?.find(
      (v) =>
        (!!v.when.classes || !!v.when.types) &&
        (!v.when.classes || v.when.classes.includes(form.cls)) &&
        (!v.when.types || v.when.types.includes(form.type)),
    );
    const formChanged = variant?.form !== undefined;
    return {
      attaches_to: variant?.attaches_to ?? suffix.attaches_to,
      form: variant?.form ?? suffix.form,
      prefix: variant ? variant.prefix : suffix.prefix,
      written: formChanged ? undefined : suffix.written,
      allomorphs: variant?.allomorphs ?? (formChanged ? undefined : suffix.allomorphs),
      input_type: variant?.input_type ?? suffix.input_type,
      output_type: variant?.output_type ?? suffix.output_type,
      output_class: variant?.output_class ?? suffix.output_class,
      accepts: variant?.accepts ?? suffix.accepts ??
        ((variant?.attaches_to ?? suffix.attaches_to) === 'plain-clause'
          ? (['lemma', 'past'] as State[])
          : (['lemma'] as State[])),
    };
  }

  function allInputTypes(suffix: SuffixData): Type[] {
    const all = new Set<Type>(suffix.input_type);
    for (const v of suffix.variants ?? []) v.input_type?.forEach((t) => all.add(t));
    return [...all];
  }

  const fail = (suffixId: string, code: ErrorCode, message: string, extra: Partial<ConjError> = {}): ApplyResult =>
    ({ ok: false, error: { code, message, suffixId, ...extra } });

  function link(form: Form, suffix: SuffixData): Surface {
    if (form.state !== 'lemma' || (form.type !== 'noun' && form.type !== 'na-adj')) {
      return { text: '', reading: '' };
    }
    const kind = suffix.noun_link ?? 'bare';
    const kana =
      kind === 'da' ? 'だ' :
      kind === 'na' ? 'な' :
      kind === 'na-no' ? (form.type === 'noun' ? 'の' : 'な') : '';
    return { text: kana, reading: kana };
  }

  function apply(suffixId: string, form: Form): ApplyResult {
    const suffix = suffixById.get(suffixId);
    if (!suffix) return fail(suffixId, 'unknown-suffix', `There is no suffix called "${suffixId}".`);

    const eff = resolve(suffix, form);
    const label = suffix.written ?? (suffix.form || `the ${suffix.romaji}-form`);

    // 1. closed clauses accept nothing unless the suffix says so
    if (form.state === 'closed' && !eff.accepts.includes('closed')) {
      return fail(suffixId, 'closed-clause',
        `${describe(form)} is a closed clause, so ${label} cannot attach to it. Clauses are joined to the sentence by particles (see the Guides).`,
        { got: TYPE_LABELS[form.type] });
    }

    // 2. type
    if (!eff.input_type.includes(form.type)) {
      const expected = allInputTypes(suffix).map((t) => TYPE_LABELS[t]);
      return fail(suffixId, 'type-mismatch',
        `${label} attaches to a ${expected.join(' / ')}, but ${describe(form)} is a ${TYPE_LABELS[form.type]}.`,
        { expected, got: TYPE_LABELS[form.type] });
    }

    // 3. state (already past / already a stem-less clause)
    if (!eff.accepts.includes(form.state)) {
      return fail(suffixId, 'wrong-state',
        `${label} needs an uninflected ${TYPE_LABELS[form.type]}, but ${describe(form)} is already ${form.state === 'past' ? 'in the past tense' : 'inflected'}.` +
        ` Apply ${label} before the tense.`,
        { expected: eff.accepts, got: form.state });
    }

    // 4. declared constraints
    const c = suffix.constraints;
    if (c?.polarity && c.polarity !== form.polarity) {
      return fail(suffixId, 'constraint',
        `${label} only attaches to ${c.polarity === 'pos' ? 'affirmative' : 'negative'} forms, but ${describe(form)} is ${form.polarity === 'pos' ? 'affirmative' : 'negative'}.`);
    }
    if (c?.tense && c.tense !== (pastTense(form) ? 'past' : 'nonpast')) {
      return fail(suffixId, 'constraint',
        `${label} only attaches to ${c.tense} forms, but ${describe(form)} is ${pastTense(form) ? 'past' : 'non-past'}.`);
    }
    const stemAttach = eff.attaches_to !== 'dictionary' && eff.attaches_to !== 'plain-clause';
    if (form.polite && !stemAttach && (c?.politeness ?? 'plain') === 'plain') {
      return fail(suffixId, 'constraint',
        `${label} attaches to plain forms, but ${describe(form)} is polite. Put ${label} before ます / です.`);
    }

    // 5. build the new surface
    let surface: Surface;
    let usedStem: { id: StemId; surface: Surface } | undefined;
    const wholeForm = matchRows(form, 'form', undefined, suffixId)[0];

    if (wholeForm) {
      surface = applyRule(form, wholeForm.rule);
    } else {
      let base: Surface;
      if (stemAttach) {
        const stemId = eff.attaches_to as StemId;
        const s = stemSurface(form, stemId, suffixId);
        if (!s) {
          const stemName = stemById.get(stemId)?.name ?? stemId;
          return fail(suffixId, 'no-stem',
            `${describe(form)} is a ${CLASS_LABELS[form.cls]}, which has no ${stemName}, so ${label} has nothing to attach to. ` +
            (NO_STEM_HINTS[form.cls] ?? ''),
            { got: CLASS_LABELS[form.cls] });
        }
        usedStem = { id: stemId, surface: s };
        base = eff.prefix ? concat({ text: eff.prefix, reading: eff.prefix }, s) : s;
      } else if (eff.attaches_to === 'plain-clause') {
        base = concat(form, link(form, suffix));
      } else {
        base = form;
      }

      const allomorph = eff.allomorphs?.find((a) => {
        const v = vowelOf(base.reading);
        return (!a.after || (v !== undefined && a.after.includes(v))) &&
          (!a.classes || a.classes.includes(form.cls));
      });
      const ending: Surface = allomorph
        ? { text: allomorph.written ?? allomorph.form, reading: allomorph.form }
        : { text: eff.written ?? eff.form, reading: eff.form };
      surface = concat(base, ending);
    }

    // 6. the output form
    const type = eff.output_type === 'same' ? form.type : eff.output_type;
    const cls: Cls =
      wholeForm?.output_class ??
      eff.output_class ??
      (eff.output_type === 'same' ? form.cls : type === 'verb' ? form.cls : (type as Cls));
    const state: State = suffix.output_state ?? (type === 'clause' ? 'closed' : 'lemma');

    const out: Form = {
      ...surface,
      type,
      cls,
      state,
      polarity: suffix.effects?.polarity ? 'neg' : form.polarity,
      tense: suffix.output_state === 'past' ? 'past' : form.tense,
      polite: suffix.effects?.polite ?? form.polite,
      key: wholeForm?.key ?? suffix.aux_verb ?? (eff.output_type === 'same' ? form.key : undefined),
    };
    return { ok: true, form: out, type, stem: usedStem, warnings: [] };
  }

  // ---------------------------------------------------------------- compose

  /**
   * Apply `chain` left to right (the first id is applied first, i.e. innermost).
   * Stops at the first error and reports it with the failing step index.
   */
  function compose(word: Word | Form | string, chain: string[]): Derivation {
    const start = typeof word === 'object' && 'state' in word ? word : startForm(word);
    const steps: Step[] = [];
    let current = start;
    let lastLayer = -Infinity;

    for (const [index, suffixId] of chain.entries()) {
      const r = apply(suffixId, current);
      if (!r.ok) return { start, steps, error: { ...r.error, step: index } };

      const warnings = [...r.warnings];
      const layer = suffixById.get(suffixId)?.layer;
      if (layer !== undefined && !current.polite) {
        if (layer < lastLayer) {
          warnings.push(
            `${suffixId} normally comes earlier in the canonical stacking order (causative → passive → aspect → tai → negation → tense → politeness).`);
        }
        lastLayer = Math.max(lastLayer, layer);
      }
      steps.push({ index, suffixId, input: current, output: r.form, stem: r.stem, warnings });
      current = r.form;
    }
    return { start, steps, result: current };
  }

  return { stem, stemSurface, irregularFor, apply, compose, startForm, findWord, stems: db.stems, suffixes: db.suffixes, words: db.words, irregulars: db.irregulars };
}

// ------------------------------------------------------------------ default engine

export const engine = createEngine({
  stems: data.stems,
  suffixes: data.suffixes,
  words: wordsFromLexicon({ verbs: data.verbs, predicates: data.predicates }),
  irregulars: data.irregulars,
});

export const { stem, stemSurface, irregularFor, apply, compose, startForm, findWord } = engine;
