// 網站入口：讀取單元註冊表，產生上方單元選單、子頁籤，並依網址 # 切換頁面
// 網址格式：#單元id-頁面id，例如 #pron-learn、#verbs-quiz
import modules from '../modules/registry.js';
import { $, esc } from './core/dom.js';
import { LS } from './core/storage.js';
import { initSpeech } from './core/speech.js';

const routes = new Map();
modules.forEach(m => m.pages.forEach(p => routes.set(`${m.id}-${p.id}`, { m, p })));
const first = routes.keys().next().value;
// 舊版網址相容
const LEGACY = { pron: 'pron-learn', pquiz: 'pron-quiz', verbs: 'verbs-table', vquiz: 'verbs-quiz' };

const nav = $('#mods'), sub = $('#pages'), view = $('#view');
const views = new Map();   // 已開過的頁面保留在畫面上（隱藏），切回來時狀態還在
let pending = {};          // 跳頁時要帶給目標頁的參數，例如 {filter:'link'}

const resolve = k => { k = LEGACY[k] || k; return routes.has(k) ? k : null; };

function go(key, params = {}) {
  pending = params;
  if (location.hash.slice(1) === key) show(key); else location.hash = key;
}

function show(raw) {
  const key = resolve(raw) || resolve(LS.get('route', '')) || first;
  const { m, p } = routes.get(key);
  const moduleChanged = !nav.querySelector(`[data-mod="${m.id}"][aria-selected="true"]`);
  LS.set('route', key); LS.set('page_' + m.id, p.id);

  nav.querySelectorAll('[data-mod]').forEach(b => b.setAttribute('aria-selected', b.dataset.mod === m.id));
  sub.innerHTML = m.pages.length > 1 ? m.pages.map(x => `<button type="button" class="subtab" role="tab" data-page="${m.id}-${x.id}" aria-selected="${x === p}">${esc(x.title)}</button>`).join('') : '';

  views.forEach((el, k) => { el.hidden = k !== key; });
  let el = views.get(key);
  const params = pending; pending = {};
  if (!el || Object.keys(params).length) {
    if (!el) { el = document.createElement('div'); el.className = 'page'; view.appendChild(el); views.set(key, el); }
    el.hidden = false;
    try { p.render(el, { go, params }); }
    catch (err) { el.innerHTML = `<p class="muted">這個頁面載入時發生錯誤：${esc(err.message)}</p>`; console.error(err); }
  }
  if (moduleChanged || Object.keys(params).length) window.scrollTo({ top: 0 });
}

nav.innerHTML = modules.map(m => `<button type="button" class="tab" role="tab" data-mod="${m.id}">${esc(m.title)}<small lang="ko">${esc(m.ko)}</small></button>`).join('');
nav.onclick = e => {
  const b = e.target.closest('[data-mod]'); if (!b) return;
  const m = modules.find(x => x.id === b.dataset.mod);
  const last = LS.get('page_' + m.id, m.pages[0].id);
  go(resolve(`${m.id}-${last}`) || `${m.id}-${m.pages[0].id}`);
};
sub.onclick = e => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); };
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

initSpeech();
show(location.hash.slice(1));
