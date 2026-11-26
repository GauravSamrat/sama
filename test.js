const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const site = require('./studio');
const { build, render, langs, routes } = require('./build');
const { serve } = require('./server');
const dist = path.join(__dirname, 'dist');
build();

test('all generated pages contain static localized text, navigation and share metadata', () => {
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
    for (const [, target] of html.matchAll(/(?:href|src|srcset)="(\/[^"]+)"/g)) {
      const href = new URL(target, 'https://test.invalid').pathname;
      assert.ok(fs.existsSync(path.join(dist, href, href.endsWith('/') ? 'index.html' : '')), href);
    }
    assert.equal([...html.matchAll(/data-language=/g)].length, 6);
  }
});

test('product structured data, verified actions and disabled checkout', () => {
  for (const p of site.products) {
    const html = render('en', p.id);
    const schema = JSON.parse(html.match(/application\/ld\+json">(.*?)<\/script>/)[1]);
    assert.equal(schema['@type'], 'SoftwareApplication');
    assert.equal(schema.softwareVersion, p.version);
    for (const [key, text] of [['launch', 'Open app'], ['download', 'Download']]) {
      if (p[key]) assert.ok(html.includes('href="' + p[key] + '"'), p.id + ' ' + key);
      else assert.ok(!html.includes('>' + text + '</a>'), p.id + ' unexpected ' + key);
    }
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
    const drafts = site.editorialPreview ? require('./locales/journal').filter(article => !article.reviewed).length : 0;
    assert.equal([...sitemap.matchAll(/<loc>https:\/\/studio\.example\//g)].length, (routes.length - drafts) * langs.length);
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
  assert.doesNotMatch(js, /innerHTML|outerHTML|document\.write|XMLHttpRequest|geolocation|document\.cookie/);
  assert.deepEqual([...js.matchAll(/fetch\((\w+)/g)].map(match => match[1]), ['endpoint']);
  assert.match(js, /textContent/);
  assert.match(fs.readFileSync(path.join(dist, 'styles.css'), 'utf8'), /prefers-reduced-motion/);
  for (const file of fs.readdirSync(dist, { recursive: true })) {
    if (!/\.(html|js|css|txt|svg)$/.test(file)) continue;
    const content = fs.readFileSync(path.join(dist, file), 'utf8');
    assert.doesNotMatch(content, /BEGIN (?:RSA |EC )?PRIVATE KEY|sk_live_[a-z0-9]+|ghp_[a-z0-9]{20,}/i);
    assert.doesNotMatch(content, /<(?:iframe|script)[^>]+src="https:/);
  }
});

test('Abundance articles render, and pending channels and delivery stay inactive', () => {
  for (const lang of langs) {
    const index = render(lang, 'journal');
    assert.match(index, /og:site_name" content="Abundance/);
    for (const article of require('./locales/journal').filter(article => article.reviewed || site.editorialPreview)) {
      assert.ok(index.includes('/' + lang + '/journal/' + article.id + '/'));
      const page = render(lang, 'journal/' + article.id);
      assert.match(page, /og:type" content="article/);
      if (!article.reviewed) assert.match(page, /name="robots" content="noindex/);
    }
    const form = render(lang, 'listen');
    assert.match(form, /data-endpoint=""/);
    assert.doesNotMatch(form, /data-send| checked(?:=|>)/);
    const community = render(lang, 'community');
    for (const channel of site.community.filter(channel => !channel.enabled)) {
      assert.ok(!community.includes('>' + channel.label + '</a>'));
    }
  }
});

test('core light and dark text combinations meet the 4.5:1 WCAG target', () => {
  const css = fs.readFileSync(path.join(dist, 'styles.css'), 'utf8');
  const palette = (pattern) => Object.fromEntries([...css.match(pattern)[1].matchAll(/--([\w-]+):\s*#([a-f0-9]{6})/g)]
    .map(match => [match[1], match[2]]));
  const luminance = hex => hex.match(/../g).map(pair => parseInt(pair, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
    .reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
  for (const theme of [palette(/:root \{([^}]+)}/), palette(/:root\[data-theme="dark"\] \{([^}]+)}/)]) {
    const pairs = ['canvas','panel','citta','sahaja','council'].flatMap(background =>
      ['ink','muted','accent'].map(foreground => [background, foreground])).concat([['green','on-green']]);
    for (const [a, b] of pairs) {
      const [low, high] = [luminance(theme[a]), luminance(theme[b])].sort((x, y) => x - y);
      assert.ok((high + .05) / (low + .05) >= 4.5, a + ' / ' + b);
    }
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
