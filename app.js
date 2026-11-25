'use strict';

const read = key => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* Preferences still work for this page. */ }
};
const languageLinks = [...document.querySelectorAll('[data-language]')];
const languages = new Set(languageLinks.map(link => link.dataset.language));

for (const link of languageLinks) {
  link.addEventListener('click', () => save('lang', link.dataset.language));
}

if (document.body.hasAttribute('data-entry')) {
  const remembered = read('lang');
  const preferred = (navigator.languages || [navigator.language])
    .map(code => code?.toLowerCase().split('-')[0]).find(code => languages.has(code));
  const language = languages.has(remembered) ? remembered : preferred || 'en';
  const oldRoute = location.hash.match(/^#\/(?:p\/)?([a-z-]+)?\/?$/)?.[1];
  const allowed = new Set(document.body.dataset.legacyRoutes.split(' '));
  const route = allowed.has(oldRoute) ? oldRoute + '/' : '';
  const anchor = location.hash === '#creations' ? '#creations' : '';
  location.replace('/' + language + '/' + route + location.search + anchor);
}

const theme = document.querySelector('[data-theme-choice]');
const choices = new Set([...theme.options].map(option => option.value));
function appearance(value) {
  theme.value = choices.has(value) ? value : 'system';
  document.documentElement.dataset.theme = theme.value;
}
appearance(read('theme'));
theme.closest('label').hidden = false;
theme.addEventListener('change', () => {
  appearance(theme.value);
  save('theme', theme.value);
});

const demo = document.querySelector('[data-demo]');
if (demo) {
  const results = [...demo.querySelector('template').content.querySelectorAll('li')];
  demo.hidden = false;
  demo.addEventListener('submit', event => {
    event.preventDefault();
    const energy = demo.elements.energy.selectedIndex;
    const time = demo.elements.time.selectedIndex;
    demo.querySelector('output').textContent = results[energy * 3 + time]?.textContent || '';
  });
}
