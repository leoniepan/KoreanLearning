// 網站入口：讀取單元註冊表，產生上方的問候與單元選單、單元橫幅、子頁籤，並依網址 # 切換頁面
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
// 舊版網址相容：舊的單元頁面現在分到「課程」「練習」「TOPIK」「其他」裡
const LEGACY = {
  pron: 'ref-pron', pquiz: 'practice-pron', verbs: 'ref-verbs', vquiz: 'practice-words', 'questions-learn': 'course-1a', 'questions-quiz': 'practice-grammar',
  'daily-quiz': 'practice-daily', 'pron-learn': 'ref-pron', 'pron-quiz': 'practice-pron',
  'verbs-table': 'ref-verbs', 'verbs-rules': 'ref-verbs', 'verbs-cards': 'practice-words', 'verbs-quiz': 'practice-words',
  'nouns-table': 'ref-nouns', 'nouns-rules': 'ref-nouns', 'nouns-cards': 'practice-words', 'nouns-quiz': 'practice-words',
  'numbers-table': 'ref-numbers', 'numbers-usage': 'ref-numbers', 'numbers-dates': 'ref-numbers', 'numbers-money': 'ref-numbers', 'numbers-convert': 'ref-numbers', 'numbers-quiz': 'practice-numbers',
  'grammar-quiz': 'practice-grammar', 'ref-topik': 'topik-intro', 'practice-topik': 'topik-practice',
  ...Object.fromEntries(['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b'].map(b => ['grammar-' + b, 'course-' + b]))
};

const nav = $('#mods'), sub = $('#pages'), view = $('#view');
const tabbar = $('#tabbar');
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
}

// ---------- 右上角「語音設定」小視窗（朗讀速度、韓文語音） ----------
const voiceBtn = $('#voice-btn'), voicePanel = $('#voice-panel');
function setVoicePanel(open) {
  voicePanel.hidden = !open; voiceBtn.setAttribute('aria-expanded', String(open));
}
voiceBtn.onclick = e => { e.stopPropagation(); setVoicePanel(voicePanel.hidden); };
document.addEventListener('click', e => { if (!voicePanel.hidden && !e.target.closest('.pop')) setVoicePanel(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !voicePanel.hidden) { setVoicePanel(false); voiceBtn.focus(); } });

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
  const cur = nav.querySelector(`[data-mod="${m.id}"]`);
  cur.setAttribute('aria-current', 'page');
  cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const isHome = m.id === 'home';
  document.body.classList.toggle('is-home', isHome);
  document.body.dataset.mod = m.id;   // 讓外觀主題可以依單元換顏色
  $('#page-head').hidden = isHome;
  $('#mhero').innerHTML = isHome ? '' : `<span class="tile big" lang="ko" aria-hidden="true">${esc(m.glyph || '가')}</span><div class="mhero-t"><h2>${esc(m.title)}<small lang="ko">${esc(m.ko)}</small></h2>${m.desc ? `<p>${esc(m.desc)}</p>` : ''}</div>`;
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
  nav.innerHTML = `<div class="topnav-in">${modules.map(m => `<button type="button" class="mbtn" data-mod="${m.id}"><span class="mi">${icon(m.icon)}</span><span class="ml">${esc(m.title)}<small lang="ko">${esc(m.ko)}</small></span></button>`).join('')}</div>`;
}
nav.onclick = e => { const b = e.target.closest('[data-mod]'); if (b) openModule(b.dataset.mod); };
// 手機版底部導覽列：首頁、單元（捲回上方選單）、今日測驗、紀錄
tabbar.onclick = e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  const t = b.dataset.tab;
  if (t === 'units') { window.scrollTo({ top: 0, behavior: 'smooth' }); nav.querySelector('[aria-current="page"]')?.focus({ preventScroll: true }); return; }
  if (t === 'home') go('home-main'); else if (t === 'daily') go('practice-daily'); else openModule(t);
};
sub.onclick = e => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); };
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

// 右上角的同步狀態，以及問候語裡的名字
function drawSync(s) {
  const h = $('#hello-h');
  if (h) h.textContent = `안녕하세요，${s.me?.email ? s.me.email.split('@')[0] : '同學'}`;
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
