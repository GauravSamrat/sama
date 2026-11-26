const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { build, langs, routes } = require('./build');
const { serve } = require('./server');

const executable = [
  process.env.SAMA_BROWSER, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium'
].find(file => file && fs.existsSync(file));
if (!executable) throw new Error('Set SAMA_BROWSER to the Chrome or Edge executable.');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sama-browser-'));
const browser = spawn(executable, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking',
  ...(process.env.SAMA_BROWSER_NO_SANDBOX === '1' ? ['--no-sandbox'] : []),
  '--remote-debugging-pipe', '--user-data-dir=' + profile
], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true });
const waiting = new Map();
const errors = [];
const requests = [];
let sessionId;
let nextId = 0;
let buffer = '';

browser.stdio[4].setEncoding('utf8');
browser.stdio[4].on('data', chunk => {
  buffer += chunk;
  const lines = buffer.split('\0');
  buffer = lines.pop();
  for (const line of lines) {
    const message = JSON.parse(line);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
    if (message.id) waiting.get(message.id)?.(message);
  }
});
browser.stdio[3].on('error', () => {});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { waiting.delete(id); reject(new Error(method + ' timed out')); }, 8000);
    waiting.set(id, message => {
      clearTimeout(timer);
      waiting.delete(id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
    browser.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
}
async function evaluate(expression) {
  const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (exceptionDetails) throw new Error(result.description || exceptionDetails.text);
  return result.value;
}
async function until(expression) {
  for (let i = 0; i < 50; i++) {
    if (await evaluate(expression).catch(() => false)) return;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  throw new Error('Waiting for ' + expression);
}
async function navigate(port, route, expected = route) {
  const navigation = await send('Page.navigate', { url: 'http://127.0.0.1:' + port + route });
  if (navigation.errorText) throw new Error(route + ': ' + navigation.errorText);
  try {
    await until('location.pathname === ' + JSON.stringify(expected) + ' && document.readyState === "complete"');
  } catch (error) {
    throw new Error(error.message + ': ' + await evaluate('JSON.stringify([location.href, document.title, navigator.languages])'));
  }
}

async function run() {
  build();
  const server = serve(0);
  try {
    if (!server.listening) await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.once('listening', resolve);
    });
    const port = server.address().port;
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }));
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    const blocked = await send('Network.setBlockedURLs', { urls: ['https://*'] });
    assert.ok(blocked);
    await send('Runtime.evaluate', { expression: 'void 0' });
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: "Object.defineProperty(navigator,'languages',{value:['bn-IN','en-US']})"
    });
    await navigate(port, '/', '/bn/');
    const timing = await evaluate('performance.getEntriesByType("navigation")[0].toJSON()');
    console.log('Local Bengali homepage: DOM ready ' + Math.round(timing.domContentLoadedEventEnd) +
      ' ms, load ' + Math.round(timing.loadEventEnd) + ' ms.');
    await evaluate('document.querySelector("[data-language=hi]").click()');
    await until('location.pathname === "/hi/" && document.readyState === "complete"');
    await navigate(port, '/en/citta/');
    await navigate(port, '/#/p/sahaja', '/hi/sahaja/');
    assert.equal(await evaluate('localStorage.getItem("lang")'), 'hi');
    await evaluate('let s=document.querySelector("[data-theme-choice]"); s.value="dark"; s.dispatchEvent(new Event("change"));');
    await navigate(port, '/bn/sahaja/');
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark');
    const actions = await evaluate(String.raw`Array.from({length:9},(_,i)=>{
      const form=document.querySelector('[data-demo]');
      form.elements.energy.selectedIndex=Math.floor(i/3);
      form.elements.time.selectedIndex=i%3;
      form.requestSubmit();
      return form.querySelector('output').textContent;
    })`);
    assert.equal(new Set(actions.filter(Boolean)).size, 9);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await evaluate('getComputedStyle(document.querySelector("button")).transitionDuration'), '0s');
    await navigate(port, '/en/listen/?product=sahaja', '/en/listen/');
    const branches = await evaluate([
      '(()=>{const f=document.querySelector("[data-listen]");',
      'const click=key=>f.querySelector("[data-"+key+"]").click();',
      'const set=(field,value)=>{field.value=value;field.dispatchEvent(new Event("input",{bubbles:true}));};',
      'if(f.elements.product.value!=="sahaja" || f.elements.contact.checked) return false;',
      'click("next");if(!f.querySelector("[data-status]").textContent) return false;',
      'set(f.elements.problem,"<img src=x onerror=alert(1)>");click("next");',
      'for(const option of Array.from(f.elements.category.options).slice(1)){',
      'set(f.elements.category,option.value);click("next");',
      'const group=f.querySelector("[data-category="+option.value+"]");',
      'if(group.hidden || group.querySelector("textarea").disabled) return false;',
      'set(group.querySelector("textarea"),option.value);click("back");}',
      'set(f.elements.category,"");click("next");click("next");',
      'f.elements.contact.click();if(f.elements.email.disabled) return false;',
      'set(f.elements.email,"demo@example.com");click("next");',
      'const review=f.querySelector("[data-review-body]");',
      'return !review.querySelector("img") && review.textContent.includes("<img") &&',
      '!review.textContent.includes("education") && !f.querySelector("[data-send]") &&',
      '!sessionStorage.getItem("abundance-listening-draft-v1").includes("demo@example.com");})()'
    ].join(''));
    assert.ok(branches, 'listening flow, safe text and conditional consent');
    await navigate(port, '/en/listen/');
    assert.match(await evaluate('document.querySelector("[data-listen]").elements.problem.value'), /<img/);
    await evaluate('document.querySelector("[data-clear]").click()');
    assert.equal(await evaluate('sessionStorage.getItem("abundance-listening-draft-v1")'), null);
    const widths = [320, 390, 768, 1024, 1366, 1920];
    for (const width of widths) {
      await send('Emulation.setDeviceMetricsOverride', {
        width, height: 850, deviceScaleFactor: 1, mobile: width <= 390
      });
      for (const lang of langs) for (const route of routes) {
        await navigate(port, '/' + lang + '/' + (route ? route + '/' : ''));
        assert.equal(await evaluate('document.documentElement.lang'), lang);
        assert.equal(await evaluate('document.querySelectorAll("main h1").length'), 1);
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), lang + ' ' + route + ' ' + width);
        assert.ok(await evaluate('[...document.images].every(img => !img.complete || img.naturalWidth > 0)'), lang + ' ' + route);
      }
      if (process.env.SAMA_BROWSER_SCREENSHOTS === '1' && [390, 1366].includes(width)) {
        await navigate(port, width === 1366 ? '/en/' : '/bn/');
        await evaluate('document.documentElement.dataset.theme=' + JSON.stringify(width === 390 ? 'dark' : 'light'));
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        const directory = path.join(__dirname, 'browser-artifacts');
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, 'home-' + width + '.png'), Buffer.from(shot.data, 'base64'));
      }
    }
    await navigate(port, '/en/');
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    assert.equal(await evaluate('document.activeElement.getAttribute("href")'), '#main');
    await send('Emulation.setScriptExecutionDisabled', { value: true });
    await navigate(port, '/hi/guides/citta/');
    assert.ok(await evaluate('document.querySelector("main").textContent.includes("बैकअप")'));
    assert.deepEqual(errors, []);
    assert.ok(requests.every(value => value.startsWith('http://127.0.0.1:' + port + '/')), 'unexpected external request');
    console.log(widths.length * routes.length * langs.length +
      ' browser route checks passed. Language, theme, demo, listening, keyboard, reduced motion and static content passed.');
  } finally {
    server.close();
    browser.kill();
  }
}
browser.on('close', () => {
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }); } catch {}
});
run().catch(error => { console.error(error); process.exitCode = 1; });

