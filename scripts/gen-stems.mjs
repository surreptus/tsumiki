// One-off generator for src/data/stems/*.json. The JSON files are the source of truth
// afterwards; edit them directly.
import { writeFileSync, mkdirSync } from 'node:fs';

const finals = ['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'];
const row = (kana) => Object.fromEntries(finals.map((f, i) => [f, { drop: 1, add: kana[i] }]));
const R = (drop, add, reading) => (reading ? { drop, add, reading } : { drop, add });

const te = (suf, voiced) => ({
  う: `っ${suf}`, く: `い${suf}`, ぐ: `い${voiced}`, す: `し${suf}`, つ: `っ${suf}`,
  ぬ: `ん${voiced}`, ぶ: `ん${voiced}`, む: `ん${voiced}`, る: `っ${suf}`,
});
const teRow = (suf, voiced) => Object.fromEntries(
  Object.entries(te(suf, voiced)).map(([k, v]) => [k, { drop: 1, add: v }]));

const stems = [
  {
    id: 'renyokei', name: '連用形', romaji: "ren'yōkei", label: 'Stem (the ます-stem)', order: 1,
    description: 'The form that sits in front of ます, たい, ながら and the other "continuing" suffixes. Godan verbs shift the final sound to the い-row; ichidan verbs just drop る.',
    rules: {
      ichidan: R(1, ''), godan: row(['い', 'き', 'ぎ', 'し', 'ち', 'に', 'び', 'み', 'り']),
      suru: R(2, 'し'), kuru: R(1, '', { drop: 2, add: 'き' }),
      'i-adj': R(1, 'く'),
    },
    exceptions: ['honorific-renyokei', 'gozaru-renyokei'],
  },
  {
    id: 'mizenkei', name: '未然形', romaji: 'mizenkei', label: 'Negative stem (the ない-stem)', order: 2,
    description: 'The form that sits in front of ない, せる/させる, れる/られる and ず. Godan verbs shift to the あ-row (う becomes わ); ichidan verbs drop る.',
    rules: {
      ichidan: R(1, ''), godan: row(['わ', 'か', 'が', 'さ', 'た', 'な', 'ば', 'ま', 'ら']),
      suru: R(2, 'し'), kuru: R(1, '', { drop: 2, add: 'こ' }),
      masu: R(1, 'せ'),
    },
    exceptions: ['suru-passive', 'suru-causative', 'suru-zu'],
  },
  {
    id: 'ishikei', name: '意志形', romaji: 'ishikei', label: 'Volitional stem (the おう-stem)', order: 3,
    description: 'The form that sits in front of う/よう ("let\'s …"). Godan verbs shift to the お-row; ichidan verbs drop る and take よう. Traditional grammars file this under 未然形; this guide separates it because the godan stem differs.',
    rules: {
      ichidan: R(1, ''), godan: row(['お', 'こ', 'ご', 'そ', 'と', 'の', 'ぼ', 'も', 'ろ']),
      suru: R(2, 'し'), kuru: R(1, '', { drop: 2, add: 'こ' }),
      masu: R(1, 'しょ'),
    },
  },
  {
    id: 'kateikei', name: '仮定形', romaji: 'kateikei', label: 'Conditional stem (the ば-stem)', order: 4,
    description: 'The form that sits in front of ば. Godan verbs shift to the え-row; ichidan verbs replace る with れ. Also the base of the potential for godan verbs.',
    rules: {
      ichidan: R(1, 'れ'), godan: row(['え', 'け', 'げ', 'せ', 'て', 'ね', 'べ', 'め', 'れ']),
      suru: R(2, 'すれ'), kuru: R(1, 'れ'),
      'i-adj': R(1, 'けれ'),
    },
  },
  {
    id: 'meireikei', name: '命令形', romaji: 'meireikei', label: 'Command form', order: 5,
    description: 'The bare imperative. Godan verbs shift to the え-row; ichidan verbs replace る with ろ.',
    rules: {
      ichidan: R(1, 'ろ'), godan: row(['え', 'け', 'げ', 'せ', 'て', 'ね', 'べ', 'め', 'れ']),
      suru: R(2, 'しろ'), kuru: R(1, 'い', { drop: 2, add: 'こい' }),
    },
    exceptions: ['honorific-meireikei'],
  },
  {
    id: 'te_stem', name: 'て形', romaji: 'te-kei', label: 'て-form', order: 6,
    description: 'The complete て-form, sound changes included. Suffixes such as いる, しまう and おく attach to it. The sound change depends on the final kana of a godan verb.',
    rules: {
      ichidan: R(1, 'て'), godan: teRow('て', 'で'),
      suru: R(2, 'して'), kuru: R(1, 'て', { drop: 2, add: 'きて' }),
      'i-adj': R(1, 'くて'), 'na-adj': R(0, 'で'), noun: R(0, 'で'),
      masu: R(1, 'して'), masen: R(0, 'で'),
    },
    exceptions: ['iku-te', 'tou-te'],
  },
  {
    id: 'ta_stem', name: 'た形', romaji: 'ta-kei', label: 'た-form (plain past)', order: 7,
    description: 'The complete た-form, which is also the plain past tense. It follows exactly the same sound changes as the て-form.',
    rules: {
      ichidan: R(1, 'た'), godan: teRow('た', 'だ'),
      suru: R(2, 'した'), kuru: R(1, 'た', { drop: 2, add: 'きた' }),
      'i-adj': R(1, 'かった'), 'na-adj': R(0, 'だった'), noun: R(0, 'だった'),
      masu: R(1, 'した'), masen: R(0, 'でした'), desu: R(2, 'でした'),
    },
    exceptions: ['iku-ta', 'tou-ta'],
  },
  {
    id: 'gokan', name: '語幹', romaji: 'gokan', label: 'Adjective stem', order: 8,
    description: 'The part of an adjective that stays put. For い-adjectives it is the word minus い; for な-adjectives and nouns it is the whole word.',
    rules: { 'i-adj': R(1, ''), 'na-adj': R(0, ''), noun: R(0, '') },
  },
];

mkdirSync('src/data/stems', { recursive: true });
for (const s of stems) writeFileSync(`src/data/stems/${s.id}.json`, JSON.stringify(s, null, 2) + '\n');
console.log(`wrote ${stems.length} stems`);
