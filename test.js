const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const site = require('./studio');
const { build, render, langs, routes } = require('./build');
const { serve } = require('./server');
const dist = path.join(__dirname, 'dist');
build();

test('all 42 pages contain static localized text, navigation and share metadata', () => {
  for (const lang of langs) for (const route of routes) {
    const file = path.join(dist, lang, route, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, new RegExp('<html lang="' + lang + '">'));
    assert.equal([...html.matchAll(/<h1>/g)].length, 1);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /property="og:image"/);
    assert.match(html, /Content-Security-Policy/);
    assert.doesNotMatch(html, /undefined|\[object Object\]|Citta-Reader/);
    if (lang !== 'en') assert.match(html.split('<main')[1], lang === 'hi' ? /[\u0900-\u097f]/ : /[\u0980-\u09ff]/);
    for (const [, href] of html.matchAll(/(?:href|src|srcset)="(\/[^"]+)"/g)) {
      assert.ok(fs.existsSync(path.join(dist, href, href.endsWith('/') ? 'index.html' : '')), href);
    }
    assert.equal([...html.matchAll(/data-language=/g)].length, 6);
  }
});

test('product structured data and disabled commercial or release actions', () => {
  for (const p of site.products) {
    const html = render('en', p.id);
    const schema = JSON.parse(html.match(/application\/ld\+json">(.*?)<\/script>/)[1]);
    assert.equal(schema['@type'], 'SoftwareApplication');
    assert.equal(schema.softwareVersion, p.version);
    assert.doesNotMatch(html, />Open app<|>Download</);
  }
  assert.doesNotMatch(render('en', 'support'), />Open .*checkout</);
  assert.doesNotMatch(render('en', 'feedback'), /mailto:|Citta-Reader/);
  assert.match(render('en', 'feedback'), /sahaja\/issues/);
  assert.match(render('en', 'work'), /awaiting configuration/);
});

test('configured SEO generates canonical, hreflang and sitemap without publishing placeholders', () => {
  if (!site.origin) {
    assert.match(render('en', ''), /noindex/);
    assert.match(fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8'), /Disallow: \//);
  }
  const original = site.origin;
  const key = require.resolve('./build');
  try {
    site.origin = 'https://studio.example';
    delete require.cache[key];
    const production = require('./build');
    const html = production.render('bn', 'citta');
    assert.match(html, /rel="canonical" href="https:\/\/studio\.example\/bn\/citta\/"/);
    for (const lang of langs) assert.match(html, new RegExp('hreflang="' + lang + '".*?/' + lang + '/citta/'));
    production.build();
    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
    assert.equal([...sitemap.matchAll(/<loc>https:\/\/studio\.example\//g)].length, routes.length * langs.length);
  } finally {
    site.origin = original;
    delete require.cache[key];
    build();
  }
});

test('configured links escape attributes and privileged links require approval', () => {
  const product = site.products[0];
  try {
    product.launch = 'javascript:alert(1)';
    assert.throws(() => render('en', 'citta'), /Invalid public HTTPS/);
    product.launch = 'https://example.com/?a=1&b=2';
    assert.match(render('en', 'citta'), /a=1&amp;b=2/);
    site.payments.support = 'https://example.com/';
    assert.doesNotMatch(render('en', 'support'), /example\.com/);
  } finally {
    delete product.launch;
    site.payments.support = null;
  }
});

test('runtime uses safe DOM updates and no tracking or embedded credentials', () => {
  const js = fs.readFileSync(path.join(dist, 'app.js'), 'utf8');
  assert.doesNotMatch(js, /innerHTML|outerHTML|document\.write|fetch\(|XMLHttpRequest|geolocation|document\.cookie/);
  assert.match(js, /textContent/);
  assert.match(fs.readFileSync(path.join(dist, 'styles.css'), 'utf8'), /prefers-reduced-motion/);
  for (const file of fs.readdirSync(dist, { recursive: true })) {
    if (!/\.(html|js|css|txt|svg)$/.test(file)) continue;
    const content = fs.readFileSync(path.join(dist, file), 'utf8');
    assert.doesNotMatch(content, /BEGIN (?:RSA |EC )?PRIVATE KEY|sk_live_[a-z0-9]+|ghp_[a-z0-9]{20,}/i);
    assert.doesNotMatch(content, /<(?:iframe|script)[^>]+src="https:/);
  }
});

test('HTTP serves every localized route and localized 404s', async () => {
  const server = serve(0);
  try {
    if (!server.listening) await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.once('listening', resolve);
    });
    const host = 'http://127.0.0.1:' + server.address().port;
    for (const lang of langs) for (const route of routes) {
      const response = await fetch(host + '/' + lang + '/' + (route ? route + '/' : ''));
      assert.equal(response.status, 200);
      assert.match(await response.text(), new RegExp('<html lang="' + lang + '"'));
    }
    const missing = await fetch(host + '/bn/unknown/');
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /<html lang="bn"/);
  } finally { server.close(); }
});
