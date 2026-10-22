// 學習紀錄與跨裝置同步。
//
// 在 Azure 上登入時（線上模式）：
//   - 每做完一回測驗，就把每一題的作答上傳到 /api/attempts
//   - 學習進度、最佳分數、自訂單字等存在 /api/state，換裝置登入會自動合併回來
//   - 網路斷線時先暫存在這台裝置，下次連線再補送
// 沒有 API 時（GitHub Pages、本機預覽、Claude 上的版本）＝離線模式：
//   - 紀錄只存在這台裝置的瀏覽器，「我的紀錄」用本機資料計算
import { LS, onSet } from './storage.js';
import { mergeState } from './merge.js';
import { buildStats } from './stats.js';

// 需要跨裝置同步的學習狀態（語速、目前頁面這類只跟這台裝置有關的設定不同步）
const SYNCED = /^(done.*|best_.*|daily_log|daily_best_.*|custom|custom_nouns|lesson.*|progress)$/;
const MAX_LOCAL = 300;   // 這台裝置最多保留幾回測驗紀錄

export const sync = { mode: 'checking', me: null, error: null };
const listeners = new Set();
export const onSyncChange = fn => { listeners.add(fn); fn(sync); };
const emit = () => listeners.forEach(fn => { try { fn(sync); } catch (e) { } });
let route = { route: '', module: '', title: '' };
export const setRouteInfo = r => { route = r; };

// ---------- API ----------
async function api(path, { method = 'GET', body, timeout = 8000 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(path, { method, signal: ctl.signal, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json') && !ct.includes('csv')) throw Object.assign(new Error('not api'), { status: res.status, notApi: true });
    const data = ct.includes('csv') ? await res.text() : await res.json();
    if (!res.ok) throw Object.assign(new Error(data?.error || ('HTTP ' + res.status)), { status: res.status });
    return data;
  } finally { clearTimeout(t); }
}
export const apiGet = path => api(path);
export async function apiDownload(path) {
  const res = await fetch(path, { credentials: 'same-origin' });
  if (!res.ok) throw new Error('下載失敗（HTTP ' + res.status + '）');
  return res.blob();
}

// ---------- 啟動：判斷線上／離線，合併學習狀態，補送暫存紀錄 ----------
export async function initSync() {
  try {
    sync.me = await api('/api/me', { timeout: 4000 });
    sync.mode = 'online';
  } catch (e) {
    sync.mode = e.status === 401 || e.status === 403 ? 'signedout' : e.status === 503 ? 'error' : 'offline';
    sync.error = e.notApi ? null : e.message;
    emit();
    return sync;
  }
  emit();
  try {
    const remote = await api('/api/state');
    const local = collectState();
    // 這台裝置上的新進度合併到雲端的資料上；自訂單字第一次合併時取聯集，避免任一邊不見
    const merged = mergeState(remote.data, local);
    for (const k of ['custom', 'custom_nouns']) merged[k] = unionBy(remote.data[k], local[k]);
    for (const [k, v] of Object.entries(merged)) if (v !== undefined) LS.set(k, v, { silent: true });
    await api('/api/state', { method: 'PUT', body: { data: merged } });
  } catch (e) { sync.error = '學習進度同步失敗：' + e.message; }
  await flush();
  emit();
  return sync;
}

function collectState() {
  const out = {};
  for (const k of LS.keys()) if (SYNCED.test(k)) out[k] = LS.get(k);
  return out;
}
function unionBy(a, b) {
  if (!Array.isArray(a) && !Array.isArray(b)) return undefined;
  const m = new Map();
  for (const x of [...(a || []), ...(b || [])]) if (x && x.k) m.set(x.k, x);
  return [...m.values()];
}

// 學習狀態改變時，2 秒後上傳（連續改動只上傳一次）
let pushTimer = null;
onSet(k => {
  if (sync.mode !== 'online' || !SYNCED.test(k)) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try { await api('/api/state', { method: 'PUT', body: { data: collectState() } }); }
    catch (e) { sync.error = '學習進度同步失敗：' + e.message; emit(); }
  }, 2000);
});

// ---------- 測驗紀錄 ----------
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));

export function recordAttempt(answers) {
  if (!answers.length) return;
  const at = { cid: uuid(), ...route, finishedAt: new Date().toISOString(), answers };
  // 這台裝置的紀錄（離線模式的「我的紀錄」用這份）
  const local = { id: 'a-' + at.cid, ...at, total: answers.length, score: answers.filter(a => a.ok).length };
  LS.set('history', [local, ...LS.get('history', [])].slice(0, MAX_LOCAL), { silent: true });
  if (sync.mode === 'online') {
    LS.set('outbox', [...LS.get('outbox', []), at].slice(-MAX_LOCAL), { silent: true });
    flush();
  }
  emit();
}

let flushing = false;
export async function flush() {
  if (flushing || sync.mode !== 'online') return;
  flushing = true;
  try {
    let box = LS.get('outbox', []);
    while (box.length) {
      try { await api('/api/attempts', { method: 'POST', body: box[0] }); }
      catch (e) {
        if (e.status === 400 || e.status === 413) { /* 資料本身有問題，丟掉以免卡住 */ }
        else { sync.error = '有紀錄還沒上傳，稍後會自動重試。'; break; }
      }
      box = box.slice(1);
      LS.set('outbox', box, { silent: true });
    }
    if (!box.length) sync.error = null;
  } finally { flushing = false; emit(); }
}
export const pendingCount = () => LS.get('outbox', []).length;
window.addEventListener('online', () => flush());
setInterval(() => { if (pendingCount()) flush(); }, 60_000);

// ---------- 統計：線上用伺服器的完整紀錄，離線用這台裝置的紀錄 ----------
const TZ = () => new Date().getTimezoneOffset();
export async function myStats() {
  if (sync.mode === 'online') {
    await flush();
    return api('/api/stats?tz=' + TZ());
  }
  return buildStats(LS.get('history', []), { tz: TZ() });
}
