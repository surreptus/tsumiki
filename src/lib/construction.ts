// "How is this suffix built?": runs the engine on one sample word per class and splits each
// result into stem + suffix piece, so the construction shown on a suffix page can never drift
// from what the engine actually does.
import { compose, findWord, type Form } from './conjugate';
import type { StemId, Type } from './schemas';

export const SAMPLES: { cls: string; label: string; word: string }[] = [
  { cls: 'ichidan', label: 'ichidan verb', word: '食べる' },
  { cls: 'godan', label: 'godan verb', word: '書く' },
  { cls: 'suru', label: 'する verb', word: '連絡する' },
  { cls: 'kuru', label: '来る', word: '来る' },
  { cls: 'i-adj', label: 'い-adjective', word: '高い' },
  { cls: 'na-adj', label: 'な-adjective', word: '静か' },
  { cls: 'noun', label: 'noun', word: '学生' },
];

export interface ConstructionRow {
  labels: string[];
  words: string[];
  /** The stem the suffix attached to; undefined for dictionary-form / plain-clause suffixes. */
  stem?: StemId;
  /** Text it attached to for the first sample word: the stem (書か) or the whole form (書く). */
  base?: string;
  /** Honorific prefix written before the stem (お書きになる), when there is one. */
  prefix?: string;
  /** What is added after `base`; undefined when the result is irregular (勉強できる). */
  piece?: string;
  result: string;
  type: Type;
}

export function construction(suffixId: string): ConstructionRow[] {
  const rows: ConstructionRow[] = [];
  for (const sample of SAMPLES) {
    const word = findWord(sample.word);
    if (!word) continue;
    const d = compose(word.id, [suffixId]);
    if (d.error || !d.result) continue;
    const step = d.steps[0];
    const out: Form = step.output;
    const base = step.stem ? step.stem.surface.text : step.input.text;
    const at = out.text.indexOf(base);
    // a short prefix before the stem (お, ご) is part of the construction, not an irregularity
    const prefix = at > 0 && at <= 1 ? out.text.slice(0, at) : undefined;
    const piece = at === 0 || prefix ? out.text.slice(at + base.length) : undefined;
    const same = (r: ConstructionRow) => r.stem === step.stem?.id && r.prefix === prefix && r.type === out.type && (piece !== undefined ? r.piece === piece : r.result === out.text);
    const existing = rows.find(same);
    if (existing) {
      existing.labels.push(sample.label);
      existing.words.push(sample.word);
    } else {
      rows.push({ labels: [sample.label], words: [sample.word], stem: step.stem?.id, base, prefix, piece, result: out.text, type: out.type });
    }
  }
  return rows;
}

const VERB_LABELS = ['ichidan verb', 'godan verb', 'する verb', '来る'];

/** "ichidan verb, godan verb, する verb, 来る" -> "all verbs"; all seven -> "every word type". */
export function summariseLabels(labels: string[]): string {
  if (labels.length === SAMPLES.length) return 'every word type';
  if (VERB_LABELS.every((l) => labels.includes(l))) {
    return ['all verbs', ...labels.filter((l) => !VERB_LABELS.includes(l))].join(', ');
  }
  return labels.join(', ');
}
