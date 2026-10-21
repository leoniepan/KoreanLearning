// API 的實際邏輯。與 Azure Functions 分開，方便測試與本機模擬。
// 每個 handler 收到 { method, headers, query, params, body }，回傳 { status, jsonBody | body, headers }。
import { randomUUID } from 'node:crypto';
import { getPrincipal, isLearner, isAdmin } from './auth.js';
import { mergeState } from './merge.js';
import { buildStats } from './stats.js';

const LIMITS = { answers: 30, text: 400, opts: 8, optText: 160, stateBytes: 200_000 };

const json = (status, jsonBody) => ({ status, jsonBody });
const fail = (status, message) => json(status, { error: message });

// 共用檢查：資料庫是否設定、是否登入、是否有權限
function guard(req, store, { admin = false } = {}) {
  if (!store) return { res: fail(503, '資料庫尚未設定（缺少 COSMOS_CONNECTION）。') };
  const p = getPrincipal(req.headers);
  if (!p) return { res: fail(401, '請先登入。') };
  if (!isLearner(p)) return { res: fail(403, '這個帳號還沒有使用權限。') };
  if (admin && !isAdmin(p)) return { res: fail(403, '只有管理者可以查看。') };
  return { p };
}

// ---------- 目前登入的使用者 ----------
export async function me(req, store) {
  const { p, res } = guard(req, store); if (res) return res;
  const now = new Date().toISOString();
  const old = await store.get(p.userId, 'user');
  await store.put({ id: 'user', userId: p.userId, type: 'user', email: p.email, firstSeen: old?.firstSeen || now, lastSeen: now });
  return json(200, { userId: p.userId, email: p.email, isAdmin: isAdmin(p) });
}

// ---------- 學習狀態（跨裝置同步） ----------
export async function getState(req, store) {
  const { p, res } = guard(req, store); if (res) return res;
  const doc = await store.get(p.userId, 'state');
  return json(200, { data: doc?.data || {}, updatedAt: doc?.updatedAt || null });
}

export async function putState(req, store) {
  const { p, res } = guard(req, store); if (res) return res;
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
  const { p, res } = guard(req, store); if (res) return res;
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
  const { p, res } = guard(req, store); if (res) return res;
  return json(200, buildStats(await store.listAttempts(p.userId), { tz: tzOf(req.query) }));
}

// ---------- 管理（只有 admin 角色） ----------
export async function manageOverview(req, store) {
  const { res } = guard(req, store, { admin: true }); if (res) return res;
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
  const { res } = guard(req, store, { admin: true }); if (res) return res;
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
  const { res } = guard(req, store, { admin: true }); if (res) return res;
  const attempts = await store.listAllAttempts(20000);
  const rows = [['作答時間', '帳號', '單元', '測驗', '題型', '題目', '韓文', '選擇', '正確答案', '對錯', '題目代號']];
  for (const at of attempts) for (const a of at.answers) rows.push([at.finishedAt, at.email, at.module, at.title, a.label, a.prompt, a.ko, a.chosen, a.correct, a.ok ? '對' : '錯', a.key]);
  const body = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
  return { status: 200, body, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="korean-records.csv"' } };
}
