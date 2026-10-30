// The copy-paste prompt on each page. It hands an AI tutor the page's own facts as ground truth, so the
// tutor teaches the same rules as the site, and asks it to teach in a hard, question-led way.
import { summariseLabels, type ConstructionRow } from './construction';
import { TYPE_LABELS } from './conjugate';
import type { SuffixData, Type } from './schemas';

export const SITE = 'https://surreptus.github.io/tsumiki';

const HOW_TO_TEACH = `HOW TO TEACH ME (learning mode, and make it challenging)
- Ask, don't tell. Never give me an answer or a full explanation before I have tried. One question at a time; wait for my reply.
- Start at a medium level and adapt. After two correct answers in a row, make it harder. After a miss, step down a little and come back to it later.
- Mix exercise types: build the form from a given word; add more pieces in the right order (negative, past, polite); spot and fix a wrong form; choose between this and a look-alike; translate English into Japanese; a short exchange where I must use it naturally.
- Include traps: the wrong stem, the wrong order, irregular verbs, and the look-alikes listed above.
- When I am wrong, do not just correct me. Say which step failed (stem, order or word type), give a hint, and let me try again once before you show the answer.
- Treat the rules and examples above as ground truth. If you are not sure a Japanese sentence is natural, say so instead of guessing.
- Write Japanese normally. Give readings or romaji only if I ask.
- Do not over-praise. Keep each turn short.
- After about ten questions, summarise what I got right, what I keep missing, and what to practise next.
- Start now with your first question.

My level: [beginner / intermediate / advanced]. I will tell you if a question is too easy or too hard.`;

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
const type = (t: Type) => TYPE_LABELS[t];
const article = (t: Type) => (t === 'i-adj' || t === 'adverb' ? 'an' : 'a');

interface SuffixInput {
  suffix: Pick<SuffixData, 'id' | 'meaning' | 'attaches_to' | 'input_type' | 'output_type' | 'usage' | 'examples' | 'register'> & { title: string };
  attach: string;
  rows: ConstructionRow[];
  compare: { label: string; difference: string }[];
  path: string;
}

export function suffixPrompt({ suffix: s, attach, rows, compare, path }: SuffixInput): string {
  const built = rows.map((r) => {
    const how = r.piece === undefined ? 'irregular' : r.stem ? `${r.stem} + ${r.piece || 'nothing'}` : `plain form + ${r.piece}`;
    return `${r.words[0]} → ${r.result} (${summariseLabels(r.labels)}; ${how}; gives ${type(r.type)})`;
  });
  const gives = s.output_type === 'same' ? 'the same type of word' : `${article(s.output_type)} ${type(s.output_type)}`;
  const parts = [
    `You are a patient, demanding Japanese tutor. I am practising ${s.title} from Tsumiki, a guide that builds verb and adjective forms from small pieces, each of which takes one kind of word and returns another. (${SITE}${path})`,
    `THE ENDING: ${s.title}\nMeaning: ${s.meaning}\nAttaches to: ${attach}\nTakes: ${s.input_type.map(type).join(' or ')}. Gives: ${gives}.${s.register ? `\nRegister: ${s.register}` : ''}`,
    `HOW IT IS BUILT\n${list(built)}`,
    `EXAMPLES\n${list(s.examples.map((e) => `${e.japanese} (${e.gloss})`))}`,
  ];
  if (s.usage.length) parts.push(`NOTES\n${list(s.usage)}`);
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
