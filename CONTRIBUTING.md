# Contributing

The most useful contribution is a correction. The Japanese on this site has not yet had a native-speaker review, so reports of wrong, unnatural or misleading examples and notes are very welcome.

## Report a mistake

Open an issue with the [wrong or unnatural Japanese](../../issues/new?template=wrong-japanese.yml) form. Give the page, the text, and what you think is correct. A short reason helps ("this is only used with a negative", "too formal for a friend").

Other reports:

- [Something is unclear](../../issues/new?template=unclear.yml): a page that lost you, and where.
- [Bug or accessibility problem](../../issues/new?template=bug.yml): the site or the conjugator misbehaves, or something is hard to read or use.

## Change the content

Content lives in two places:

- `src/data/` holds the stems, suffixes, verbs and irregulars as JSON. The engine reads these, so a change here changes the conjugator and the generated pages.
- `src/content/docs/` holds the written pages. The suffix pages are generated from the data with `node scripts/gen-suffix-pages.mjs`; edit the JSON, not the generated page.

Before opening a pull request:

```bash
npm ci
npm test
npm run build
npm run check:links
```

All must pass. `npm run check:a11y` runs an accessibility audit of every page in both themes; it needs a browser (`npx playwright-core install chromium` once) and takes about a minute and a half, and the deploy runs it too.

Keep the style of the surrounding text: short sentences, a plain table next to any notation, Japanese-only titles for suffixes, and no furigana.

## License

By contributing you agree that your work is released under [CC BY-SA 4.0](LICENSE), like the rest of the project. Please do not paste text from textbooks or other websites; write examples and explanations yourself.
