const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { langs } = require('./build');
const root = path.resolve(__dirname, 'dist');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp',
  '.avif': 'image/avif', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt'
};

function serve(port = 8081) {
  return http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end(); return; }
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(400).end();
      return;
    }
    if (fs.statSync(file, { throwIfNoEntry: false })?.isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(308, { Location: encodeURI(pathname) + '/' }).end();
        return;
      }
      file = path.join(file, 'index.html');
    }
    let status = 200;
    if (!types[path.extname(file)] || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
      status = 404;
      const lang = pathname.split('/')[1];
      file = path.join(root, langs.includes(lang) ? lang : '', '404.html');
    }
    res.writeHead(status, { 'Content-Type': types[path.extname(file)], 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file).pipe(res);
  }).listen(port, '127.0.0.1');
}

if (require.main === module) {
  const port = Number(process.env.SAMA_PORT || 8081);
  const server = serve(port);
  server.once('error', error => {
    console.error(error.code === 'EADDRINUSE'
      ? 'SAMA port ' + port + ' is in use. Set SAMA_PORT to a free localhost port and retry.'
      : error.message);
    process.exitCode = 1;
  });
  server.once('listening', () => console.log('Local http://127.0.0.1:' + server.address().port + '/'));
}
module.exports = { serve };
