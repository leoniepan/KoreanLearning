// 網站入口：讀取單元註冊表，產生左側單元選單、頁面上方的子頁籤，並依網址 # 切換頁面
// 網址格式：#單元id-頁面id，例如 #pron-learn、#verbs-quiz
import allModules from '../modules/registry.js';
import { $, esc } from './core/dom.js';
import { LS } from './core/storage.js';
import { initSpeech } from './core/speech.js';
import { initAccount } from './core/account.js';
import { sync, initSync, onSyncChange, setRouteInfo, pendingCount } from './core/sync.js';

// 頁面或單元可以加 visible: () => 布林值，例如管理頁只給管理者看
let modules = [];
const routes = new Map();
let first = '';
function buildRoutes() {
  modules = allModules.map(m => ({ ...m, pages: m.pages.filter(p => !p.visible || p.visible()) })).filter(m => m.pages.length && (!m.visible || m.visible()));
  routes.clear();
  modules.forEach(m => m.pages.forEach(p => routes.set(`${m.id}-${p.id}`, { m, p })));
  first = routes.keys().next().value;
}

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
  if (raw && raw !== key && location.hash.slice(1) === raw) history.replaceState(null, '', '#' + key);
  const { m, p } = routes.get(key);
  const moduleChanged = !nav.querySelector(`[data-mod="${m.id}"][aria-current="page"]`);
  LS.set('route', key); LS.set('page_' + m.id, p.id);
  setRouteInfo({ route: key, module: m.id, title: m.pages.length > 1 ? `${m.title} ${p.title}` : m.title });

  nav.querySelectorAll('[data-mod]').forEach(b => b.toggleAttribute('aria-current', false));
  nav.querySelector(`[data-mod="${m.id}"]`).setAttribute('aria-current', 'page');
  $('#page-title').innerHTML = `${esc(m.title)}<small lang="ko">${esc(m.ko)}</small>`;
  $('#tb-title').innerHTML = `${esc(m.title)}${m.pages.length > 1 ? `<small>${esc(p.title)}</small>` : ''}`;
  sub.innerHTML = m.pages.length > 1 ? m.pages.map(x => `<button type="button" class="subtab" role="tab" data-page="${m.id}-${x.id}" aria-selected="${x === p}">${esc(x.title)}</button>`).join('') : '';

  views.forEach((el, k) => { el.hidden = k !== key; });
  let el = views.get(key);
  const params = pending; pending = {};
  // fresh：每次切換到這一頁都重新產生（例如紀錄頁要顯示最新資料）
  if (!el || Object.keys(params).length || p.fresh) {
    if (!el) { el = document.createElement('div'); el.className = 'page'; view.appendChild(el); views.set(key, el); }
    el.hidden = false;
    try { p.render(el, { go, params, modules }); }
    catch (err) { el.innerHTML = `<p class="muted">這個頁面載入時發生錯誤：${esc(err.message)}</p>`; console.error(err); }
  }
  if (moduleChanged || Object.keys(params).length) window.scrollTo({ top: 0 });
}

function drawNav() {
  nav.innerHTML = `<p class="mlabel">單元</p>` + modules.map(m => `<button type="button" class="mbtn" data-mod="${m.id}"><span>${esc(m.title)}</span><small lang="ko">${esc(m.ko)}</small></button>`).join('');
}
nav.onclick = e => {
  const b = e.target.closest('[data-mod]'); if (!b) return;
  const m = modules.find(x => x.id === b.dataset.mod);
  const last = LS.get('page_' + m.id, m.pages[0].id);
  go(resolve(`${m.id}-${last}`) || `${m.id}-${m.pages[0].id}`);
  if (drawerMode()) closeMenu(false);
};
sub.onclick = e => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); };
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

// 左側欄的同步狀態
function drawSync(s) {
  const el = $('#sync'); if (!el) return;
  const n = pendingCount();
  const msg = {
    checking: ['', '檢查登入狀態…'],
    online: ['ok', n ? `已登入・${n} 筆紀錄等待上傳` : '已登入・紀錄會同步到雲端'],
    offline: ['', '離線模式・紀錄只存在這台裝置'],
    signedout: ['warn', '尚未登入・紀錄只存在這台裝置'],
    error: ['warn', '雲端紀錄暫時無法使用']
  }[s.mode] || ['', ''];
  el.className = 'sync ' + msg[0];
  el.textContent = s.error && s.mode === 'online' ? s.error : msg[1];
}

async function main() {
  initSpeech();
  initAccount();
  onSyncChange(drawSync);
  // 最多等 5 秒確認是否登入；離線版會立刻知道沒有 API
  await Promise.race([initSync(), new Promise(r => setTimeout(r, 5000))]);
  buildRoutes();
  drawNav();
  show(location.hash.slice(1));
}
main();
