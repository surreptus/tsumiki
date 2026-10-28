// Link-preview titles read best at 30-60 characters, and many page titles (ば, たい) are shorter.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const title = route.entry.data.title;
  const candidates = [`${title} · 積み木 Functional Japanese Grammar`, `${title} · 積み木`, title];
  const value = candidates.find((c) => c.length >= 30 && c.length <= 60) ?? title;
  route.head = route.head.map((tag) =>
    tag.tag === 'meta' && tag.attrs?.property === 'og:title' ? { ...tag, attrs: { ...tag.attrs, content: value } } : tag,
  );
});
