// API 的實際邏輯。與 Azure Functions 分開，方便測試與本機模擬。
// 每個 handler 收到 { method, headers, query, params, body }，回傳 { status, jsonBody | body, headers }。
import { randomUUID } from 'node:crypto';
import { getPrincipal, isAdmin } from './auth.js';
import { mergeState } from './merge.js';
import { buildStats } from './stats.js';

const LIMITS = { answers: 30, text: 400, opts: 8, optText: 160, stateBytes: 200_000 };

const json = (status, jsonBody) => ({ status, jsonBody });
const fail = (status, message) => json(status, { error: message });

// ---------- 帳號開通狀態 ----------
// 任何 Microsoft 帳號都能登入網站，但要「已核准」才能存紀錄。狀態存在資料庫：
//   { id:'access', userId, type:'access', status:'pending'|'approved'|'disabled', email, requestedAt, decidedAt, decidedBy }
// 判斷順序（由上往下，先符合者為準）：
//   1. Azure 角色 admin            → 管理者，一定可以使用（也不能在網站裡被停用）
//   2. 資料庫狀態 disabled          → 停用
//   3. Azure 角色 learner          → 已核准（舊的 Azure 邀請仍然有效）
//   4. 資料庫狀態 approved          → 已核准
//   5. 其他                         → 等待核准
export const STATUSES = ['pending', 'approved', 'disabled'];

export function effectiveStatus(roles, accessDoc) {
  if (roles.includes('admin')) return 'admin';
  if (accessDoc?.status === 'disabled') return 'disabled';
  if (roles.includes('learner')) return 'approved';
  return accessDoc?.status === 'approved' ? 'approved' : 'pending';
}

const DENIED = { pending: '這個帳號還在等待管理者核准。', disabled: '這個帳號已被管理者停用。' };

// 共用檢查：資料庫是否設定、是否登入、是否已核准（或是管理者）
async function guard(req, store, { admin = false } = {}) {
  if (!store) return { res: fail(503, '資料庫尚未設定（缺少 COSMOS_CONNECTION）。') };
  const p = getPrincipal(req.headers);
  if (!p) return { res: fail(401, '請先登入。') };
  if (admin) return isAdmin(p) ? { p } : { res: fail(403, '只有管理者可以查看。') };
  const status = effectiveStatus(p.roles, await store.get(p.userId, 'access'));
  if (status === 'pending' || status === 'disabled') return { res: fail(403, DENIED[status]) };
  return { p };
}

// ---------- 目前登入的使用者 ----------
// 所有登入的人都可以呼叫：第一次登入時自動建立「等待核准」的申請。
export async function me(req, store) {
  if (!store) return fail(503, '資料庫尚未設定（缺少 COSMOS_CONNECTION）。');
  const p = getPrincipal(req.headers);
  if (!p) return fail(401, '請先登入。');
  const now = new Date().toISOString();
  const old = await store.get(p.userId, 'user');
  // roles：記下 Azure 指派的角色，管理頁才知道誰是透過 Azure 邀請或管理者
  const roles = p.roles.filter(r => r === 'learner' || r === 'admin');
  await store.put({ id: 'user', userId: p.userId, type: 'user', email: p.email, roles, firstSeen: old?.firstSeen || now, lastSeen: now });

  let access = await store.get(p.userId, 'access');
  if (!access && effectiveStatus(p.roles, null) === 'pending') {
    access = { id: 'access', userId: p.userId, type: 'access', status: 'pending', email: p.email, requestedAt: now };
    await store.put(access);
  }
  const status = effectiveStatus(p.roles, access);
  return json(200, { userId: p.userId, email: p.email, isAdmin: isAdmin(p), access: status === 'admin' ? 'approved' : status });
}

// ---------- 學習狀態（跨裝置同步） ----------
export async function getState(req, store) {
  const { p, res } = await guard(req, store); if (res) return res;
  const doc = await store.get(p.userId, 'state');
  return json(200, { data: doc?.data || {}, updatedAt: doc?.updatedAt || null });
}

export async function putState(req, store) {
  const { p, res } = await guard(req, store); if (res) return res;
  const incoming = req.body?.data;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return fail(400, '格式錯誤：需要 { data: {...} }。');
  if (JSON.stringify(incoming).length > LIMITS.stateBytes) return fail(413, '學習狀態太大。');
  const old = await store.get(p.userId, 'state');
  const data = mergeState(old?.data || {}, incoming);
  const updatedAt = new Date().toISOString();
  await store.put({ id: 'state', userId: p.userId, type: 'state', data, updatedAt });
  return json(200, { data, updatedAt });
}

// ---------- 測驗紀錄 ----------
const str = (v, n = LIMITS.text) => (v == null ? '' : String(v)).slice(0, n);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cleanAttempt(body) {
  if (!body || typeof body !== 'object') return null;
  if (!Array.isArray(body.answers) || !body.answers.length || body.answers.length > LIMITS.answers) return null;
  const answers = body.answers.map(a => ({
    key: str(a.key, 200),
    label: str(a.label, 120),
    prompt: str(a.prompt),
    ko: str(a.ko),
    audio: str(a.audio, 120),
    chosen: str(a.chosen, LIMITS.optText),
    correct: str(a.correct, LIMITS.optText),
    ok: a.ok === true,
    word: str(a.word, 60),
    opts: Array.isArray(a.opts) ? a.opts.slice(0, LIMITS.opts).map(o => str(o, LIMITS.optText)) : []
  }));
  if (answers.some(a => !a.key || !a.correct)) return null;
  const finished = Date.parse(body.finishedAt);
  return {
    cid: UUID.test(body.cid || '') ? body.cid.toLowerCase() : null,
    route: str(body.route, 60),
    module: str(body.module, 40),
    title: str(body.title, 120),
    total: answers.length,
    score: answers.filter(a => a.ok).length,
    finishedAt: Number.isFinite(finished) && finished <= Date.now() + 60_000 ? new Date(finished).toISOString() : new Date().toISOString(),
    answers
  };
}

export async function postAttempt(req, store) {
  const { p, res } = await guard(req, store); if (res) return res;
  const a = cleanAttempt(req.body);
  if (!a) return fail(400, '格式錯誤：需要 1～30 題的作答資料。');
  // 用前端產生的 cid 當 id：網路重送時不會重複記錄
  const id = 'a-' + (a.cid || randomUUID());
  delete a.cid;
  await store.put({ id, userId: p.userId, type: 'attempt', email: p.email, ...a });
  return json(201, { id, score: a.score, total: a.total });
}

// ---------- 統計 ----------
const tzOf = q => { const v = Number(q?.get ? q.get('tz') : q?.tz); return Number.isFinite(v) && Math.abs(v) <= 840 ? v : -480; };

export async function myStats(req, store) {
  const { p, res } = await guard(req, store); if (res) return res;
  return json(200, buildStats(await store.listAttempts(p.userId), { tz: tzOf(req.query) }));
}

// ---------- 管理（只有 admin 角色） ----------
export async function manageOverview(req, store) {
  const { res } = await guard(req, store, { admin: true }); if (res) return res;
  const [users, attempts] = await Promise.all([store.listUsers(), store.listAllAttempts()]);
  const per = new Map(users.map(u => [u.userId, { userId: u.userId, email: u.email, firstSeen: u.firstSeen, lastSeen: u.lastSeen, attempts: 0, answers: 0, correct: 0, lastAttemptAt: null }]));
  const keys = new Map();
  // 依時間先後處理，題目的單元與題型以第一次出現時為準（重練時不會被改成「錯題重練」）
  for (const at of [...attempts].reverse()) {
    const u = per.get(at.userId) || { userId: at.userId, email: at.email, attempts: 0, answers: 0, correct: 0, lastAttemptAt: null };
    per.set(at.userId, u);
    u.attempts++;
    if (!u.lastAttemptAt || at.finishedAt > u.lastAttemptAt) u.lastAttemptAt = at.finishedAt;
    for (const a of at.answers) {
      u.answers++; if (a.ok) u.correct++;
      const k = keys.get(a.key) || { key: a.key, module: at.module, label: a.label, prompt: a.prompt, ko: a.ko, correct: a.correct, word: a.word, n: 0, wrong: 0, users: new Set() };
      k.n++; if (!a.ok) { k.wrong++; k.users.add(at.userId); }
      keys.set(a.key, k);
    }
  }
  const topMissed = [...keys.values()].filter(k => k.wrong > 0 && k.n >= 2)
    .map(({ users: us, ...k }) => ({ ...k, people: us.size, rate: k.wrong / k.n }))
    .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong).slice(0, 30);
  const usersOut = [...per.values()].sort((a, b) => (b.lastAttemptAt || b.lastSeen || '').localeCompare(a.lastAttemptAt || a.lastSeen || ''));
  return json(200, { users: usersOut, topMissed, totalAttempts: attempts.length });
}

export async function manageUserStats(req, store) {
  const { res } = await guard(req, store, { admin: true }); if (res) return res;
  const userId = req.params?.userId;
  if (!userId) return fail(400, '缺少 userId。');
  const [user, attempts] = await Promise.all([store.get(userId, 'user'), store.listAttempts(userId)]);
  return json(200, { user: user ? { userId, email: user.email, firstSeen: user.firstSeen, lastSeen: user.lastSeen } : { userId }, stats: buildStats(attempts, { tz: tzOf(req.query) }) });
}

// CSV：開頭加 BOM 讓 Excel 正確顯示中文與韓文；開頭是 = + - @ 的值加上 ' 避免被當成公式
const csvCell = v => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
export async function manageExport(req, store) {
  const { res } = await guard(req, store, { admin: true }); if (res) return res;
  const attempts = await store.listAllAttempts(20000);
  const rows = [['作答時間', '帳號', '單元', '測驗', '題型', '題目', '韓文', '選擇', '正確答案', '對錯', '題目代號']];
  for (const at of attempts) for (const a of at.answers) rows.push([at.finishedAt, at.email, at.module, at.title, a.label, a.prompt, a.ko, a.chosen, a.correct, a.ok ? '對' : '錯', a.key]);
  const body = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
  return { status: 200, body, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="korean-records.csv"' } };
}

// ---------- 帳號管理（只有 admin 角色） ----------
// 列出所有登入過的帳號與開通狀態；等待核准的排最前面
export async function manageAccounts(req, store) {
  const { res } = await guard(req, store, { admin: true }); if (res) return res;
  const [users, access] = await Promise.all([store.listUsers(), store.listByType('access')]);
  const byId = new Map(access.map(a => [a.userId, a]));
  const ORDER = { pending: 0, approved: 1, disabled: 2, admin: 3 };
  const accounts = users.map(u => {
    const a = byId.get(u.userId);
    const roles = Array.isArray(u.roles) ? u.roles : [];
    return {
      userId: u.userId,
      email: u.email || a?.email || '',
      status: effectiveStatus(roles, a),
      viaInvite: roles.includes('learner'),
      requestedAt: a?.requestedAt || u.firstSeen || null,
      decidedAt: a?.decidedAt || null,
      decidedBy: a?.decidedBy || null,
      lastSeen: u.lastSeen || null
    };
  }).sort((x, y) => ORDER[x.status] - ORDER[y.status] || (y.requestedAt || '').localeCompare(x.requestedAt || ''));
  return json(200, { accounts, pending: accounts.filter(a => a.status === 'pending').length });
}

// 變更某個帳號的狀態：{ status: 'approved' | 'disabled' | 'pending' }
export async function manageSetAccess(req, store) {
  const { p, res } = await guard(req, store, { admin: true }); if (res) return res;
  const userId = req.params?.userId;
  const status = req.body?.status;
  if (!userId) return fail(400, '缺少 userId。');
  if (!STATUSES.includes(status)) return fail(400, '狀態只能是 approved、disabled 或 pending。');
  if (userId === p.userId) return fail(400, '不能變更自己的帳號狀態。');
  const user = await store.get(userId, 'user');
  if (!user) return fail(404, '找不到這個帳號（對方需要先登入過一次）。');
  if (Array.isArray(user.roles) && user.roles.includes('admin')) return fail(400, '管理者的權限請到 Azure 的「角色管理」調整。');
  const old = await store.get(userId, 'access');
  const now = new Date().toISOString();
  const doc = {
    id: 'access', userId, type: 'access', status,
    email: user.email || old?.email || '',
    requestedAt: old?.requestedAt || user.firstSeen || now,
    decidedAt: now,
    decidedBy: p.email
  };
  await store.put(doc);
  return json(200, { userId, status: effectiveStatus(user.roles || [], doc) });
}
