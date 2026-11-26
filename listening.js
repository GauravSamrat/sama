const copy = require('./locales/listen');

module.exports = function renderListening({ local, esc, endpoint, lang, products }) {
  const t = key => esc(local(copy[key]));
  const attr = esc(endpoint || '');
  const options = Object.entries(copy.categories).map(([key, category]) =>
    '<option value="' + key + '">' + esc(local(category.label)) + '</option>').join('');
  const questions = Object.entries(copy.categories).map(([key, category]) =>
    '<div data-category="' + key + '" hidden>' + category.questions.map((row, i) =>
      '<label>' + esc(local(row)) + '<textarea name="' + key + '-' + i + '" maxlength="600" rows="2" disabled></textarea></label>').join('') + '</div>').join('');
  const prefs = Object.entries(copy.preferences).map(([key, row]) =>
    '<label class="tick"><input type="checkbox" name="preference" value="' + key + '"> ' + esc(local(row)) + '</label>').join('');
  const consent = ['beta','contact','publish'].map(key =>
    '<label class="tick"><input type="checkbox" name="' + key + '" value="yes"> ' + t(key) + '</label>').join('');
  const section = (title, body) => '<fieldset data-step hidden><legend tabindex="-1">' + t(title) + '</legend>' + body + '</fieldset>';
  const button = (key, cls = '') => '<button type="button" data-' + key + ' class="' + cls + '">' + t(key) + '</button>';
  return '<article class="reading listen-page"><div class="page-heading"><h1>' + t('title') + '</h1><p>' + t('safety') + '</p></div>' +
    '<noscript><p>' + t('enable') + '</p></noscript>' + (endpoint ? '' : '<p class="status">' + t('pending') + '</p>') +
    '<form data-listen hidden novalidate data-endpoint="' + attr + '" data-lang="' + esc(lang) + '" data-invalid="' + t('invalid') +
    '" data-error="' + t('error') + '" data-sent="' + t('sent') + '">' +
    '<span data-progress></span>' +
    section('problem', '<textarea name="problem" aria-label="' + t('problem') + '" required maxlength="3000" rows="5"></textarea>') +
    section('kind', '<select name="category" aria-label="' + t('kind') + '"><option value="">' + t('general') + '</option>' + options + '</select>' +
      '<select name="product" aria-label="' + t('product') + '"><option value="">' + t('product') + '</option>' +
      products.map(p => '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>').join('') + '</select>') +
    section('context', questions) + section('requirements', '<div class="choices">' + prefs + '</div>') +
    section('participation', consent + '<label data-contact-field hidden>' + t('address') + '<input type="email" name="email" maxlength="254" disabled></label>') +
    section('review', '<dl data-review-body></dl>') +
    '<p data-status role="status" aria-live="polite"></p><div class="actions">' + button('back') + button('edit') +
    button('next','primary') + button('early') + button('clear') +
    (endpoint ? '<button data-send type="submit" class="primary">' + t('send') + '</button>' : '') +
    '</div></form></article>';
};
