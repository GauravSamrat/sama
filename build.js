const fs = require('node:fs');
const path = require('node:path');
const site = require('./studio');
const ui = require('./locales/ui');
const abundance = require('./locales/abundance');
const journal = require('./locales/journal');
const listening = require('./listening');
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
const sections = ['creations', 'guides', 'about', 'work', 'support', 'feedback', 'privacy', 'journal', 'community', 'listen', 'guidelines'];
const articles = journal.filter(article => article.reviewed || site.editorialPreview);
const routes = ['', ...sections, ...site.products.flatMap(p => [p.id, 'guides/' + p.id]), ...articles.map(a => 'journal/' + a.id)];
const delivery = https(site.submissions.endpoint);
const csp = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; manifest-src 'self'; connect-src " +
  (delivery ? new URL(delivery).origin : "'none'") + "; base-uri 'none'; form-action 'none'";
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
  const t = key => local(abundance[key] || ui[key]);
  const page = key => copy[key].map(local);
  const pl = (product, key) => local(products[product.id][key]);
  const product = site.products.find(p => route === p.id || route === 'guides/' + p.id);
  const article = articles.find(a => route === 'journal/' + a.id);
  const journalText = row => row[index] || row[0];
  const fallbackArticle = article && [article.title, article.summary, ...article.paragraphs].some(row => !row[index]);
  const guide = route.startsWith('guides/');
  const title = missing ? t('nf') : article ? journalText(article.title) : route === 'about' ? ui.about[index] : product ? product.name + (guide ? ' · ' + t('guide') : '') :
    route ? t(route) : t('hero');
  const description = article ? journalText(article.summary) : product ? pl(product, 'description') :
    route === 'journal' ? t('journalIntro') : route === 'community' ? t('communityIntro') :
    route === 'about' ? t('about') : copy[route] ? page(route)[0] : t('intro');
  const social = asset(product?.social || site.artwork.social);
  const brand = '<a class="brand" href="' + url(lang) + '"><img src="' + esc(asset(site.artwork.icon)) + '" width="40" height="40" alt="">' + esc(site.brand) + '</a>';
  const email = site.email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(site.email) ? 'mailto:' + site.email : '';
  const contact = link(email, t('email'), 'button') || paras([t('contact')]);
  const language = () => '<nav class="languages" aria-label="' + esc(t('language')) + '">' +
    langs.map(code => '<a href="' + url(code, missing ? '' : route) + '" lang="' + code +
      '" hreflang="' + code + '" data-language="' + code + '"' + (lang === code ? ' aria-current="true"' : '') +
      '>' + esc(site.languages[code]) + '</a>').join('') + '</nav>';
  const navigation = keys => keys.map(key => '<a href="' + url(lang, key) + '"' +
    (route === key ? ' aria-current="page"' : '') + '>' + esc(t(key)) + '</a>').join('');

  function newsletter() {
    const signup = https(site.newsletter.signup);
    return '<section class="letter-panel" id="letters"><h2>' + esc(t('letters')) + '</h2>' + paras([t('lettersIntro')]) +
      (signup ? paras([t('hostedConfirmation')]) + link(signup, t('subscribe'), 'button') : paras([t('newsletterPending')])) +
      link(url(lang, 'privacy'), t('privacy')) + '</section>';
  }

  function participate(p) {
    const channels = p ? site.community.filter(c => c.enabled && c.url && c.scope === p.id) : [];
    return '<div class="actions">' + link(url(lang, 'listen') + (p ? '?product=' + p.id : ''), t('feedbackNext'), 'button') +
      link(url(lang, 'community'), t('community'), 'button') + link(url(lang, 'community') + '#letters', t('letters')) +
      channels.map(c => link(https(c.url), c.label, 'button')).join('') + '</div>';
  }

  function journalList(level = 'h3') {
    return '<div class="journal-grid">' + articles.map(entry => '<article><' + level + '>' +
      link(url(lang, 'journal/' + entry.id), journalText(entry.title)) + '</' + level + '>' +
      paras([journalText(entry.summary), ...(!entry.title[index] ? [t('englishDraft')] : []),
        ...(!entry.reviewed ? [t('review')] : [])]) + '</article>').join('') + '</div>';
  }

  function articlePage(entry) {
    const proseLang = fallbackArticle ? 'en' : lang;
    const proseIndex = fallbackArticle ? 0 : index;
    const paragraphs = entry.paragraphs.map(row => row[proseIndex]);
    const words = [...new Intl.Segmenter(proseLang, { granularity: 'word' }).segment(paragraphs.join(' '))]
      .filter(segment => segment.isWordLike).length;
    const stamp = value => value ? '<time datetime="' + esc(value) + '">' +
      esc(new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))) + '</time>' : '';
    const related = articles.filter(other => other.id !== entry.id);
    const projects = site.products.filter(p => entry.products?.includes(p.id));
    return '<article class="reading editorial"><p class="eyebrow">' + esc(local(entry.category)) + '</p>' +
      '<div lang="' + proseLang + '">' + heading(entry.title[proseIndex], entry.summary[proseIndex]) + '</div>' +
      (fallbackArticle ? paras([t('englishDraft')]) : '') +
      (!entry.reviewed ? '<p class="eyebrow">' + esc(t('review')) + '</p>' : '') +
      '<p class="status">' + esc(new Intl.NumberFormat(lang).format(Math.max(1, Math.ceil(words / 200))) + ' ' + t('minutesRead')) +
      (entry.date ? ' · ' + stamp(entry.date) : '') + (entry.updated ? ' · ' + esc(t('updated')) + ' ' + stamp(entry.updated) : '') + '</p>' +
      '<div lang="' + proseLang + '">' + paras(paragraphs) + '</div>' +
      '<button type="button" hidden data-share data-copied="' + esc(t('copied')) + '" data-failed="' + esc(t('copyFailed')) + '">' +
      esc(t('share')) + '</button><p data-share-status role="status"></p>' +
      (related.length || projects.length ? '<h2>' + esc(t('related')) + '</h2><ul>' +
        related.map(other => '<li>' + link(url(lang, 'journal/' + other.id), journalText(other.title)) + '</li>').join('') +
        projects.map(p => '<li>' + link(url(lang, p.id), p.name) + '</li>').join('') + '</ul>' : '') +
      participate() + link(url(lang, 'journal'), t('journal')) + '</article>';
  }

  function communityPage() {
    const channels = [...site.community, ...site.social].filter(c => c.enabled && c.url && (!c.scope || c.scope === 'general'));
    return '<article class="reading">' + heading(title, description) +
      (channels.length ? '<div class="actions">' + channels.map(c => link(https(c.url), c.label, 'button')).join('') + '</div>' : paras([t('channelsPending')])) +
      participate() + link(url(lang, 'guidelines'), t('guidelines')) + newsletter() + '</article>';
  }

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
      '</h1><p class="lede">' + esc(description) + '</p><div class="actions">' + link('#creations', t('creations'), 'button primary') +
      link(url(lang, 'listen'), t('listen'), 'button') + '</div></div><img class="hero-art" src="' +
      esc(asset(site.artwork.wordmark)) + '" width="1000" height="530" alt="" fetchpriority="high"></section>' +
      '<section id="creations" aria-label="' + esc(t('creations')) + '">' + site.products.map(showcase).join('') + '</section>' +
      '<section class="intention"><h2>' + esc(t('philosophy')) + '</h2>' + paras([t('about')]) +
      link(url(lang, 'listen'), t('listen'), 'button') + '</section>' +
      '<section class="editorial"><h2>' + link(url(lang, 'journal'), t('journal')) + '</h2>' + journalList() +
      '</section><section class="editorial"><h2>' + esc(t('latest')) + '</h2>' +
      list(site.products.map(p => p.name + ' · ' + t(p.status))) + '</section>' +
      '<div class="home-links"><section><h2>' + esc(t('guides')) + '</h2>' + guideLinks() +
      '</section><section><h2>' + esc(t('work')) + '</h2>' + paras(page('work')) + link(url(lang, 'work'), t('work')) +
      '</section><section><h2>' + esc(t('support')) + '</h2>' + paras([page('support')[0]]) +
      link(url(lang, 'support'), t('support')) + '</section></div><section class="editorial"><h2>' +
      esc(t('community')) + '</h2>' + paras([t('communityIntro')]) + link(url(lang, 'community'), t('community'), 'button') +
      '</section>' + newsletter();
  }

  function basic() {
    let extra = '';
    if (route === 'guides') extra = guideLinks();
    if (route === 'work') extra = '<div class="journal-grid">' + abundance.serviceCards.map(([name, detail]) =>
      '<article><h2>' + esc(local(name)) + '</h2>' + paras([local(detail)]) + '</article>').join('') +
      '</div>' + paras([t('serviceProcess')]) + contact +
      link(url(lang, 'listen') + '?category=automation', t('listen'), 'button') + participate();
    if (route === 'feedback') extra = contact + '<div class="actions">' + site.products.map(feedback).join('') + '</div>' + participate();
    if (route === 'support' && site.payments.approved) {
      extra = '<div class="actions">' + link(https(site.payments.support), t('checkoutSupport'), 'button') +
        link(https(site.payments.membership), t('checkoutMembership'), 'button') + '</div>';
    }
    if (route === 'support') extra += '<section><h2>' + esc(t('faq')) + '</h2>' + paras([t('faqAnswer')]) +
      guideLinks() + contact + participate() + '</section>';
    if (route === 'privacy') extra += paras([t('privacyForms')]) + link(url(lang, 'guidelines'), t('guidelines'));
    const paragraphs = route === 'about' ? [t('about'), t('philosophy')] :
      page(route).filter((_, i) => !(route === 'support' && i === 2 && site.payments.approved && site.payments.support));
    return '<article class="reading">' + heading(title) + paras(paragraphs) + extra + '</article>';
  }

  const body = missing ? heading(title) + link(url(lang), t('home'), 'button') :
    product ? (guide ? productGuide(product) : productPage(product)) + participate(product) :
    article ? articlePage(article) :
    route === 'journal' ? heading(title, description) + journalList('h2') + newsletter() :
    route === 'community' ? communityPage() :
    route === 'listen' ? listening({ local, esc, endpoint: delivery, lang, products: site.products }) + participate() :
    route === 'guidelines' ? '<article class="reading">' + heading(title, t('rules')) + participate() + '</article>' :
    !route ? home() : route === 'creations' ? heading(title, description) + site.products.map(showcase).join('') : basic();
  const canonical = origin && !missing && (!article || article.reviewed) ? origin + url(lang, route) : '';
  const alternate = canonical ? langs.map(code => '<link rel="alternate" hreflang="' + code +
    '" href="' + esc(origin + url(code, route)) + '">').join('') +
    '<link rel="alternate" hreflang="x-default" href="' + esc(origin + url('en', route)) + '">' : '';
  const schema = product && !guide ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: product.name,
    description, applicationCategory: product.category, operatingSystem: product.os,
    softwareVersion: product.version, inLanguage: lang, url: canonical || undefined
  }).replace(/</g, '\\u003c') : article?.reviewed ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article', headline: title, description, inLanguage: lang,
    url: canonical || undefined
  }).replace(/</g, '\\u003c') : '';
  const fullTitle = title + ' · ' + site.brand;
  return '<!doctype html>\n<html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta http-equiv="Content-Security-Policy" content="' + csp + '"><meta name="referrer" content="no-referrer">' +
    '<title>' + esc(fullTitle) + '</title><meta name="description" content="' + esc(description) + '">' +
    (canonical ? '<link rel="canonical" href="' + esc(canonical) + '">' + alternate : '<meta name="robots" content="noindex">') +
    '<meta property="og:type" content="' + (article ? 'article' : 'website') + '"><meta property="og:site_name" content="' + esc(site.brand) + '">' +
    '<meta property="og:title" content="' + esc(fullTitle) + '"><meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:locale" content="' + ({en:'en_US',hi:'hi_IN',bn:'bn_IN'})[lang] + '">' +
    '<meta property="og:image" content="' + esc((origin || '') + social) + '">' +
    (canonical ? '<meta property="og:url" content="' + esc(canonical) + '">' : '') +
    '<link rel="icon" href="' + esc(asset(site.artwork.favicon)) + '" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="/styles.css">' +
    '<script src="/app.js" defer></script>' + (schema ? '<script type="application/ld+json">' + schema + '</script>' : '') +
    '</head><body><a class="skip" href="#main">' + esc(t('skip')) + '</a><header class="site-header"><div class="shell header-inner">' +
    brand + '<nav class="primary-nav" aria-label="' + esc(t('studio')) + '">' +
    navigation(['creations', 'journal', 'listen', 'community']) + '</nav><div class="preferences">' + language() +
    '<label class="appearance" hidden><span class="sr-only">' + esc(t('theme')) + '</span><select data-theme-choice>' +
    ['system', 'light', 'dark'].map(key => '<option value="' + key + '">' + esc(t(key)) + '</option>').join('') +
    '</select></label></div></div></header><main class="shell main" id="main" tabindex="-1">' + body +
    '</main><footer class="site-footer"><div class="shell footer-inner">' + brand + '<nav aria-label="' +
    esc(ui.about[index]) + '">' + navigation(['guides', 'work', 'support', 'feedback', 'privacy']) +
    link(url(lang, 'about'), ui.about[index]) + link(url(lang, 'community') + '#letters', t('letters')) + '</nav>' + language() +
    '</div></footer></body></html>\n';
}

function build() {
  if (new Set(routes).size !== routes.length || site.products.some(p => !slug.test(p.id))) throw new Error('Invalid or duplicate route');
  for (const lang of langs) {
    for (const entry of journal.filter(a => !articles.includes(a))) {
      if (!slug.test(entry.id)) throw new Error('Invalid journal slug');
      fs.rmSync(path.join(out, lang, 'journal', entry.id, 'index.html'), { force: true });
    }
    for (const route of routes) write(url(lang, route).slice(1) + 'index.html', render(lang, route));
    write(lang + '/404.html', render(lang, '', true));
  }
  write('404.html', render('en', '', true));
  const legacy = sections.concat(site.products.map(p => p.id)).join(' ');
  write('index.html', render('en', '').replace('<body>', '<body data-entry data-legacy-routes="' + esc(legacy) + '">'));
  write('robots.txt', origin ? 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n');
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    (origin ? langs.flatMap(lang => routes.filter(route => !articles.some(a => !a.reviewed && route === 'journal/' + a.id))
      .map(route => '<url><loc>' + esc(origin + url(lang, route)) + '</loc></url>')).join('\n') : '') +
    '</urlset>\n';
  write('sitemap.xml', sitemap);
  write('manifest.webmanifest', JSON.stringify({
    name: site.brand, short_name: site.brand, start_url: '/', display: 'standalone',
    theme_color: '#1b1d1e', background_color: '#e8e3d8',
    icons: [{ src: '/' + site.artwork.icon, sizes: '192x192', type: 'image/png' }]
  }, null, 2));
  write('_headers', '/*\n  Content-Security-Policy: ' + csp + "; frame-ancestors 'none'\n" +
    '  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: geolocation=(), microphone=(), camera=()\n');
  for (const name of ['app.js', 'styles.css']) fs.copyFileSync(path.join(__dirname, name), path.join(out, name));
  fs.cpSync(path.join(__dirname, 'assets'), path.join(out, 'assets'), { recursive: true });
  console.log('Built ' + langs.length * routes.length + ' localized pages.');
}

if (require.main === module) build();
module.exports = { build, render, langs, routes };

