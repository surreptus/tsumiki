// Markdown links are written as site-absolute paths (/guides/particles/). On a project site
// (https://user.github.io/repo/) they need the base path in front, so add it at build time.
export function rehypeBase({ base }) {
  const prefix = base.replace(/\/$/, '');
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties?.href;
      if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(prefix + '/')) {
        node.properties.href = prefix + href;
      }
    }
    node.children?.forEach(walk);
  };
  return (tree) => walk(tree);
}
