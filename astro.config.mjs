// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import preact from '@astrojs/preact';
import { rehypeBase } from './src/lib/rehype-base.mjs';

// GitHub Pages project site: https://surreptus.github.io/tsumiki/. Override with SITE and BASE for a custom domain.
const site = process.env.SITE ?? 'https://surreptus.github.io';
const base = process.env.BASE ?? '/tsumiki';

const suffixGroups = [
  ['renyokei', '連用形 · Renyōkei'],
  ['mizenkei', '未然形 · Mizenkei'],
  ['ishikei', '意志形 · Ishikei'],
  ['kateikei', '仮定形 · Kateikei'],
  ['meireikei', '命令形 · Meireikei'],
  ['te_stem', 'て-form'],
  ['ta_stem', 'た-form'],
  ['gokan', '語幹 · Gokan'],
  ['dictionary', 'Dictionary form'],
  ['plain-clause', 'Plain clause'],
];

export default defineConfig({
  site,
  base,
  markdown: { rehypePlugins: [[rehypeBase, { base }]] },
  integrations: [
    preact(),
    starlight({
      title: '積み木 · Functional Japanese',
      description:
        'A Japanese grammar guide that models verb and adjective morphology as typed function composition.',
      customCss: [
        '@fontsource/zen-maru-gothic/400.css',
        '@fontsource/zen-maru-gothic/700.css',
        '@fontsource/jetbrains-mono/latin-400.css',
        '@fontsource/jetbrains-mono/latin-700.css',
        './src/styles/custom.css',
      ],
      head: [{ tag: 'script', attrs: { src: `${base}/a11y.js`, defer: true } }],
      lastUpdated: false,
      sidebar: [
        { label: 'Overview', items: [{ autogenerate: { directory: 'overview' } }] },
        {
          label: 'Reference',
          items: [
            { label: 'Stems', items: [{ autogenerate: { directory: 'reference/stems' } }] },
            {
              label: 'Suffixes by stem',
              items: suffixGroups.map(([dir, label]) => ({
                label,
                collapsed: true,
                items: [{ autogenerate: { directory: `reference/suffixes/${dir}` } }],
              })),
            },
            { label: 'Composition rules', slug: 'reference/composition-rules' },
            { label: 'Irregulars', slug: 'reference/irregulars' },
            { label: 'Conjugator', slug: 'reference/conjugator' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Particles', slug: 'guides/particles' },
            { label: 'Sentence-ending and discourse particles', slug: 'guides/sentence-ending-particles' },
            { label: 'Keigo', slug: 'guides/keigo' },
            { label: 'Casual speech and contractions', slug: 'guides/casual-speech' },
            { label: 'Relative clauses, nominalization, quotation', slug: 'guides/clauses' },
            { label: 'Conditionals', slug: 'guides/conditionals' },
            { label: 'Special expressions', slug: 'guides/special-expressions' },
          ],
        },
        {
          label: 'About',
          items: [
            { label: 'Acknowledgements and license', slug: 'acknowledgements' },
            { label: 'Privacy and terms of use', slug: 'privacy-and-terms' },
          ],
        },
      ],
    }),
  ],
});
