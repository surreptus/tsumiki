// How a suffix is named in titles, tables and links.
import type { SuffixData } from './schemas';

const ZERO_FORM_NAMES: Record<string, string> = { te: 'て形', past: 'た形', imperative: '命令形' };

/** `display` wins, then the conventional spelling, then the kana form; zero suffixes get their form's name. */
export const suffixName = (s: Pick<SuffixData, 'id' | 'form' | 'written' | 'display'>) =>
  ZERO_FORM_NAMES[s.id] ?? s.display ?? s.written ?? s.form;
