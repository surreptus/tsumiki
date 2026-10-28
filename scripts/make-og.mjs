// Renders public/og.png (1200x630), the social preview image. Run: node scripts/make-og.mjs
import sharp from 'sharp';

const font = "'Hiragino Maru Gothic ProN', 'Zen Maru Gothic', 'Hiragino Sans', sans-serif";
const blocks = [
  ['食べる', '#bd93f9', 190],
  ['させ', '#8be9fd', 130],
  ['られ', '#8be9fd', 130],
  ['たく', '#50fa7b', 130],
  ['なかった', '#50fa7b', 220],
];
let x = 80;
const row = blocks
  .map(([t, c, w]) => {
    const g = `<rect x="${x}" y="400" width="${w}" height="96" rx="18" fill="${c}" fill-opacity="0.16" stroke="${c}" stroke-width="4"/>
<text x="${x + w / 2}" y="448" text-anchor="middle" dominant-baseline="central" font-size="44" fill="#f8f8f2">${t}</text>`;
    x += w + 28;
    return g;
  })
  .join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="${font}">
<rect width="1200" height="630" fill="#282a36"/>
<text x="80" y="150" font-size="120" font-weight="700" fill="#f8f8f2">積み木</text>
<text x="80" y="250" font-size="52" font-weight="700" fill="#50fa7b">Functional Japanese Grammar</text>
<text x="80" y="320" font-size="32" fill="#bfc2d6">Long verb and adjective forms are small pieces clicked together.</text>
${row}
<text x="80" y="570" font-size="26" fill="#bfc2d6">surreptus.github.io/tsumiki</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
