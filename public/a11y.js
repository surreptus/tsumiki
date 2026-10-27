// Starlight's search button has aria-label="Search" but also shows the shortcut ("⌘ K"),
// so its accessible name does not contain its visible text (WCAG 2.5.3 Label in Name).
// Keep the name in sync with what is shown. The shortcut text is filled in by script, hence the observer.
(() => {
  const sync = () => {
    const btn = document.querySelector('button[data-open-modal]');
    if (!btn) return;
    const label = btn.innerText.replace(/\s+/g, ' ').trim();
    if (label && btn.getAttribute('aria-label') !== label) btn.setAttribute('aria-label', label);
  };
  const start = () => {
    sync();
    const btn = document.querySelector('button[data-open-modal]');
    if (btn) new MutationObserver(sync).observe(btn, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
