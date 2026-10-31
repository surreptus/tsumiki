import type { Attach, StemId } from './schemas';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** URLs use hyphens where ids use underscores (te_stem is /te-stem/). */
export const slug = (id: string) => id.replace(/_/g, '-');

/** Suffix pages live at reference/suffixes/<attach point>/<id>/. */
export const suffixHref = (s: { id: string; attaches_to: Attach }) =>
  `${base}/reference/suffixes/${slug(s.attaches_to)}/${slug(s.id)}/`;

export const stemHref = (id: StemId) => `${base}/reference/stems/${slug(id)}/`;
export const irregularsHref = (id?: string) => `${base}/reference/irregulars/${id ? `#${id}` : ''}`;
