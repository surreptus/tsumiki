// The copy-paste prompt on each page. It hands an AI tutor the page's own facts, so the tutor teaches the
// same rules as the site, says that they are unreviewed, and asks it to teach in a question-led way.
import { summariseLabels, type ConstructionRow } from './construction';
import { TYPE_LABELS, withArticle } from './conjugate';
import type { SuffixData, Type } from './schemas';

export const SITE = 'https://surreptus.github.io/tsumiki';

const HOW_TO_TEACH = `HOW TO TEACH ME (learning mode, and make it challenging)
- Ask, don't tell. Never give me an answer or a full explanation before I have tried. One question at a time; wait for my reply.
- Start at a medium level and adapt. After two correct answers in a row, make it harder. After a miss, step down a little and come back to it later.
- Mix exercise types: build the form from a given word; add more pieces in the right order (negative, past, polite); spot and fix a wrong form; choose between this and a look-alike; translate English into Japanese; a short exchange where I must use it naturally.
- Include traps: the wrong stem, the wrong order, irregular verbs, and the look-alikes listed above.
- When I am wrong, do not just correct me. Say which step failed (stem, order or word type), give a hint, and let me try again once before you show the answer.
- Use the rules and examples above as the guide's view. They have not yet been checked by a native speaker: if one conflicts with standard Japanese, say so and explain. If you are not sure a Japanese sentence is natural, say so instead of guessing.
- Write Japanese normally, and give the reading in hiragana in brackets after any word with kanji. Stop the readings if I ask.
- Do not over-praise. Keep each turn short.
- After about ten questions, summarise what I got right, what I keep missing, and what to practise next.
- Start now with your first question.

My level: beginner. I will tell you if a question is too easy or too hard.`;

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
const type = (t: Type) => TYPE_LABELS[t];

/** The level line in HOW_TO_TEACH, which the page's level menu rewrites before copying. */
export const LEVEL_LINE = 'My level: beginner.';

interface SuffixInput {
  suffix: Pick<SuffixData, 'id' | 'meaning' | 'attaches_to' | 'input_type' | 'variants' | 'output_type' | 'usage' | 'examples' | 'register'> & { title: string };
  attach: string;
  rows: ConstructionRow[];
  compare: { label: string; difference: string }[];
  /** Endings documented on this same page (a short form, say), taught alongside it. */
  merged?: { title: string; meaning: string; rows: ConstructionRow[]; usage: string[]; examples: { japanese: string; gloss: string }[] }[];
  path: string;
}

const buildLines = (rows: ConstructionRow[]) =>
  rows.map((r) => {
    const how = r.piece === undefined ? 'irregular' : r.stem ? `${r.stem} + ${r.piece || 'nothing'}` : `plain form + ${r.piece}`;
    return `${r.words[0]} → ${r.result} (${summariseLabels(r.labels)}; ${how}; gives ${type(r.type)})`;
  });

export function suffixPrompt({ suffix: s, attach, rows, compare, merged = [], path }: SuffixInput): string {
  const built = buildLines(rows);
  const gives = s.output_type === 'same' ? 'the same type of word' : withArticle(s.output_type);
  const parts = [
    `You are a patient, demanding Japanese tutor. I am practising ${s.title} from Tsumiki, a guide that builds verb and adjective forms from small pieces, each of which takes one kind of word and returns another. (${SITE}${path})`,
    `THE ENDING: ${s.title}\nMeaning: ${s.meaning}\nAttaches to: ${attach}\nTakes: ${[...new Set([...s.input_type, ...(s.variants ?? []).flatMap((v) => v.input_type ?? [])])].map(type).join(' or ')}. Gives: ${gives}.${s.register ? `\nRegister: ${s.register}` : ''}`,
    `HOW IT IS BUILT\n${list(built)}`,
    `EXAMPLES\n${list(s.examples.map((e) => `${e.japanese} (${e.gloss})`))}`,
  ];
  if (s.usage.length) parts.push(`NOTES\n${list(s.usage)}`);
  for (const m of merged) {
    parts.push(`ALSO ON THIS PAGE: ${m.title}\n${m.meaning}\n${list(buildLines(m.rows))}\nExamples:\n${list(m.examples.map((e) => `${e.japanese} (${e.gloss})`))}${m.usage.length ? `\nNotes:\n${list(m.usage)}` : ''}`);
  }
  if (compare.length) parts.push(`LOOK-ALIKES\n${list(compare.map((c) => `${c.label}: ${c.difference}`))}`);
  parts.push(HOW_TO_TEACH);
  return parts.join('\n\n');
}

export function stemPrompt(o: { name: string; label: string; description: string; rules: string[]; suffixes: string[]; path: string }): string {
  return [
    `You are a patient, demanding Japanese tutor. I am practising the ${o.name} (${o.label}) from Tsumiki, a guide that builds verb forms from small pieces. A stem is the shape a word takes so an ending can attach to it. (${SITE}${o.path})`,
    `THE STEM: ${o.name} (${o.label})\n${o.description}`,
    `THE RULES, BY KIND OF VERB\n${list(o.rules)}`,
    `ENDINGS THAT ATTACH TO IT\n${o.suffixes.join(', ')}`,
    `${HOW_TO_TEACH}\n\nFor this stem, mostly ask me to produce the stem for a given verb (include godan, ichidan, する and 来る), and then to attach an ending to it. Make me say which verb class I am working with before I answer.`,
  ].join('\n\n');
}

export function guidePrompt(o: { title: string; description: string; path: string }): string {
  return [
    `You are a patient, demanding Japanese tutor. I am studying "${o.title}" from Tsumiki, a guide to Japanese grammar. (${SITE}${o.path})`,
    `TOPIC: ${o.title}\n${o.description}\nThis topic is about choosing between forms and what each one means, not about building a word from pieces. Use standard Japanese grammar for the facts, and say so if a choice depends on context or register.`,
    `${HOW_TO_TEACH}\n\nFor this topic, mostly give me a short situation or sentence with a gap and make me choose, then ask me why. Follow up with a near-miss where the other choice is also possible, and ask what changes.`,
  ].join('\n\n');
}
