// 本機模擬伺服器：不用 Azure 也能在自己電腦上測試登入、紀錄同步、錯題本與管理頁。
//
//   cd api && npm install && cd ..
//   node tools/dev-server.mjs           → 打開 http://localhost:4280
//
// - 靜態檔案直接從專案資料夾提供
// - /api/* 交給 api/src/lib/handlers.js 處理，資料存在 tools/.devdata.json（記憶體版資料庫）
// - 模擬 Azure 的登入：預設以 me@example.com（管理者）登入
//   新使用者自行登入（等待核准）：http://localhost:4280/.dev/login?email=anna@example.com
//   透過 Azure 邀請的使用者（learner 角色）：http://localhost:4280/.dev/login?email=anna@example.com&invite=1
//   切換成管理者：http://localhost:4280/.dev/login?email=me@example.com&admin=1
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MemoryStore } from '../api/src/lib/memory-store.js';
import { encodePrincipal } from '../api/src/lib/auth.js';
import * as h from '../api/src/lib/handlers.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = fileURLToPath(new URL('./.devdata.json', import.meta.url));
const PORT = Number(process.env.PORT || 4280);
const DEFAULT = { email: process.env.DEV_EMAIL || 'me@example.com', admin: process.env.DEV_ADMIN !== '0' };

let saveTimer;
const store = new MemoryStore(existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : [], s => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeFile(DATA, JSON.stringify(s.all(), null, 1)), 300);
});

const routes = [
  ['GET', /^\/api\/me$/, h.me],
  ['GET', /^\/api\/state$/, h.getState],
  ['PUT', /^\/api\/state$/, h.putState],
  ['POST', /^\/api\/attempts$/, h.postAttempt],
  ['GET', /^\/api\/stats$/, h.myStats],
  ['GET', /^\/api\/manage\/overview$/, h.manageOverview, true],
  ['GET', /^\/api\/manage\/users\/([^/]+)\/stats$/, h.manageUserStats, true],
  ['GET', /^\/api\/manage\/export$/, h.manageExport, true],
  ['GET', /^\/api\/manage\/accounts$/, h.manageAccounts, true],
  ['POST', /^\/api\/manage\/accounts\/([^/]+)$/, h.manageSetAccess, true]
];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };

function currentUser(req) {
  const c = Object.fromEntries((req.headers.cookie || '').split(';').map(s => s.trim().split('=').map(decodeURIComponent)).filter(p => p[0]));
  if (c.devuser === '') return null;
  const email = c.devuser || DEFAULT.email;
  const admin = c.devuser ? c.devadmin === '1' : DEFAULT.admin;
  const invited = c.devuser ? c.devinvite === '1' : true;
  return { userId: 'dev-' + email.replace(/[^a-z0-9]/gi, '_'), email, roles: ['anonymous', 'authenticated', ...(invited ? ['learner'] : []), ...(admin ? ['admin'] : [])] };
}

const send = (res, status, body, headers = {}) => { res.writeHead(status, headers); res.end(body); };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const user = currentUser(req);
  try {
    if (url.pathname === '/.dev/login') {
      const email = url.searchParams.get('email') || DEFAULT.email;
      return send(res, 302, '', { 'Set-Cookie': [`devuser=${encodeURIComponent(email)}; Path=/`, `devadmin=${url.searchParams.get('admin') === '1' ? '1' : '0'}; Path=/`, `devinvite=${url.searchParams.get('invite') === '1' ? '1' : '0'}; Path=/`], Location: '/' });
    }
    if (url.pathname === '/logout' || url.pathname === '/.dev/logout') return send(res, 302, '', { 'Set-Cookie': 'devuser=; Path=/', Location: '/' });
    if (url.pathname === '/.auth/me') {
      return send(res, 200, JSON.stringify({ clientPrincipal: user ? { identityProvider: 'aad', userId: user.userId, userDetails: user.email, userRoles: user.roles } : null }), { 'Content-Type': 'application/json' });
    }
    if (url.pathname.startsWith('/api/')) {
      const r = routes.find(([m, re]) => m === req.method && re.test(url.pathname));
      if (!r) return send(res, 404, JSON.stringify({ error: '找不到這個 API。' }), { 'Content-Type': 'application/json' });
      let body;
      if (req.method === 'POST' || req.method === 'PUT') {
        const chunks = []; for await (const c of req) chunks.push(c);
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'); } catch { return send(res, 400, JSON.stringify({ error: '格式錯誤：需要 JSON。' }), { 'Content-Type': 'application/json' }); }
      }
      const m = url.pathname.match(r[1]);
      const headers = user ? { 'x-ms-client-principal': encodePrincipal(user) } : {};
      const out = await r[2]({ method: req.method, headers, query: url.searchParams, params: m[1] ? { userId: decodeURIComponent(m[1]) } : {}, body }, store);
      if (out.jsonBody !== undefined) return send(res, out.status, JSON.stringify(out.jsonBody), { 'Content-Type': 'application/json; charset=utf-8' });
      return send(res, out.status, out.body, out.headers);
    }
    // 靜態檔案
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    if (p === '' || p.endsWith('/')) p += 'index.html';
    const file = join(ROOT, p);
    if (!file.startsWith(ROOT) || p.split(/[/\\]/).some(seg => seg.startsWith('.') || seg === 'node_modules')) return send(res, 404, 'Not found');
    const data = await readFile(file);
    send(res, 200, data, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  } catch (e) {
    if (e.code === 'ENOENT') return send(res, 404, 'Not found');
    console.error(e); send(res, 500, 'Server error');
  }
}).listen(PORT, () => console.log(`本機模擬伺服器：http://localhost:${PORT}　（目前使用者：${DEFAULT.email}${DEFAULT.admin ? '，管理者' : ''}）`));
