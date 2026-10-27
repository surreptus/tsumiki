import type { Vowel } from './schemas';

const ROWS: Record<Vowel, string> = {
  a: 'あかがさざただなはばぱまやゃらわぁ',
  i: 'いきぎしじちぢにひびぴみりぃ',
  u: 'うくぐすずつづぬふぶぷむゆゅるぅゔ',
  e: 'えけげせぜてでねへべぺめれぇ',
  o: 'おこごそぞとどのほぼぽもよょろをぉ',
};

const VOWEL_OF = new Map<string, Vowel>();
for (const [vowel, chars] of Object.entries(ROWS) as [Vowel, string][]) {
  for (const ch of chars) VOWEL_OF.set(ch, vowel);
}

export function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** The vowel a kana ends in, or undefined for ん, っ, punctuation, etc. */
export function vowelOf(kana: string): Vowel | undefined {
  const last = toHiragana(kana.slice(-1));
  return VOWEL_OF.get(last);
}

const KANJI = /[㐀-䶿一-鿿々〇]/;
export const isKanji = (ch: string): boolean => KANJI.test(ch);
export const hasKanji = (s: string): boolean => KANJI.test(s);
