import { describe, expect, it } from 'vitest';
import {
  apply, compose, createEngine, engine, startForm, stem, stemSurface, wordsFromLexicon,
  type Derivation,
} from './conjugate';
import * as data from './data';
import { STEM_IDS, type StemId } from './schemas';

const VERB_STEMS: StemId[] = ['renyokei', 'mizenkei', 'ishikei', 'kateikei', 'meireikei', 'te_stem', 'ta_stem'];

const text = (word: string, chain: string[]) => {
  const d = compose(word, chain);
  if (d.error) throw new Error(`${word} ${chain.join('>')}: ${d.error.message}`);
  return d.result!.text;
};
const summary = (d: Derivation) => d.steps.map((s) => `${s.output.type}${s.output.state === 'past' ? '/past' : ''}`);

// ------------------------------------------------------------------ stems

describe('stems: every verb class × every stem', () => {
  // [word, renyō, mizen, ishi, katei, meirei, te, ta]
  const table: [string, ...string[]][] = [
    ['食べる', '食べ', '食べ', '食べ', '食べれ', '食べろ', '食べて', '食べた'],
    ['見る', '見', '見', '見', '見れ', '見ろ', '見て', '見た'],
    ['買う', '買い', '買わ', '買お', '買え', '買え', '買って', '買った'],
    ['書く', '書き', '書か', '書こ', '書け', '書け', '書いて', '書いた'],
    ['泳ぐ', '泳ぎ', '泳が', '泳ご', '泳げ', '泳げ', '泳いで', '泳いだ'],
    ['話す', '話し', '話さ', '話そ', '話せ', '話せ', '話して', '話した'],
    ['待つ', '待ち', '待た', '待と', '待て', '待て', '待って', '待った'],
    ['死ぬ', '死に', '死な', '死の', '死ね', '死ね', '死んで', '死んだ'],
    ['遊ぶ', '遊び', '遊ば', '遊ぼ', '遊べ', '遊べ', '遊んで', '遊んだ'],
    ['飲む', '飲み', '飲ま', '飲も', '飲め', '飲め', '飲んで', '飲んだ'],
    ['帰る', '帰り', '帰ら', '帰ろ', '帰れ', '帰れ', '帰って', '帰った'],
    ['する', 'し', 'し', 'し', 'すれ', 'しろ', 'して', 'した'],
    ['勉強する', '勉強し', '勉強し', '勉強し', '勉強すれ', '勉強しろ', '勉強して', '勉強した'],
    ['来る', '来', '来', '来', '来れ', '来い', '来て', '来た'],
  ];

  it.each(table)('%s', (word, ...expected) => {
    expect(VERB_STEMS.map((id) => stem(word, id))).toEqual(expected);
  });

  it('来る changes its reading while the kanji stays put', () => {
    const readings = VERB_STEMS.map((id) => stemSurface(startForm('来る'), id)!.reading);
    expect(readings).toEqual(['き', 'こ', 'こ', 'くれ', 'こい', 'きて', 'きた']);
  });

  it('every lexicon verb has all seven verb stems', () => {
    for (const v of data.verbs) {
      for (const id of VERB_STEMS) {
        expect(stemSurface(startForm(v.id), id), `${v.id} ${id}`).toBeDefined();
      }
    }
  });

  it('ichidan verbs collapse renyō, mizen and ishi into one stem, and te/ta are that stem + て/た', () => {
    for (const v of data.verbs.filter((x) => x.class === 'ichidan')) {
      const [ren, miz, ishi] = ['renyokei', 'mizenkei', 'ishikei'].map((id) => stem(v.id, id as StemId));
      expect(miz).toBe(ren);
      expect(ishi).toBe(ren);
      expect(stem(v.id, 'te_stem')).toBe(`${ren}て`);
      expect(stem(v.id, 'ta_stem')).toBe(`${ren}た`);
    }
  });

  it('godan verbs keep renyō, mizen and ishi distinct', () => {
    for (const v of data.verbs.filter((x) => x.class === 'godan' && x.id !== 'gozaru')) {
      const set = new Set(['renyokei', 'mizenkei', 'ishikei'].map((id) => stem(v.id, id as StemId)));
      expect(set.size, v.id).toBe(3);
    }
  });
});

describe('look-alike godan verbs', () => {
  it.each([
    ['帰る', '帰ら', '帰り'],
    ['入る', '入ら', '入り'],
    ['走る', '走ら', '走り'],
    ['知る', '知ら', '知り'],
    ['切る', '切ら', '切り'],
    ['要る', '要ら', '要り'],
  ])('%s is godan (mizen %s, renyō %s)', (word, miz, ren) => {
    expect(stem(word, 'mizenkei')).toBe(miz);
    expect(stem(word, 'renyokei')).toBe(ren);
  });

  it('same kana, different class: 着る/切る and 居る/要る', () => {
    expect(stem('着る', 'mizenkei')).toBe('着');
    expect(stem('切る', 'mizenkei')).toBe('切ら');
    expect(stem('居る', 'mizenkei')).toBe('居');
    expect(stem('要る', 'mizenkei')).toBe('要ら');
  });

  it('the lexicon flags exactly the six look-alikes', () => {
    const flagged = data.verbs.filter((v) => v.lookalike).map((v) => v.kanji).sort();
    expect(flagged).toEqual(['切る', '入る', '帰る', '要る', '知る', '走る'].sort());
    for (const v of data.verbs.filter((x) => x.lookalike)) expect(v.class).toBe('godan');
  });
});

describe('irregulars', () => {
  it('する takes し / さ / せ in front of different suffixes', () => {
    expect(text('する', ['neg'])).toBe('しない');
    expect(text('する', ['passive'])).toBe('される');
    expect(text('する', ['causative'])).toBe('させる');
    expect(text('する', ['zu'])).toBe('せず');
    expect(text('勉強する', ['zu'])).toBe('勉強せず');
  });

  it('する potential is できる', () => {
    expect(text('する', ['potential'])).toBe('できる');
    expect(text('勉強する', ['potential', 'neg'])).toBe('勉強できない');
  });

  it('ある → ない, and anything built on ある inherits it', () => {
    expect(text('ある', ['neg'])).toBe('ない');
    expect(text('ある', ['neg', 'past'])).toBe('なかった');
    expect(text('食べる', ['te_aru', 'neg'])).toBe('食べてない');
    expect(text('食べる', ['koto_ga_aru', 'neg', 'past'])).toBe('食べたことがなかった');
  });

  it('honorific godan verbs take い instead of り', () => {
    for (const [word, masu, imp] of [
      ['いらっしゃる', 'いらっしゃいます', 'いらっしゃい'],
      ['なさる', 'なさいます', 'なさい'],
      ['下さる', '下さいます', '下さい'],
      ['おっしゃる', 'おっしゃいます', 'おっしゃい'],
    ]) {
      expect(text(word, ['masu'])).toBe(masu);
      expect(stem(word, 'meireikei')).toBe(imp);
    }
    expect(text('ござる', ['masu'])).toBe('ございます');
    // the other stems stay regular
    expect(stem('いらっしゃる', 'mizenkei')).toBe('いらっしゃら');
    expect(stem('いらっしゃる', 'te_stem')).toBe('いらっしゃって');
  });

  it('いい is よい everywhere except the dictionary form', () => {
    expect(text('いい', ['neg'])).toBe('よくない');
    expect(text('いい', ['neg', 'past'])).toBe('よくなかった');
    expect(text('いい', ['past'])).toBe('よかった');
    expect(text('いい', ['te'])).toBe('よくて');
    expect(text('いい', ['ba'])).toBe('よければ');
    expect(text('かっこいい', ['past'])).toBe('かっこよかった');
    expect(text('食べる', ['hou_ga_ii', 'neg'])).toBe('食べた方がよくない');
  });
});

// ------------------------------------------------------------------ te / ta

describe('te- and ta-form sound changes', () => {
  it.each([
    // [word, te, ta]                      final kana → change
    ['買う', '買って', '買った'], //          う → って
    ['待つ', '待って', '待った'], //          つ → って
    ['帰る', '帰って', '帰った'], //          る → って
    ['死ぬ', '死んで', '死んだ'], //          ぬ → んで
    ['遊ぶ', '遊んで', '遊んだ'], //          ぶ → んで
    ['飲む', '飲んで', '飲んだ'], //          む → んで
    ['書く', '書いて', '書いた'], //          く → いて
    ['泳ぐ', '泳いで', '泳いだ'], //          ぐ → いで
    ['話す', '話して', '話した'], //          す → して
    ['行く', '行って', '行った'], //          irregular
    ['問う', '問うて', '問うた'], //          irregular
    ['食べる', '食べて', '食べた'],
    ['する', 'して', 'した'],
    ['来る', '来て', '来た'],
  ])('%s → %s / %s', (word, te, ta) => {
    expect(text(word, ['te'])).toBe(te);
    expect(text(word, ['past'])).toBe(ta);
  });

  it('adjectives and nouns have te/ta forms too', () => {
    expect(text('高い', ['te'])).toBe('高くて');
    expect(text('高い', ['past'])).toBe('高かった');
    expect(text('静か', ['te'])).toBe('静かで');
    expect(text('静か', ['past'])).toBe('静かだった');
    expect(text('学生', ['past'])).toBe('学生だった');
  });
});

// ------------------------------------------------------------------ potential etc.

describe('potential: ichidan vs godan', () => {
  it.each([
    ['食べる', '食べられる'], // ichidan: mizen + られる
    ['見る', '見られる'],
    ['来る', '来られる'],
    ['買う', '買える'], //      godan: e-stem + る
    ['書く', '書ける'],
    ['泳ぐ', '泳げる'],
    ['話す', '話せる'],
    ['待つ', '待てる'],
    ['死ぬ', '死ねる'],
    ['遊ぶ', '遊べる'],
    ['飲む', '飲める'],
    ['帰る', '帰れる'],
  ])('%s → %s', (word, expected) => {
    expect(text(word, ['potential'])).toBe(expected);
  });

  it('the output is always an ichidan verb', () => {
    for (const w of ['食べる', '書く', '来る', 'する']) {
      const r = compose(w, ['potential']).result!;
      expect([r.type, r.cls]).toEqual(['verb', 'ichidan']);
    }
  });

  it('passive and causative pick れる/られる and せる/させる by the stem', () => {
    expect(text('書く', ['passive'])).toBe('書かれる');
    expect(text('食べる', ['passive'])).toBe('食べられる');
    expect(text('買う', ['passive'])).toBe('買われる');
    expect(text('書く', ['causative'])).toBe('書かせる');
    expect(text('食べる', ['causative'])).toBe('食べさせる');
    expect(text('来る', ['causative'])).toBe('来させる');
  });

  it('volitional: う after godan, よう after ichidan', () => {
    expect(text('書く', ['volitional'])).toBe('書こう');
    expect(text('買う', ['volitional'])).toBe('買おう');
    expect(text('食べる', ['volitional'])).toBe('食べよう');
    expect(text('する', ['volitional'])).toBe('しよう');
    expect(text('来る', ['volitional'])).toBe('来よう');
    expect(compose('来る', ['volitional']).result!.reading).toBe('こよう');
  });
});

// ------------------------------------------------------------------ compositions

describe('multi-step compositions', () => {
  const cases: { word: string; chain: string[]; text: string; reading?: string; types?: string[] }[] = [
    {
      word: '食べる', chain: ['causative', 'passive', 'tai', 'neg', 'past'],
      text: '食べさせられたくなかった', reading: 'たべさせられたくなかった',
      types: ['verb', 'verb', 'i-adj', 'i-adj', 'i-adj/past'],
    },
    { word: '書く', chain: ['passive', 'neg', 'past'], text: '書かれなかった', types: ['verb', 'i-adj', 'i-adj/past'] },
    { word: '行く', chain: ['te_iru', 'neg', 'past'], text: '行っていなかった', reading: 'いっていなかった' },
    { word: '見る', chain: ['potential', 'neg'], text: '見られない' },
    { word: '飲む', chain: ['tai', 'past'], text: '飲みたかった' },
    { word: '勉強する', chain: ['causative', 'masu', 'past'], text: '勉強させました', types: ['verb', 'verb', 'verb/past'] },
    { word: '帰る', chain: ['te_shimau', 'past'], text: '帰ってしまった' },
    { word: '来る', chain: ['passive', 'masu', 'neg', 'past'], text: '来られませんでした', reading: 'こられませんでした' },
    { word: '話す', chain: ['sugiru', 'neg'], text: '話しすぎない' },
    { word: '高い', chain: ['sugiru', 'past'], text: '高すぎた', types: ['verb', 'verb/past'] },
    { word: '静か', chain: ['neg', 'past'], text: '静かじゃなかった', types: ['i-adj', 'i-adj/past'] },
    { word: '学生', chain: ['desu', 'past'], text: '学生でした' },
    { word: '食べる', chain: ['tai', 'past', 'desu'], text: '食べたかったです' },
    { word: '食べる', chain: ['tai', 'neg', 'te'], text: '食べたくなくて', types: ['i-adj', 'i-adj', 'clause'] },
    { word: '行く', chain: ['te_iku', 'te'], text: '行っていって' },
    { word: '来る', chain: ['te_kuru', 'past'], text: '来てきた', reading: 'きてきた' },
    { word: '食べる', chain: ['masu', 'volitional'], text: '食べましょう' },
    { word: '食べる', chain: ['masu', 'neg', 'past'], text: '食べませんでした' },
    { word: '食べる', chain: ['kata'], text: '食べ方', reading: 'たべかた', types: ['noun'] },
    { word: '食べる', chain: ['te_oku', 'te'], text: '食べておいて' },
    { word: '学生', chain: ['tara'], text: '学生だったら' },
    { word: '食べる', chain: ['masu', 'kara_reason'], text: '食べますから' },
    { word: '学生', chain: ['kara_reason'], text: '学生だから' },
    { word: '静か', chain: ['noni'], text: '静かなのに' },
    { word: '学生', chain: ['deshou'], text: '学生でしょう' },
    { word: '食べる', chain: ['past', 'kedo'], text: '食べたけど' },
    { word: '食べる', chain: ['neg', 'hou_ga_ii'], text: '食べない方がいい' },
    { word: '食べる', chain: ['sugiru', 'neg', 'hou_ga_ii'], text: '食べすぎない方がいい' },
    { word: '食べる', chain: ['hou_ga_ii'], text: '食べた方がいい' },
    // adjective and noun derivations (gokan, with the adverb type)
    { word: '高い', chain: ['adverb'], text: '高く', types: ['adverb'] },
    { word: '静か', chain: ['adverb'], text: '静かに', types: ['adverb'] },
    { word: 'いい', chain: ['adverb'], text: 'よく' },
    { word: '高い', chain: ['naru_change'], text: '高くなる', types: ['verb'] },
    { word: '静か', chain: ['naru_change', 'past'], text: '静かになった' },
    { word: '学生', chain: ['naru_change', 'tai'], text: '学生になりたい' },
    { word: '高い', chain: ['suru_change', 'past'], text: '高くした' },
    { word: '静か', chain: ['suru_change', 'masu'], text: '静かにします' },
    { word: '高い', chain: ['sa'], text: '高さ', types: ['noun'] },
    { word: '静か', chain: ['sa'], text: '静かさ' },
    { word: '学生', chain: ['da'], text: '学生だ', types: ['clause'] },
    // sentence-level and aspect-like functions
    { word: '食べる', chain: ['masu', 'ka'], text: '食べますか' },
    { word: '食べる', chain: ['masu', 'neg', 'ka'], text: '食べませんか' },
    { word: '食べる', chain: ['masu', 'volitional', 'ka'], text: '食べましょうか' },
    { word: '学生', chain: ['desu', 'ka'], text: '学生ですか' },
    { word: '食べる', chain: ['te_iru', 'tokoro_doing', 'past'], text: '食べているところだった' },
    { word: '帰る', chain: ['bakari'], text: '帰ったばかり' },
    { word: '食べる', chain: ['tari'], text: '食べたり' },
    { word: '食べる', chain: ['ato_de'], text: '食べた後で' },
    // honorific and humble frames, with the prefix
    { word: '書く', chain: ['o_ni_naru'], text: 'お書きになる', reading: 'おかきになる' },
    { word: '書く', chain: ['o_suru', 'masu'], text: 'お書きします' },
    { word: '案内する', chain: ['o_suru', 'masu'], text: 'ご案内します' },
    { word: '勉強する', chain: ['o_ni_naru', 'past'], text: 'ご勉強になった' },
    { word: '食べる', chain: ['o_ni_naru'], text: '召し上がる', reading: 'めしあがる' },
    { word: '来る', chain: ['o_ni_naru', 'masu'], text: 'いらっしゃいます' },
    { word: '行く', chain: ['o_suru', 'masu'], text: '参ります' },
    { word: 'する', chain: ['o_suru', 'masu'], text: 'いたします' },
    { word: '見る', chain: ['o_ni_naru'], text: 'ご覧になる', reading: 'ごらんになる' },
  ];

  it.each(cases)('$word $chain → $text', ({ word, chain, text: expected, reading, types }) => {
    const d = compose(word, chain);
    expect(d.error).toBeUndefined();
    expect(d.result!.text).toBe(expected);
    if (reading) expect(d.result!.reading).toBe(reading);
    if (types) expect(summary(d)).toEqual(types);
  });

  it('has at least ten multi-step compositions', () => {
    expect(cases.filter((c) => c.chain.length >= 2).length).toBeGreaterThanOrEqual(10);
  });

  it('records which stem each step attached to', () => {
    const d = compose('食べる', ['causative', 'passive', 'tai', 'neg', 'past']);
    expect(d.steps.map((s) => s.stem?.id)).toEqual([
      'mizenkei', 'mizenkei', 'renyokei', 'renyokei', 'ta_stem',
    ]);
  });

  it('the canonical stacking order produces no warnings', () => {
    const d = compose('食べる', ['causative', 'passive', 'tai', 'neg', 'past']);
    expect(d.steps.flatMap((s) => s.warnings)).toEqual([]);
  });

  it('warns when the canonical order is reversed (passive before causative)', () => {
    const d = compose('食べる', ['passive', 'causative']);
    expect(d.error).toBeUndefined();
    expect(d.steps[1].warnings).toHaveLength(1);
  });
});

// ------------------------------------------------------------------ type errors

describe('type errors', () => {
  const fails = (word: string, chain: string[]) => {
    const d = compose(word, chain);
    expect(d.error, `${word} ${chain.join('>')} should fail`).toBeDefined();
    return d.error!;
  };

  it('たい cannot follow ない (an い-adjective is not a verb)', () => {
    const e = fails('食べる', ['neg', 'tai']);
    expect(e.code).toBe('type-mismatch');
    expect(e.step).toBe(1);
    expect(e.got).toBe('い-adjective');
  });

  it('nothing but plain-clause suffixes follows a past form', () => {
    expect(fails('食べる', ['past', 'masu']).code).toBe('wrong-state');
    expect(fails('食べる', ['neg', 'past', 'neg']).code).toBe('wrong-state');
    expect(fails('食べる', ['masu', 'past', 'neg']).code).toBe('wrong-state');
  });

  it('ます forms have no stem for たい or another ます', () => {
    expect(fails('食べる', ['masu', 'tai']).code).toBe('no-stem');
    expect(fails('食べる', ['masu', 'masu']).code).toBe('no-stem');
  });

  it('です after an い-adjective cannot take a tense', () => {
    const e = fails('食べる', ['tai', 'desu', 'past']);
    expect(e.code).toBe('no-stem');
    expect(e.message).toContain('Put tense and negation first');
  });

  it('a closed clause takes nothing', () => {
    expect(fails('食べる', ['te', 'te_iru']).code).toBe('closed-clause');
    expect(fails('食べる', ['volitional', 'neg']).code).toBe('closed-clause');
  });

  it('plain-clause suffixes reject polite forms', () => {
    expect(fails('食べる', ['masu', 'deshou']).code).toBe('constraint');
  });

  it('nouns and な-adjectives have no verb stems', () => {
    expect(fails('学生', ['tai']).code).toBe('type-mismatch');
    expect(fails('学生', ['ba']).code).toBe('type-mismatch');
    expect(fails('静か', ['masu']).code).toBe('type-mismatch');
  });

  it('unknown suffix and unknown word', () => {
    expect(fails('食べる', ['nonsense']).code).toBe('unknown-suffix');
    expect(() => compose('xyz', [])).toThrow(/Unknown word/);
  });

  it('apply() returns the output type on success', () => {
    const r = apply('tai', startForm('食べる'));
    expect(r.ok && r.type).toBe('i-adj');
  });

  it('the failing chain still reports the steps that succeeded', () => {
    const d = compose('食べる', ['causative', 'neg', 'tai']);
    expect(d.steps.map((s) => s.output.text)).toEqual(['食べさせる', '食べさせない']);
    expect(d.result).toBeUndefined();
  });
});

describe('declared constraints', () => {
  const db = {
    stems: engine.stems, irregulars: engine.irregulars, words: engine.words,
    suffixes: engine.suffixes.map((s) =>
      s.id === 'tai' ? { ...s, constraints: { polarity: 'pos' as const, tense: 'nonpast' as const } } : s),
  };
  const e = createEngine(db);

  it('rejects the wrong polarity and tense', () => {
    // 食べる → past → (state error comes first), so test polarity via a negative i-adj
    const neg = e.compose('食べる', ['neg']).result!;
    expect(e.apply('tai', { ...neg, type: 'verb', cls: 'ichidan' })).toMatchObject({ ok: false, error: { code: 'constraint' } });
    const past = { ...e.startForm('食べる'), tense: 'past' as const };
    expect(e.apply('tai', past)).toMatchObject({ ok: false, error: { code: 'constraint' } });
  });
});

// ------------------------------------------------------------------ data integrity

describe('data integrity', () => {
  const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
  const unique = (xs: string[]) => new Set(xs).size === xs.length;
  const lexiconIds = new Set([...ids(data.verbs), ...ids(data.predicates)]);

  it('ids are unique', () => {
    expect(unique(ids(data.verbs))).toBe(true);
    expect(unique(ids(data.predicates))).toBe(true);
    expect(unique(ids(data.suffixes))).toBe(true);
    expect(unique(ids(data.irregulars))).toBe(true);
    expect(unique([...ids(data.verbs), ...ids(data.predicates)])).toBe(true);
  });

  it('there is one stem entry per stem id', () => {
    expect(ids(data.stems).sort()).toEqual([...STEM_IDS].sort());
  });

  it('godan verbs end in a godan final, and ichidan verbs in る', () => {
    for (const v of data.verbs) {
      if (v.class === 'godan') expect(Object.keys(data.stems[0].rules.godan!)).toContain(v.kana.slice(-1));
      if (v.class === 'ichidan') expect(v.kana.endsWith('る'), v.id).toBe(true);
      if (v.class === 'suru') expect(v.kana.endsWith('する'), v.id).toBe(true);
    }
  });

  it('godan rules cover all nine finals for every verb stem', () => {
    for (const id of VERB_STEMS) {
      const rules = data.stems.find((s) => s.id === id)!.rules.godan!;
      expect(Object.keys(rules).sort(), id).toEqual(['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'].sort());
    }
  });

  it('stem exceptions and irregular rows agree', () => {
    const irrIds = new Set(ids(data.irregulars));
    for (const s of data.stems) {
      for (const ex of s.exceptions) expect(irrIds.has(ex), `${s.id} → ${ex}`).toBe(true);
    }
    for (const row of data.irregulars.filter((r) => r.target !== 'form')) {
      for (const st of row.stems ?? []) {
        expect(data.stems.find((s) => s.id === st)!.exceptions, `${row.id} listed on ${st}`).toContain(row.id);
      }
    }
  });

  it('irregular rows point at real verbs and suffixes', () => {
    const suffixIds = new Set(ids(data.suffixes));
    for (const row of data.irregulars) {
      for (const v of row.match.verbs ?? []) expect(lexiconIds.has(v), `${row.id} → ${v}`).toBe(true);
      if (row.suffix) expect(suffixIds.has(row.suffix), `${row.id} → ${row.suffix}`).toBe(true);
    }
  });

  it('suffix cross-references resolve', () => {
    const suffixIds = new Set(ids(data.suffixes));
    for (const s of data.suffixes) {
      for (const r of s.related ?? []) expect(suffixIds.has(r), `${s.id} related ${r}`).toBe(true);
      if (s.aux_verb) expect(lexiconIds.has(s.aux_verb), `${s.id} aux ${s.aux_verb}`).toBe(true);
    }
  });

  it('every suffix example has a kana reading', () => {
    for (const s of data.suffixes) {
      for (const ex of s.examples) {
        expect(/^[\u3040-\u30ffー、。！？…\s]+$/.test(ex.reading), `${s.id}: ${ex.reading}`).toBe(true);
      }
    }
  });

  it('every suffix has usage notes and at least one comparison, and comparisons resolve', () => {
    const suffixIds = new Set(ids(data.suffixes));
    for (const s of data.suffixes) {
      expect(s.usage?.length, `${s.id} usage`).toBeGreaterThan(0);
      expect(s.compare?.length, `${s.id} compare`).toBeGreaterThan(0);
      for (const c of s.compare) {
        if (c.id) expect(suffixIds.has(c.id), `${s.id} compares with ${c.id}`).toBe(true);
        expect(c.id || c.label, s.id).toBeTruthy();
      }
    }
  });

  it('lexicon readings are kana', () => {
    const words = wordsFromLexicon({ verbs: data.verbs, predicates: data.predicates });
    for (const w of words) expect(/^[぀-ゟ]+$/.test(w.kana), `${w.id}: ${w.kana}`).toBe(true);
  });

  it('the lexicon covers every class and every irregular', () => {
    const classes = new Set(data.verbs.map((v) => v.class));
    expect([...classes].sort()).toEqual(['godan', 'ichidan', 'kuru', 'suru']);
    const finals = new Set(data.verbs.filter((v) => v.class === 'godan').map((v) => v.kana.slice(-1)));
    expect([...finals].sort()).toEqual(['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'].sort());
    for (const id of ['iku', 'aru', 'tou', 'irassharu', 'nasaru', 'kudasaru', 'ossharu', 'gozaru']) {
      expect(ids(data.verbs)).toContain(id);
    }
    expect(data.verbs.length).toBeGreaterThanOrEqual(40);
  });
});
