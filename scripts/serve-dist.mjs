// A tiny static server for dist/, mounted at the site's base path, so checks run against the built site.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain', '.pf_meta': 'application/octet-stream',
};

export const BASE = (process.env.BASE ?? '/tsumiki').replace(/\/$/, '');

export async function serve(dir = 'dist') {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!path.startsWith(`${BASE}/`) && path !== BASE) { res.writeHead(404).end(); return; }
    path = normalize(path.slice(BASE.length) || '/');
    if (path.endsWith('/')) path += 'index.html';
    const file = join(dir, path);
    try {
      if ((await stat(file)).isDirectory()) { res.writeHead(301, { Location: `${req.url}/` }).end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}
