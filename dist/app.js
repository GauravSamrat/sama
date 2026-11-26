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

const listening = document.querySelector('[data-listen]');
const share = document.querySelector('[data-share]');
if (share && navigator.clipboard) {
  share.hidden = false;
  share.addEventListener('click', async () => {
    const status = document.querySelector('[data-share-status]');
    try {
      await navigator.clipboard.writeText(location.origin + location.pathname);
      status.textContent = share.dataset.copied;
    } catch {
      status.textContent = share.dataset.failed;
    }
  });
}
if (listening) {
  const fields = listening.elements;
  const steps = [...listening.querySelectorAll('[data-step]')];
  const status = listening.querySelector('[data-status]');
  const review = listening.querySelector('[data-review-body]');
  const endpoint = listening.dataset.endpoint;
  const key = 'abundance-listening-draft-v1';
  const action = key => listening.querySelector('[data-' + key + ']');
  const controls = [...listening.querySelectorAll('textarea, select, input')];
  const storedControls = controls.filter(input => input.name !== 'email');
  let step = 0;
  let sending = false;
  let requestId;

  function updateContext() {
    for (const group of listening.querySelectorAll('[data-category]')) {
      group.hidden = group.dataset.category !== fields.category.value;
      for (const field of group.querySelectorAll('textarea')) field.disabled = group.hidden;
    }
    fields.email.disabled = !fields.contact.checked;
    fields.email.required = fields.contact.checked;
    if (fields.email.disabled) fields.email.value = '';
    listening.querySelector('[data-contact-field]').hidden = fields.email.disabled;
  }

  function saveDraft() {
    try {
      const values = storedControls.map(input => input.type === 'checkbox' ? input.checked : input.value);
      sessionStorage.setItem(key, JSON.stringify({ values, requestId }));
    } catch {}
  }
  function clearDraft() {
    try { sessionStorage.removeItem(key); } catch {}
    requestId = undefined;
    listening.reset();
    updateContext();
  }

  function renderReview() {
    review.replaceChildren();
    for (const field of controls) {
      if (field.disabled || !field.value.trim() || (field.type === 'checkbox' && !field.checked)) continue;
      const label = field.labels?.[0]?.textContent.trim() || field.getAttribute('aria-label');
      const title = document.createElement('dt');
      const value = document.createElement('dd');
      title.textContent = label;
      value.textContent = field.type === 'checkbox' ? '✓' :
        field.tagName === 'SELECT' ? field.selectedOptions[0].textContent : field.value.trim();
      review.append(title, value);
    }
  }

  function show(index, focus = true) {
    step = index;
    steps.forEach((element, i) => { element.hidden = i !== index; });
    action('progress').textContent = new Intl.NumberFormat(listening.dataset.lang).format(index + 1) + ' / ' + steps.length;
    action('back').hidden = index === 0 || index === 5;
    action('edit').hidden = index !== 5;
    action('next').hidden = index === 5;
    action('early').hidden = index === 5;
    if (action('send')) action('send').hidden = index !== 5;
    if (index === 5) renderReview();
    if (focus) steps[index].querySelector('legend').focus();
  }

  function validate() {
    status.textContent = '';
    if (!fields.problem.value.trim()) {
      show(0);
      status.textContent = listening.dataset.invalid;
      fields.problem.focus();
      return false;
    }
    if (!fields.email.validity.valid) {
      show(4);
      fields.email.reportValidity();
      return false;
    }
    return true;
  }

  try {
    const draft = JSON.parse(sessionStorage.getItem(key));
    if (draft?.values?.length === storedControls.length) {
      requestId = draft.requestId;
      storedControls.forEach((input, i) => {
        if (input.type === 'checkbox') input.checked = draft.values[i] === true;
        else input.value = String(draft.values[i] ?? '').slice(0, input.maxLength > 0 ? input.maxLength : 100);
      });
    }
  } catch {}
  const query = new URLSearchParams(location.search);
  const product = query.get('product');
  if (product && [...fields.product.options].some(option => option.value === product)) fields.product.value = product;
  const category = query.get('category');
  if (category && [...fields.category.options].some(option => option.value === category)) fields.category.value = category;
  updateContext();
  listening.hidden = false;
  show(0, false);
  listening.addEventListener('input', () => { requestId = undefined; updateContext(); saveDraft(); });
  action('next').addEventListener('click', () => {
    if (step === 0 && !validate()) return;
    if (step === 4 && !validate()) return;
    show(step === 1 && !fields.category.value ? 3 : step + 1);
  });
  action('back').addEventListener('click', () => show(step === 3 && !fields.category.value ? 1 : step - 1));
  action('early').addEventListener('click', () => { if (validate()) show(5); });
  action('edit').addEventListener('click', () => show(0));
  action('clear').addEventListener('click', () => { clearDraft(); status.textContent = ''; show(0); });
  listening.addEventListener('submit', async event => {
    event.preventDefault();
    if (!endpoint || sending || step !== 5 || !validate()) return;
    sending = true;
    const buttons = [...listening.querySelectorAll('button')];
    buttons.forEach(button => { button.disabled = true; });
    try {
      requestId ||= crypto.randomUUID();
      saveDraft();
      const entries = [...new FormData(listening)].filter(([, value]) => value.trim());
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
        body: JSON.stringify({ id: requestId, language: listening.dataset.lang, answers: entries }),
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok || (await response.json()).id !== requestId) throw new Error('Receipt unavailable');
      clearDraft();
      for (const fieldset of steps) fieldset.hidden = true;
      action('progress').hidden = true;
      buttons.forEach(button => { button.hidden = true; });
      status.textContent = listening.dataset.sent;
      status.tabIndex = -1;
      status.focus();
    } catch {
      status.textContent = listening.dataset.error;
    } finally {
      sending = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  });
}
