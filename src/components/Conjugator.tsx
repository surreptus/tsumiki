// The only hydrated component. Pick a word, click suffixes in order, see the derivation as a
// chain of blocks; invalid compositions show the error at the step that fails.
import { useMemo, useState } from 'preact/hooks';
import { ERROR_LABELS, TYPE_SHORT, apply, compose, engine } from '../lib/conjugate';

const Ja = ({ text, class: cls }: { text: string; class?: string }) => (
  <span class={`ja${cls ? ` ${cls}` : ''}`} lang="ja">{text}</span>
);

// Each group: where its endings attach, as a plain label with the traditional name beside it.
const GROUPS: [string, string, string?][] = [
  ['renyokei', 'After the ます-stem', '連用形'], ['mizenkei', 'After the ない-stem', '未然形'],
  ['ishikei', 'After the う-stem', '意志形'], ['kateikei', 'After the ば-stem', '仮定形'],
  ['meireikei', 'Command', '命令形'], ['te_stem', 'After the て-form', 'て形'], ['ta_stem', 'After the た-form', 'た形'],
  ['gokan', 'After an adjective stem', '語幹'],
  ['dictionary', 'After the dictionary form'], ['plain-clause', 'After a plain sentence'],
];

const WORD_GROUPS: [string, (w: (typeof engine.words)[number]) => boolean][] = [
  ['Verbs', (w) => w.type === 'verb'],
  ['Adjectives', (w) => w.type === 'i-adj' || w.type === 'na-adj'],
  ['Nouns', (w) => w.type === 'noun'],
];

export default function Conjugator({ initialWord = 'taberu', initialChain = [] as string[] }) {
  const [wordId, setWordId] = useState(initialWord);
  const [chain, setChain] = useState<string[]>(initialChain);

  const derivation = useMemo(() => compose(wordId, chain), [wordId, chain]);
  const current = derivation.result ?? derivation.steps.at(-1)?.output ?? derivation.start;
  const error = derivation.error;

  // Which suffixes would type-check as the next step, to dim the rest (still clickable).
  const nextOk = useMemo(() => {
    if (error) return new Set<string>();
    return new Set(engine.suffixes.filter((s) => apply(s.id, current).ok).map((s) => s.id));
  }, [current, error]);

  const label = (id: string) => {
    const s = engine.suffixes.find((x) => x.id === id)!;
    return s.display ?? s.written ?? (s.form || s.romaji);
  };
  // past(neg(tai(...)))
  const notation = derivation.steps.reduce((inner, st) => `${st.suffixId}(${inner})`, derivation.start.text);
  const typeLabel = (t: keyof typeof TYPE_SHORT, past: boolean) => `${TYPE_SHORT[t]}${past ? ' · past' : ''}`;

  return (
    <div class="conjugator">
      <label class="conj-field">
        <span>Start with</span>
        <select
          value={wordId}
          onChange={(e) => {
            setWordId((e.currentTarget as HTMLSelectElement).value);
            setChain([]);
          }}
        >
          {WORD_GROUPS.map(([name, test]) => (
            <optgroup label={name}>
              {engine.words.filter(test).map((w) => (
                <option value={w.id}>
                  {w.kanji}{w.kanji !== w.kana ? `（${w.kana}）` : ''} — {w.meaning}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div class="derivation" role="status" aria-live="polite">
        <pre class="code-block" tabIndex={0} aria-label="Composition in function notation">
          <code>
            <span class="code-notation">
              {notation}{error && ` → ${chain[error.step]}(…)`}
            </span>
            {error ? (
              <>{'\n'}<span class="code-error">// error at step {error.step + 1} ({chain[error.step]}), see below</span></>
            ) : (
              derivation.steps.length > 0 && (
                <>{'\n'}<span class="code-comment">= {current.text}   // {typeLabel(current.type, current.state === 'past')}</span></>
              )
            )}
          </code>
        </pre>

        <div class="derivation-table" tabIndex={0} role="region" aria-label="Derivation steps">
          <table>
            <thead>
              <tr><th>#</th><th>Function</th><th>Attaches to</th><th>Result</th><th>Type</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td><td><em>start</em></td><td>—</td>
                <td><Ja text={derivation.start.text} /></td>
                <td><span class={`type-chip type-${derivation.start.type}`}>{typeLabel(derivation.start.type, false)}</span></td>
              </tr>
              {derivation.steps.map((s) => (
                <tr>
                  <td>{s.index + 1}</td>
                  <td><code>{s.suffixId}</code></td>
                  <td>
                    {s.stem
                      ? <><Ja text={s.stem.surface.text} /> <small>({s.stem.id})</small></>
                      : <small>whole form</small>}
                  </td>
                  <td><Ja text={s.output.text} /></td>
                  <td><span class={`type-chip type-${s.output.type}`}>{typeLabel(s.output.type, s.output.state === 'past')}</span></td>
                </tr>
              ))}
              {error && (
                <tr class="derivation-error" role="alert">
                  <td>{error.step + 1}</td><td><code>{chain[error.step]}</code></td>
                  <td colspan={3}><strong>{ERROR_LABELS[error.code]}</strong> {error.message} Click Undo, then try a different ending.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {derivation.steps.some((s) => s.warnings.length > 0) && (
          <ul class="derivation-warnings">
            {derivation.steps.flatMap((s) => s.warnings).map((w) => <li>{w}</li>)}
          </ul>
        )}
      </div>

      <div class="conj-actions">
        <button type="button" disabled={chain.length === 0} onClick={() => setChain(chain.slice(0, -1))}>Undo</button>
        <button type="button" disabled={chain.length === 0} onClick={() => setChain([])}>Clear</button>
      </div>

      <div class="conj-palette">
        {GROUPS.map(([attach, name, ja]) => {
          const items = engine.suffixes.filter((s) => s.attaches_to === attach);
          return (
            <fieldset>
              <legend>{name}{ja && <> <span lang="ja">{ja}</span></>}</legend>
              {items.map((s) => (
                <button
                  type="button"
                  class={nextOk.has(s.id) ? 'conj-ok' : 'conj-dim'}
                  data-suffix={s.id}
                  title={s.meaning}
                  onClick={() => setChain([...chain, s.id])}
                >
                  <span lang="ja">{label(s.id)}</span>
                  <small>{s.short}</small>
                  {!nextOk.has(s.id) && <span class="sr-only"> (would not work as the next step)</span>}
                </button>
              ))}
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
