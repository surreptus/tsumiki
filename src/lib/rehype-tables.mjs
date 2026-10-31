// Wraps each Markdown table in a scroll box, so a wide table scrolls sideways on a phone instead of
// breaking Japanese words mid-word or widening the page. The box is focusable so keyboard users can
// scroll it, and is named after its column headings so screen readers can tell the regions apart.
const text = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(text).join(''));

export function rehypeTables() {
  return (tree) => {
    let count = 0;
    const walk = (node) => {
      node.children = node.children?.map((child) => {
        if (child.type !== 'element' || child.tagName !== 'table') {
          walk(child);
          return child;
        }
        count++;
        const headings = [];
        const findTh = (n) => {
          if (n.type === 'element' && n.tagName === 'th') headings.push(text(n).trim());
          else n.children?.forEach(findTh);
        };
        findTh(child);
        const label = `Table ${count}${headings.length ? `: ${headings.filter(Boolean).join(', ')}` : ''}`;
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll', 'md-table'], tabIndex: 0, role: 'region', ariaLabel: label },
          children: [child],
        };
      });
    };
    walk(tree);
  };
}
