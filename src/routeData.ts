// Page titles and descriptions for search results and link previews.
// Ending pages have Japanese-only titles (ば, たい), so <title> and the description add the English
// meaning; link-preview titles read best at 30-60 characters.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { stems, suffixes } from './lib/data';

const SITE = '積み木';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const title = route.entry.data.title;

  const suffix = route.id.startsWith('reference/suffixes/')
    ? suffixes.find((s) => s.id === route.id.split('/').pop())
    : undefined;
  let pageTitle: string | undefined;
  let description: string | undefined;
  if (suffix) {
    const stem = stems.find((s) => s.id === suffix.attaches_to);
    const where = stem ? `the ${stem.label.replace(/^The /, '')} (${stem.name})` : suffix.attaches_to === 'dictionary' ? 'the dictionary form' : 'a plain sentence';
    pageTitle = `${title} (${suffix.short}): Japanese ending | ${SITE}`;
    description = `${title}, "${suffix.short}": ${suffix.meaning} How it attaches to ${where}, what kind of word it gives, examples and look-alikes.`;
  }

  const candidates = [`${title} · 積み木 Functional Japanese Grammar`, `${title} · 積み木`, title];
  const ogTitle = suffix ? `${title} (${suffix.short}) · 積み木 Japanese endings` : candidates.find((c) => c.length >= 30 && c.length <= 60) ?? title;

  route.head = route.head.map((tag) => {
    if (tag.tag === 'title' && pageTitle) return { ...tag, content: pageTitle };
    if (tag.tag !== 'meta') return tag;
    const key = tag.attrs?.property ?? tag.attrs?.name;
    if (key === 'og:title') return { ...tag, attrs: { ...tag.attrs, content: ogTitle } };
    if (description && (key === 'description' || key === 'og:description')) return { ...tag, attrs: { ...tag.attrs, content: description } };
    if (key === 'og:type' && route.id === '') return { ...tag, attrs: { ...tag.attrs, content: 'website' } };
    return tag;
  });
});
