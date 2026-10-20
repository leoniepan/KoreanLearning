// 網站入口：讀取單元註冊表，產生左側單元選單、頁面上方的子頁籤，並依網址 # 切換頁面
// 網址格式：#單元id-頁面id，例如 #pron-learn、#verbs-quiz
import modules from '../modules/registry.js';
import { $, esc } from './core/dom.js';
import { LS } from './core/storage.js';
import { initSpeech } from './core/speech.js';
import { initAccount } from './core/account.js';

const routes = new Map();
modules.forEach(m => m.pages.forEach(p => routes.set(`${m.id}-${p.id}`, { m, p })));
const first = routes.keys().next().value;
// 舊版網址相容
const LEGACY = { pron: 'pron-learn', pquiz: 'pron-quiz', verbs: 'verbs-table', vquiz: 'verbs-quiz', 'questions-learn': 'grammar-1a', 'questions-quiz': 'grammar-quiz' };

const nav = $('#mods'), sub = $('#pages'), view = $('#view');
const side = $('#side'), scrim = $('#scrim'), menuBtn = $('#menu-btn');
const views = new Map();   // 已開過的頁面保留在畫面上（隱藏），切回來時狀態還在
let pending = {};          // 跳頁時要帶給目標頁的參數，例如 {filter:'link'}

const resolve = k => { k = LEGACY[k] || k; return routes.has(k) ? k : null; };

function go(key, params = {}) {
  pending = params;
  if (location.hash.slice(1) === key) show(key); else location.hash = key;
}

// ---------- 手機／平板的抽屜選單 ----------
const drawerMode = () => window.matchMedia('(max-width:900px)').matches;
function openMenu() {
  side.classList.add('open'); scrim.hidden = false; menuBtn.setAttribute('aria-expanded', 'true');
  const cur = nav.querySelector('[aria-current="page"]'); (cur || nav.querySelector('button'))?.focus();
}
function closeMenu(focusBtn) {
  if (!side.classList.contains('open')) return;
  side.classList.remove('open'); scrim.hidden = true; menuBtn.setAttribute('aria-expanded', 'false');
  if (focusBtn) menuBtn.focus();
}
menuBtn.onclick = () => side.classList.contains('open') ? closeMenu(true) : openMenu();
scrim.onclick = () => closeMenu(true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(true); });
window.matchMedia('(max-width:900px)').addEventListener('change', () => closeMenu(false));

// ---------- 切換頁面 ----------
function show(raw) {
  const key = resolve(raw) || resolve(LS.get('route', '')) || first;
  const { m, p } = routes.get(key);
  const moduleChanged = !nav.querySelector(`[data-mod="${m.id}"][aria-current="page"]`);
  LS.set('route', key); LS.set('page_' + m.id, p.id);

  nav.querySelectorAll('[data-mod]').forEach(b => b.toggleAttribute('aria-current', false));
  nav.querySelector(`[data-mod="${m.id}"]`).setAttribute('aria-current', 'page');
  $('#page-title').innerHTML = `${esc(m.title)}<small lang="ko">${esc(m.ko)}</small>`;
  $('#tb-title').innerHTML = `${esc(m.title)}${m.pages.length > 1 ? `<small>${esc(p.title)}</small>` : ''}`;
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

nav.innerHTML = `<p class="mlabel">單元</p>` + modules.map(m => `<button type="button" class="mbtn" data-mod="${m.id}"><span>${esc(m.title)}</span><small lang="ko">${esc(m.ko)}</small></button>`).join('');
nav.onclick = e => {
  const b = e.target.closest('[data-mod]'); if (!b) return;
  const m = modules.find(x => x.id === b.dataset.mod);
  const last = LS.get('page_' + m.id, m.pages[0].id);
  go(resolve(`${m.id}-${last}`) || `${m.id}-${m.pages[0].id}`);
  if (drawerMode()) closeMenu(false);
};
sub.onclick = e => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); };
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

initSpeech();
initAccount();
show(location.hash.slice(1));
