import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MemoryStore } from '../src/lib/memory-store.js';
import { encodePrincipal, getPrincipal } from '../src/lib/auth.js';
import { mergeState } from '../src/lib/merge.js';
import * as h from '../src/lib/handlers.js';

const hdr = (o) => ({ 'x-ms-client-principal': encodePrincipal(o) });
const ANNA = hdr({ userId: 'u-anna', email: 'anna@example.com' });
const BEN = hdr({ userId: 'u-ben', email: 'ben@example.com' });
const ADMIN = hdr({ userId: 'u-admin', email: 'me@example.com', roles: ['anonymous', 'authenticated', 'learner', 'admin'] });
const STRANGER = hdr({ userId: 'u-x', email: 'x@example.com', roles: ['anonymous', 'authenticated'] });

const ans = (key, ok, extra = {}) => ({ key, label: '選出正確變化', prompt: '먹다 吃 請選出 過去式', chosen: ok ? '먹었어요' : '먹았어요', correct: '먹었어요', ok, opts: ['먹었어요', '먹았어요'], ...extra });
const attempt = (answers, extra = {}) => ({ route: 'verbs-quiz', module: 'verbs', title: '動詞・形容詞 測驗', finishedAt: new Date().toISOString(), answers, ...extra });

test('沒有登入資訊 → 401；沒有 learner 角色 → 403；資料庫未設定 → 503', async () => {
  const s = new MemoryStore();
  assert.equal((await h.me({ headers: {} }, s)).status, 401);
  assert.equal((await h.me({ headers: STRANGER }, s)).status, 403);
  assert.equal((await h.me({ headers: ANNA }, null)).status, 503);
});

test('壞掉的登入標頭不會讓 API 出錯', () => {
  assert.equal(getPrincipal({ 'x-ms-client-principal': '%%%not-base64' }), null);
  assert.equal(getPrincipal({ 'x-ms-client-principal': Buffer.from('{"a":1}').toString('base64') }), null);
});

test('/me 會建立使用者並保留第一次登入時間', async () => {
  const s = new MemoryStore();
  const r1 = await h.me({ headers: ANNA }, s);
  assert.equal(r1.status, 200);
  assert.deepEqual(r1.jsonBody, { userId: 'u-anna', email: 'anna@example.com', isAdmin: false });
  const first = (await s.get('u-anna', 'user')).firstSeen;
  await new Promise(r => setTimeout(r, 5));
  await h.me({ headers: ANNA }, s);
  const u = await s.get('u-anna', 'user');
  assert.equal(u.firstSeen, first);
  assert.ok(u.lastSeen >= first);
  assert.equal((await h.me({ headers: ADMIN }, s)).jsonBody.isAdmin, true);
});

test('作答紀錄：分數由伺服器重新計算，同一個 cid 重送不會重複', async () => {
  const s = new MemoryStore();
  const cid = '11111111-2222-4333-8444-555555555555';
  const body = attempt([ans('k1', true), ans('k2', false)], { cid, score: 99 });
  const r = await h.postAttempt({ headers: ANNA, body }, s);
  assert.equal(r.status, 201);
  assert.equal(r.jsonBody.score, 1);
  await h.postAttempt({ headers: ANNA, body }, s);
  assert.equal((await s.listAttempts('u-anna')).length, 1);
});

test('作答紀錄：格式錯誤與過大的資料會被拒絕', async () => {
  const s = new MemoryStore();
  assert.equal((await h.postAttempt({ headers: ANNA, body: {} }, s)).status, 400);
  assert.equal((await h.postAttempt({ headers: ANNA, body: attempt([]) }, s)).status, 400);
  assert.equal((await h.postAttempt({ headers: ANNA, body: attempt(Array.from({ length: 31 }, (_, i) => ans('k' + i, true))) }, s)).status, 400);
  assert.equal((await h.postAttempt({ headers: ANNA, body: attempt([{ key: 'k', ok: true }]) }, s)).status, 400);
  const long = 'ㄱ'.repeat(5000);
  await h.postAttempt({ headers: ANNA, body: attempt([ans('k', true, { prompt: long })]) }, s);
  const [saved] = await s.listAttempts('u-anna');
  assert.ok(saved.answers[0].prompt.length <= 400);
});

test('統計與錯題本：最近一次答錯才留在錯題本，重練答對就移出', async () => {
  const s = new MemoryStore();
  const t0 = Date.now() - 3600_000;
  await h.postAttempt({ headers: ANNA, body: attempt([ans('k1', false), ans('k2', false), ans('k3', true)], { finishedAt: new Date(t0).toISOString() }) }, s);
  await h.postAttempt({ headers: ANNA, body: attempt([ans('k1', true)], { finishedAt: new Date(t0 + 60_000).toISOString() }) }, s);
  const r = await h.myStats({ headers: ANNA, query: new URLSearchParams('tz=-480') }, s);
  assert.equal(r.status, 200);
  const st = r.jsonBody;
  assert.deepEqual(st.totals, { attempts: 2, answers: 4, correct: 2 });
  assert.deepEqual(st.mistakes.map(m => m.key), ['k2']);
  assert.equal(st.byModule[0].module, 'verbs');
  assert.equal(st.daily.reduce((n, d) => n + d.answers, 0), 4);
});

test('每個人只看得到自己的紀錄', async () => {
  const s = new MemoryStore();
  await h.postAttempt({ headers: ANNA, body: attempt([ans('k1', false)]) }, s);
  const ben = await h.myStats({ headers: BEN, query: new URLSearchParams() }, s);
  assert.equal(ben.jsonBody.totals.attempts, 0);
  assert.equal(ben.jsonBody.mistakes.length, 0);
});

test('管理端點只有 admin 可以使用', async () => {
  const s = new MemoryStore();
  for (const fn of [h.manageOverview, h.manageExport]) {
    assert.equal((await fn({ headers: ANNA }, s)).status, 403);
    assert.equal((await fn({ headers: ADMIN }, s)).status, 200);
  }
  assert.equal((await h.manageUserStats({ headers: ANNA, params: { userId: 'u-anna' } }, s)).status, 403);
});

test('管理總覽：每位使用者的統計與最多人答錯的題目', async () => {
  const s = new MemoryStore();
  await h.me({ headers: ANNA }, s); await h.me({ headers: BEN }, s);
  await h.postAttempt({ headers: ANNA, body: attempt([ans('hard', false), ans('easy', true)]) }, s);
  await h.postAttempt({ headers: BEN, body: attempt([ans('hard', false), ans('easy', true)]) }, s);
  const o = (await h.manageOverview({ headers: ADMIN }, s)).jsonBody;
  assert.equal(o.users.length, 2);
  const anna = o.users.find(u => u.email === 'anna@example.com');
  assert.deepEqual([anna.attempts, anna.answers, anna.correct], [1, 2, 1]);
  assert.equal(o.topMissed[0].key, 'hard');
  assert.equal(o.topMissed[0].people, 2);
  assert.ok(!o.topMissed.some(k => k.key === 'easy'));
  const u = (await h.manageUserStats({ headers: ADMIN, params: { userId: 'u-ben' }, query: new URLSearchParams() }, s)).jsonBody;
  assert.equal(u.user.email, 'ben@example.com');
  assert.equal(u.stats.mistakes[0].key, 'hard');
});

test('匯出 CSV：含 BOM、跳脫逗號與引號、防止公式注入', async () => {
  const s = new MemoryStore();
  await h.postAttempt({ headers: ANNA, body: attempt([ans('k', false, { prompt: '=HYPERLINK("x")', chosen: 'a,"b"' })]) }, s);
  const r = await h.manageExport({ headers: ADMIN }, s);
  assert.equal(r.status, 200);
  assert.ok(r.body.startsWith('﻿作答時間'));
  assert.match(r.headers['Content-Type'], /text\/csv/);
  assert.ok(r.body.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(r.body.includes('"a,""b"""'));
});

test('學習狀態：兩台裝置的進度會合併而不是互相覆蓋', async () => {
  const s = new MemoryStore();
  await h.putState({ headers: ANNA, body: { data: { done: ['batchim', 'link'], best_pq_all: 7, daily_log: { '2026-10-20': 6 }, custom: [{ k: '타다' }] } } }, s);
  const r = await h.putState({ headers: ANNA, body: { data: { done: ['link', 'h'], best_pq_all: 5, daily_log: { '2026-10-20': 9, '2026-10-21': 4 }, custom: [] } } }, s);
  const d = r.jsonBody.data;
  assert.deepEqual(d.done.sort(), ['batchim', 'h', 'link']);
  assert.equal(d.best_pq_all, 7);
  assert.deepEqual(d.daily_log, { '2026-10-20': 9, '2026-10-21': 4 });
  assert.deepEqual(d.custom, [], '自訂單字以較新的一方為準，刪除才能同步');
  assert.equal((await h.getState({ headers: BEN }, s)).jsonBody.updatedAt, null);
  assert.equal((await h.putState({ headers: ANNA, body: { data: [] } }, s)).status, 400);
});

test('合併規則單元測試', () => {
  assert.deepEqual(mergeState({ lesson: 5 }, { lesson: 2 }), { lesson: 2 });
  assert.deepEqual(mergeState({ a: 'x' }, { b: 1 }), { a: 'x', b: 1 });
});

test('前端與 API 共用的程式必須完全相同', () => {
  for (const f of ['merge.js', 'stats.js']) {
    const api = readFileSync(new URL('../src/lib/' + f, import.meta.url), 'utf8');
    const web = readFileSync(new URL('../../js/core/' + f, import.meta.url), 'utf8');
    assert.equal(web, api, `js/core/${f} 和 api/src/lib/${f} 不一致`);
  }
});
