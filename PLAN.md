# Content plan

This file holds the status, the roadmap and the content inventory for Phases 2 and 3, now written. Items marked **new** were added after comparing against Genki I and II.

## Status

Phases 1 to 4 are written and live at https://surreptus.github.io/tsumiki/. Remaining work is review and feedback, not writing.

- **Phase 1:** scaffold, data model and conjugation engine.
- **Phase 2:** 101 suffix pages (three or more examples each, plus usage notes and comparisons), the stem pages, the composition rules and the irregulars. Engine additions: the `adverb` type, 語幹-attached suffixes, the `prefix` field with honorific and humble irregulars, `display` names, a sentence-level か, and noun-attached ばかり, の後に and の後で. Hearsay そうだ has no past form, so there is nothing to add.
- **Phase 3:** seven guides: particles, sentence-ending particles, keigo, casual speech, clauses, special expressions and conditionals.
- **Phase 4:** learner aids and publishing. A find-by-meaning index, a common-mistakes page (chain errors checked by the engine at build time), a printable cheat sheet, a page on using the site beside a course, and a home-page notice that the Japanese is unreviewed. Also GitHub Pages deploy, search, social preview image, `robots.txt`, a "report a mistake" link on every page, per-page last-updated dates, a changelog, print styles, a privacy and terms page, contributing notes and issue templates, CI checks for links and accessibility, and a copy-paste AI tutor prompt on every ending, stem and guide page.

## Roadmap

**Now: review.** Nothing below should start before this.

- **Native-speaker review** of every example and every `usage` and `compare` note, and of the guides. Corrections arrive through the issue forms and are listed in the changelog.
- **Learner feedback:** a few learners with no programming background read the idea page cold, and say where they stall.

**Next: after review.**

- **Kikimi link:** a mapping from MeCab/IPADIC tokens to Tsumiki page ids.
- **Accessibility re-check** after any large content change: axe in both themes, and the conjugator's dimmed buttons in the light theme, where the dashed outline is the main cue.

**Later: only if the feedback supports it.**

- **Practice app** in a separate repository: build the form, find the broken step, take a form apart, with progress kept in the browser. For now the copy-paste tutor prompt on every page covers practice, and it works well. Build an app only if learners ask for something the prompt cannot give, such as progress tracking or drills that do not depend on an outside AI service. It would need the engine and data split into a shared package first. Decision, 28 October 2026: wait for learner feedback.
- **Spanish:** a draft sketch of compound tenses and pronouns that attach to verbs is in `drafts/spanish-prototype.md`. Judge it after review. If it goes ahead it needs its own data model and native review.

**Open questions.**

- The engine accepts causative after passive (食べられさせる), though the composition rules say you cannot go backwards. Decide with the reviewer whether that should be an error.
- JLPT level tags were left out deliberately: they would be useful for filtering, but a wrong level is worse than none.

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
7. **Conditionals:** と, ば, たら and なら compared.

## Explicitly out of scope

Genki content that is neither compositional nor in Tae Kim: numbers, counters, dates and time,
こそあど demonstratives, question words, frequency adverbs, location words, katakana, kanji and
situational dialogues. If you later want them, a short "Basics" section is the natural home.
