// 網站入口：讀取單元註冊表，產生左側單元選單、單元橫幅、子頁籤、手機版的上方列與底部導覽列，並依網址 # 切換頁面
// 網址格式：#單元id-頁面id，例如 #pron-learn、#verbs-quiz
import allModules from '../modules/registry.js';
import { $, esc } from './core/dom.js';
import { LS } from './core/storage.js';
import { initSpeech } from './core/speech.js';
import { initAccount } from './core/account.js';
import { icon } from './core/icons.js';
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
// 舊版網址相容：舊的單元頁面現在分到「課程」「練習」「速查」裡
const LEGACY = {
  pron: 'ref-pron', pquiz: 'practice-pron', verbs: 'ref-verbs', vquiz: 'practice-words', 'questions-learn': 'course-1a', 'questions-quiz': 'practice-grammar',
  'daily-quiz': 'practice-daily', 'pron-learn': 'ref-pron', 'pron-quiz': 'practice-pron',
  'verbs-table': 'ref-verbs', 'verbs-rules': 'ref-verbs', 'verbs-cards': 'practice-words', 'verbs-quiz': 'practice-words',
  'nouns-table': 'ref-nouns', 'nouns-rules': 'ref-nouns', 'nouns-cards': 'practice-words', 'nouns-quiz': 'practice-words',
  'numbers-table': 'ref-numbers', 'numbers-usage': 'ref-numbers', 'numbers-dates': 'ref-numbers', 'numbers-money': 'ref-numbers', 'numbers-convert': 'ref-numbers', 'numbers-quiz': 'practice-numbers',
  'grammar-quiz': 'practice-grammar', 'topik-intro': 'ref-topik', 'topik-practice': 'practice-topik', 'topik-mock': 'practice-topik',
  ...Object.fromEntries(['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b'].map(b => ['grammar-' + b, 'course-' + b]))
};

const nav = $('#mods'), sub = $('#pages'), view = $('#view');
const side = $('#side'), scrim = $('#scrim'), menuBtn = $('#menu-btn'), tabbar = $('#tabbar');
const views = new Map();   // 已開過的頁面保留在畫面上（隱藏），切回來時狀態還在
let pending = {};          // 跳頁時要帶給目標頁的參數，例如 {filter:'link'}

const resolve = k => { k = LEGACY[k] || k; return routes.has(k) ? k : null; };

function go(key, params = {}) {
  pending = params;
  if (location.hash.slice(1) === key) show(key); else location.hash = key;
}
// 打開某個單元，回到上次看的那一頁
function openModule(id) {
  const m = modules.find(x => x.id === id); if (!m) return;
  const last = LS.get('page_' + m.id, m.pages[0].id);
  go(resolve(`${m.id}-${last}`) || `${m.id}-${m.pages[0].id}`);
  if (drawerMode()) closeMenu(false);
}

// ---------- 手機／平板的抽屜選單 ----------
const drawerMode = () => window.matchMedia('(max-width:900px)').matches;
function openMenu() {
  side.classList.add('open'); scrim.hidden = false; menuBtn.setAttribute('aria-expanded', 'true');
  tabbar.querySelector('[data-tab="units"]')?.setAttribute('aria-expanded', 'true');
  const cur = nav.querySelector('[aria-current="page"]'); (cur || nav.querySelector('button'))?.focus();
}
function closeMenu(focusBtn) {
  if (!side.classList.contains('open')) return;
  side.classList.remove('open'); scrim.hidden = true; menuBtn.setAttribute('aria-expanded', 'false');
  tabbar.querySelector('[data-tab="units"]')?.setAttribute('aria-expanded', 'false');
  if (focusBtn) menuBtn.focus();
}
menuBtn.onclick = () => side.classList.contains('open') ? closeMenu(true) : openMenu();
scrim.onclick = () => closeMenu(true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(true); });
window.matchMedia('(max-width:900px)').addEventListener('change', () => closeMenu(false));

// ---------- 切換頁面 ----------
function show(raw) {
  // 沒有指定頁面時打開首頁
  const key = resolve(raw) || first;
  if (raw && raw !== key && location.hash.slice(1) === raw) history.replaceState(null, '', '#' + key);
  const { m, p } = routes.get(key);
  const moduleChanged = !nav.querySelector(`[data-mod="${m.id}"][aria-current="page"]`);
  LS.set('route', key); LS.set('page_' + m.id, p.id);
  setRouteInfo({ route: key, module: p.mod || m.id, title: m.pages.length > 1 ? `${m.title} ${p.title}` : m.title });

  nav.querySelectorAll('[data-mod]').forEach(b => b.toggleAttribute('aria-current', false));
  nav.querySelector(`[data-mod="${m.id}"]`).setAttribute('aria-current', 'page');
  const isHome = m.id === 'home';
  document.body.classList.toggle('is-home', isHome);
  $('#page-head').hidden = isHome;
  $('#mhero').innerHTML = isHome ? '' : `<span class="tile big" lang="ko" aria-hidden="true">${esc(m.glyph || '가')}</span><div class="mhero-t"><h2>${esc(m.title)}<small lang="ko">${esc(m.ko)}</small></h2>${m.desc ? `<p>${esc(m.desc)}</p>` : ''}</div>`;
  $('#tb-title').innerHTML = isHome ? '<span lang="ko">발음·동사 연습장</span>' : `${esc(m.title)}${m.pages.length > 1 ? `<small>${esc(p.title)}</small>` : ''}`;
  $('#tb-back').hidden = isHome;
  const tab = isHome ? 'home' : key === 'practice-daily' ? 'daily' : m.id === 'records' ? 'records' : 'units';
  tabbar.querySelectorAll('[data-tab]').forEach(b => b.toggleAttribute('aria-current', b.dataset.tab === tab));
  sub.innerHTML = m.pages.length > 1 ? m.pages.map(x => `<button type="button" class="subtab" role="tab" data-page="${m.id}-${x.id}" aria-selected="${x === p}">${esc(x.title)}</button>`).join('') : '';

  views.forEach((el, k) => { el.hidden = k !== key; });
  let el = views.get(key);
  const params = pending; pending = {};
  // fresh：每次切換到這一頁都重新產生（例如紀錄頁要顯示最新資料）
  if (!el || Object.keys(params).length || p.fresh) {
    if (!el) { el = document.createElement('div'); el.className = 'page'; view.appendChild(el); views.set(key, el); }
    el.hidden = false;
    try { p.render(el, { go, params, modules, openModule }); }
    catch (err) { el.innerHTML = `<p class="muted">這個頁面載入時發生錯誤：${esc(err.message)}</p>`; console.error(err); }
  }
  else if (el._onShow) el._onShow();
  if (moduleChanged || Object.keys(params).length) window.scrollTo({ top: 0 });
}

function drawNav() {
  nav.innerHTML = `<p class="mlabel">選單</p>` + modules.map(m => `<button type="button" class="mbtn" data-mod="${m.id}"><span class="mi">${icon(m.icon)}</span><span class="ml">${esc(m.title)}<small lang="ko">${esc(m.ko)}</small></span></button>`).join('');
}
nav.onclick = e => { const b = e.target.closest('[data-mod]'); if (b) openModule(b.dataset.mod); };
// 手機版：上方的返回鍵、底部導覽列
$('#tb-back').onclick = () => go('home-main');
tabbar.onclick = e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  const t = b.dataset.tab;
  if (t === 'units') return side.classList.contains('open') ? closeMenu(true) : openMenu();
  closeMenu(false);
  if (t === 'home') go('home-main'); else if (t === 'daily') go('practice-daily'); else openModule(t);
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
    pending: ['warn', n ? `等待管理者核准・${n} 筆紀錄核准後上傳` : '等待管理者核准・紀錄先存在這台裝置'],
    disabled: ['warn', '帳號已停用・紀錄只存在這台裝置'],
    error: ['warn', '雲端紀錄暫時無法使用']
  }[s.mode] || ['', ''];
  el.className = 'sync ' + msg[0];
  el.textContent = s.error && s.mode === 'online' ? s.error : msg[1];
  drawAccessNote(s);
}

// 等待核准／已停用時，在每一頁最上方提示
function drawAccessNote(s) {
  const host = $('.content-inner'); if (!host) return;
  let note = $('#access-note');
  const text = {
    pending: `<b>帳號等待開通</b>　你已經用 ${esc(s.me?.email || '')} 登入，管理者核准後就會開始把紀錄存到雲端。在那之前可以照常練習，紀錄會先存在這台裝置，核准後自動補上傳。`,
    disabled: `<b>這個帳號已被停用</b>　紀錄不會再存到雲端。如果覺得有誤，請聯絡網站管理者；或<a href="/logout">登出</a>換一個帳號。`
  }[s.mode];
  if (!text) { note?.remove(); return; }
  if (!note) { note = document.createElement('div'); note.id = 'access-note'; note.className = 'banner warn'; note.setAttribute('role', 'status'); host.prepend(note); }
  note.innerHTML = text;
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
