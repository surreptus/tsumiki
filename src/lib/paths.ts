import type { Attach, StemId } from './schemas';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Suffix pages live at reference/suffixes/<attach point>/<id>/. */
export const suffixHref = (s: { id: string; attaches_to: Attach }) =>
  `${base}/reference/suffixes/${s.attaches_to}/${s.id}/`;

export const stemHref = (id: StemId) => `${base}/reference/stems/${id}/`;
export const irregularsHref = (id?: string) => `${base}/reference/irregulars/${id ? `#${id}` : ''}`;
