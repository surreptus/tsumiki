# Content plan

Phase 1 (scaffold, data model, engine) is done. This file is the agreed inventory for Phase 2 and
Phase 3. Items marked **new** were added after comparing against Genki I and II.

## Phase 2 progress

Batches 1 and 2 are written: 98 suffix pages, each with at least three examples, usage notes and comparisons, plus the composition rules page (layer table and mnemonics).

Engine work done for batch 2: a sixth type, `adverb`; suffixes that attach to 語幹 (adjective and noun predicates); a `prefix` field and honorific/humble whole-form irregulars (お〜になる, お〜する); `display` names; a sentence-level か that covers ませんか and ましょうか.

Still to do:

- **Prose pass:** the stem pages, the irregulars page intro, and a native-speaker review of every `usage` and `compare` note.
- **Small gaps:** closed. ばかり "only", の後に and の後で are now noun-attaching suffixes on the plain-clause attach point. Hearsay そうだ has no past form, so there is nothing to add.
- **Guides (Phase 3):** Particles, sentence-ending particles, keigo, casual speech, clauses and special expressions written. All six guides are drafted, plus a Conditionals guide (と, ば, たら, なら).

## Phase 2: suffix inventory, grouped by attach point

Each suffix gets at least three examples, plus `usage` notes (nuance, restrictions, common mistakes) and `compare` entries (how it differs from the forms learners confuse it with). All 41 seeded suffixes already have both. `seeded` means it already exists in `src/data/suffixes/`.

### 連用形 (renyokei)
ます (seeded), たい (seeded), ながら (seeded), やすい / にくい (seeded), すぎる (seeded),
方 (seeded), お〜になる / お〜する, **new:** に行く / に来る (purpose), そう (appearance; also on adjective stems),
たがる, 始める / 続ける / 終わる, なさい (soft command)

### 未然形 (mizenkei)
ない (seeded), れる / られる (seeded), せる / させる (seeded), ず / ずに (seeded),
**new:** ないで, なければならない / なければいけない, なくてはいけない

### 意志形 (ishikei)
う / よう (seeded), **new:** ようと思う

### 仮定形 (kateikei)
ば (seeded)

### て-form (te_stem)
て (seeded), いる (seeded), ある (seeded), おく (seeded), しまう (seeded), みる (seeded), いく / くる (seeded),
あげる / くれる / もらう, はいけない, もいい, から,
**new:** ください, ても, ほしい, いただく / いただける (keigo requests), ところ (now doing)

### た-form (ta_stem)
ら (seeded), ことがある (seeded), ほうがいい (seeded), り, ばかり,
**new:** 後で / 後に, ところ (just did)

### Dictionary form
こと / の, つもり (seeded), ために (seeded), 前に (seeded), と (seeded), ことができる (seeded), べき, な (seeded),
**new:** ように, ようになる, ようにする, ことにする, ことになる, ところ (about to), まで / までに, うちに

### Plain clause
でしょう (seeded), だろう, かもしれない (seeded), らしい (seeded), そうだ (hearsay), はずだ, わけだ,
のに (seeded), から (seeded), けど (seeded), **new:** ので, し, なら, みたい / ようだ

### Adjective, な-adjective and noun predicates (composition-rules page)
くない / かった / くて, じゃない / だった / で, です / でした (partly seeded),
**new:** adverbial く / に, くなる / になる / くする / にする (change), さ (nominalizer), plain copula だ

## Engine work the new items imply

- **ませんか / ましょうか** (invitations, offers): add to the ます paradigm as sentence-level forms.
- **なければならない and friends:** decide whether they are compositions (`neg` → `ba` + a fixed expression)
  or single suffixes on the 未然形. Current lean: single suffixes, because the pieces are not productive.
- **そう (appearance)** needs variants on 連用形 (verbs) and 語幹 (adjectives), same mechanism as すぎる.
- **くなる / になる** attach to 語幹 and 連用形 of adjectives; check against the existing `neg` variants.
- **Multiple readings of one surface** (ところ, そう): one suffix id per meaning, sharing a kana form.

## Phase 3: Guides

Each guide opens with a note on where the function model stops. Additions from the Genki comparison are marked **new**.

1. **Particles:** は vs が, に vs で, and the rest of Tae Kim's particle chapters.
2. **Sentence-ending and discourse particles:** んだ / の, ね, よ, だろう, じゃない.
3. **Keigo:** morphology (brief, see Reference) and usage (long).
4. **Casual speech and contractions:** ちゃう, とく, てる, なきゃ, etc.
5. **Relative clauses, nominalization, quotation:** **new:** と思う / と言う, とき, 間, quotation of requests.
6. **Special expressions:** the rest of Tae Kim's special expressions, plus **new:**
   comparison (より, ほうが, 一番, の中で), giving and receiving usage (あげる / くれる / もらう in context),
   transitive and intransitive verb pairs (a lexical table, since the pairs are not rule-governed).

## Explicitly out of scope

Genki content that is neither compositional nor in Tae Kim: numbers, counters, dates and time,
こそあど demonstratives, question words, frequency adverbs, location words, katakana, kanji and
situational dialogues. If you later want them, a short "Basics" section is the natural home.
