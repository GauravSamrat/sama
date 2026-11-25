const fs = require('node:fs');
const path = require('node:path');
const site = require('./studio');
const ui = require('./locales/ui');
const copy = require('./locales/pages');
const products = require('./locales/products');

const out = path.join(__dirname, 'dist');
const langs = Object.keys(site.languages);
const esc = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const url = (lang, route = '') => '/' + lang + '/' + (route ? route + '/' : '');
const slug = /^[a-z][a-z0-9-]*$/;
const host = site.origin ? new URL(site.origin) : null;
if (host && (host.protocol !== 'https:' || ![host.origin, host.origin + '/'].includes(site.origin))) {
  throw new Error('Set origin to the public HTTPS origin, with no path or credentials.');
}
const origin = host?.origin;
const sections = ['creations', 'guides', 'about', 'work', 'support', 'feedback', 'privacy'];
const routes = ['', ...sections, ...site.products.flatMap(p => [p.id, 'guides/' + p.id])];
const csp = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'";
const write = (file, value) => {
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
};

function https(value) {
  if (!value) return '';
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Invalid public HTTPS link');
  return parsed.href;
}

function asset(value) {
  if (!/^assets\/[\w/-]+\.[a-z0-9]+$/i.test(value) || !fs.existsSync(path.join(__dirname, value))) {
    throw new Error('Missing or invalid asset: ' + value);
  }
  return '/' + value;
}

function link(href, label, cls = '') {
  return href ? '<a href="' + esc(href) + '"' + (cls ? ' class="' + cls + '"' : '') +
    (/^https:/.test(href) ? ' rel="noopener noreferrer"' : '') + '>' + esc(label) + '</a>' : '';
}

const paras = items => items.map(item => '<p>' + esc(item) + '</p>').join('');
const list = (items, tag = 'ul') => '<' + tag + '>' + items.map(item => '<li>' + esc(item) + '</li>').join('') + '</' + tag + '>';
const heading = (title, desc = '') => '<div class="page-heading"><h1>' + esc(title) + '</h1>' +
  (desc ? '<p class="lede">' + esc(desc) + '</p>' : '') + '</div>';

function render(lang, route, missing = false) {
  const index = langs.indexOf(lang);
  const local = row => {
    if (row?.length !== langs.length || !row[index]) throw new Error('Missing text for ' + lang + ' in ' + route);
    return row[index];
  };
  const t = key => local(ui[key]);
  const page = key => copy[key].map(local);
  const pl = (product, key) => local(products[product.id][key]);
  const product = site.products.find(p => route === p.id || route === 'guides/' + p.id);
  const guide = route.startsWith('guides/');
  const title = missing ? t('nf') : product ? product.name + (guide ? ' · ' + t('guide') : '') :
    route ? t(route) : t('hero');
  const description = product ? pl(product, 'description') : copy[route] ? page(route)[0] : t('intro');
  const social = asset(product?.social || 'assets/brand/social.png');
  const brand = '<a class="brand" href="' + url(lang) + '"><img src="/assets/brand/mark.svg" width="32" height="32" alt="">' + esc(site.brand) + '</a>';
  const email = site.email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(site.email) ? 'mailto:' + site.email : '';
  const contact = link(email, t('email'), 'button') || paras([t('contact')]);
  const language = () => '<nav class="languages" aria-label="' + esc(t('language')) + '">' +
    langs.map(code => '<a href="' + url(code, missing ? '' : route) + '" lang="' + code +
      '" hreflang="' + code + '" data-language="' + code + '"' + (lang === code ? ' aria-current="true"' : '') +
      '>' + esc(site.languages[code]) + '</a>').join('') + '</nav>';
  const navigation = keys => keys.map(key => '<a href="' + url(lang, key) + '"' +
    (route === key ? ' aria-current="page"' : '') + '>' + esc(t(key)) + '</a>').join('');

  function figure(p, eager = false) {
    const illustrative = !p.desktop && !p.mobile;
    const fallback = asset(p.desktop || p.mobile || 'assets/' + p.id + '/concept.svg');
    return '<figure class="art"><picture>' +
      (p.mobile && p.desktop ? '<source media="(max-width: 600px)" srcset="' + esc(asset(p.mobile)) + '">' : '') +
      '<img src="' + esc(fallback) + '" alt="" width="960" height="720" decoding="async"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + '></picture><figcaption>' +
      esc(t(illustrative ? 'concept' : 'screen')) + '</figcaption></figure>';
  }

  function showcase(p) {
    return '<article class="showcase ' + p.id + '"><div class="showcase-copy"><p class="eyebrow">' +
      esc(p.name) + '</p><h2>' + esc(pl(p, 'tagline')) + '</h2><p>' + esc(pl(p, 'description')) +
      '</p><p class="status">' + esc(t(p.status)) + '</p>' +
      link(url(lang, p.id), t('view') + ' ' + p.name, 'button') + '</div>' + figure(p) + '</article>';
  }

  const guideLinks = () => '<ul class="guide-links">' + site.products.map(p => '<li>' +
    link(url(lang, 'guides/' + p.id), p.name + ' · ' + t('guide')) + '</li>').join('') + '</ul>';
  const source = p => link(https(p.docs || p.source), t('source'), 'button');
  const feedback = p => link(https(p.issues), p.name + ' · ' + t('issues'), 'button') || paras([t('noissues')]);

  function featureList(p) {
    return list(products[p.id].features.map(local));
  }

  function recommendations() {
    const select = (key, options) => '<label>' + esc(t(key)) + '<select name="' + key + '">' +
      options.map((label, i) => '<option value="' + i + '">' + esc(label) + '</option>').join('') + '</select></label>';
    return '<section class="demo"><h2>' + esc(t('demo')) + '</h2>' + paras([t('demoNote')]) +
      '<noscript><p>' + esc(t('js')) + '</p></noscript><form hidden data-demo><div class="controls">' +
      select('energy', ['low', 'medium', 'high'].map(t)) +
      select('time', [5, 15, 45].map(n => new Intl.NumberFormat(lang).format(n) + ' ' + t('minutes'))) +
      '<button type="submit">' + esc(t('suggest')) + '</button></div><output aria-live="polite"></output>' +
      '<template>' + list(local(ui.results)) + '</template></form></section>';
  }

  function productPage(p) {
    const actions = ['download', 'launch'].map(key => link(https(p[key]), t(key), 'button')).join('');
    return '<div class="product-top ' + p.id + '"><div>' +
      (p.icon ? '<img class="product-icon" width="64" height="64" alt="" src="' + esc(asset(p.icon)) + '">' : '') +
      heading(p.name, pl(p, 'tagline')) + paras([pl(p, 'description')]) +
      '<p class="status">' + esc(t(p.status)) + '</p><div class="actions">' +
      link(url(lang, 'guides/' + p.id), t('guide'), 'button primary') + actions + source(p) + '</div>' +
      (actions ? '' : '<p class="status">' + esc(t('unavailable')) + '</p>') + '</div>' + figure(p, true) + '</div>' +
      '<section class="reading"><h2>' + esc(t('features')) + '</h2>' + featureList(p) + '</section>' +
      (p.id === 'sahaja' ? recommendations() : '') +
      (products[p.id].example ? '<section class="demo"><h2>' + esc(t('concept')) + '</h2>' +
        list(products[p.id].example.map(local), 'ol') + '</section>' : '') +
      (p.features || []).map(file => '<figure class="art"><img loading="lazy" alt="" src="' +
        esc(asset(file)) + '"><figcaption>' + esc(t('screen')) + '</figcaption></figure>').join('') +
      (p.video && p.captions?.[lang] ? '<section><h2>' + esc(t('video')) + '</h2><video controls preload="none" aria-label="' +
        esc(t('video')) + '" src="' + esc(asset(p.video)) + '"><track kind="captions" default srclang="' +
        lang + '" label="' + esc(site.languages[lang]) + '" src="' + esc(asset(p.captions[lang])) + '"></video></section>' : '');
  }

  function productGuide(p) {
    return '<article class="reading">' + heading(title, pl(p, 'description')) +
      ['who', 'install', 'first', 'features', 'data', 'help'].map(key => '<section><h2>' +
        esc(t(key)) + '</h2>' + (key === 'features' ? featureList(p) : key === 'help' ?
          '<div class="actions">' + source(p) + feedback(p) + '</div>' : paras([pl(p, key)])) +
        '</section>').join('') + '</article>';
  }

  function home() {
    return '<section class="hero"><div><p class="eyebrow">' + esc(t('studio')) + '</p><h1>' + esc(title) +
      '</h1><p class="lede">' + esc(description) + '</p>' + link('#creations', t('creations'), 'button primary') +
      '</div><img class="hero-art" src="/assets/brand/orbit.svg" width="640" height="640" alt="" fetchpriority="high"></section>' +
      '<section id="creations" aria-label="' + esc(t('creations')) + '">' + site.products.map(showcase).join('') + '</section>' +
      '<section class="intention"><h2>' + esc(t('about')) + '</h2>' + paras(page('about')) + '</section>' +
      '<div class="home-links"><section><h2>' + esc(t('guides')) + '</h2>' + guideLinks() +
      '</section><section><h2>' + esc(t('work')) + '</h2>' + paras(page('work')) + link(url(lang, 'work'), t('work')) +
      '</section><section><h2>' + esc(t('support')) + '</h2>' + paras([page('support')[0]]) +
      link(url(lang, 'support'), t('support')) + '</section></div>';
  }

  function basic() {
    let extra = '';
    if (route === 'guides') extra = guideLinks();
    if (route === 'work') extra = (site.servicesApproved ? list(page('services')) : '') + contact;
    if (route === 'feedback') extra = contact + '<div class="actions">' + site.products.map(feedback).join('') + '</div>';
    if (route === 'support' && site.payments.approved) {
      extra = '<div class="actions">' + link(https(site.payments.support), t('checkoutSupport'), 'button') +
        link(https(site.payments.membership), t('checkoutMembership'), 'button') + '</div>';
    }
    const paragraphs = page(route).filter((_, i) => !(route === 'support' && i === 2 && site.payments.approved && site.payments.support));
    return '<article class="reading">' + heading(title) + paras(paragraphs) + extra + '</article>';
  }

  const body = missing ? heading(title) + link(url(lang), t('home'), 'button') :
    product ? (guide ? productGuide(product) : productPage(product)) :
      !route ? home() : route === 'creations' ? heading(title, description) + site.products.map(showcase).join('') : basic();
  const canonical = origin && !missing ? origin + url(lang, route) : '';
  const alternate = canonical ? langs.map(code => '<link rel="alternate" hreflang="' + code +
    '" href="' + esc(origin + url(code, route)) + '">').join('') +
    '<link rel="alternate" hreflang="x-default" href="' + esc(origin + url('en', route)) + '">' : '';
  const schema = product && !guide ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: product.name,
    description, applicationCategory: product.category, operatingSystem: product.os,
    softwareVersion: product.version, inLanguage: lang, url: canonical || undefined
  }).replace(/</g, '\\u003c') : '';
  const fullTitle = title + ' · ' + site.brand;
  return '<!doctype html>\n<html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta http-equiv="Content-Security-Policy" content="' + csp + '"><meta name="referrer" content="no-referrer">' +
    '<title>' + esc(fullTitle) + '</title><meta name="description" content="' + esc(description) + '">' +
    (canonical ? '<link rel="canonical" href="' + esc(canonical) + '">' + alternate : '<meta name="robots" content="noindex">') +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="' + esc(site.brand) + '">' +
    '<meta property="og:title" content="' + esc(fullTitle) + '"><meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:locale" content="' + ({en:'en_US',hi:'hi_IN',bn:'bn_IN'})[lang] + '">' +
    '<meta property="og:image" content="' + esc((origin || '') + social) + '">' +
    (canonical ? '<meta property="og:url" content="' + esc(canonical) + '">' : '') +
    '<link rel="icon" href="/assets/brand/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css">' +
    '<script src="/app.js" defer></script>' + (schema ? '<script type="application/ld+json">' + schema + '</script>' : '') +
    '</head><body><a class="skip" href="#main">' + esc(t('skip')) + '</a><header class="site-header"><div class="shell header-inner">' +
    brand + '<nav class="primary-nav" aria-label="' + esc(t('studio')) + '">' +
    navigation(['creations', 'guides', 'work']) + '</nav><div class="preferences">' + language() +
    '<label class="appearance" hidden><span class="sr-only">' + esc(t('theme')) + '</span><select data-theme-choice>' +
    ['system', 'light', 'dark'].map(key => '<option value="' + key + '">' + esc(t(key)) + '</option>').join('') +
    '</select></label></div></div></header><main class="shell main" id="main" tabindex="-1">' + body +
    '</main><footer class="site-footer"><div class="shell footer-inner">' + brand + '<nav aria-label="' +
    esc(t('about')) + '">' + navigation(['about', 'support', 'feedback', 'privacy']) + '</nav>' + language() +
    '</div></footer></body></html>\n';
}

function build() {
  if (new Set(routes).size !== routes.length || site.products.some(p => !slug.test(p.id))) throw new Error('Invalid or duplicate route');
  for (const lang of langs) {
    for (const route of routes) write(url(lang, route).slice(1) + 'index.html', render(lang, route));
    write(lang + '/404.html', render(lang, '', true));
  }
  write('404.html', render('en', '', true));
  const legacy = sections.concat(site.products.map(p => p.id)).join(' ');
  write('index.html', render('en', '').replace('<body>', '<body data-entry data-legacy-routes="' + esc(legacy) + '">'));
  write('robots.txt', origin ? 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n');
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    (origin ? langs.flatMap(lang => routes.map(route => '<url><loc>' + esc(origin + url(lang, route)) + '</loc></url>')).join('\n') : '') +
    '</urlset>\n';
  write('sitemap.xml', sitemap);
  write('_headers', '/*\n  Content-Security-Policy: ' + csp + "; frame-ancestors 'none'\n" +
    '  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: geolocation=(), microphone=(), camera=()\n');
  for (const name of ['app.js', 'styles.css']) fs.copyFileSync(path.join(__dirname, name), path.join(out, name));
  fs.cpSync(path.join(__dirname, 'assets'), path.join(out, 'assets'), { recursive: true });
  console.log('Built ' + langs.length * routes.length + ' localized pages.');
}

if (require.main === module) build();
module.exports = { build, render, langs, routes };

