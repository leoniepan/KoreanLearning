// 把 handlers.js 的邏輯註冊成 Azure Functions 的 HTTP 端點。
// 網址前面會自動加上 /api，例如 route 'me' → /api/me。
// 注意：Azure Functions 不允許以 admin 開頭的路由，所以管理端點用 manage/。
import { app } from '@azure/functions';
import { getStore } from '../lib/store.js';
import * as h from '../lib/handlers.js';

function wrap(fn) {
  return async (request, context) => {
    let body;
    if (request.method === 'POST' || request.method === 'PUT') {
      try { body = await request.json(); } catch { return { status: 400, jsonBody: { error: '格式錯誤：需要 JSON。' } }; }
    }
    try {
      return await fn({ method: request.method, headers: request.headers, query: request.query, params: request.params, body }, getStore());
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: '伺服器發生錯誤，請稍後再試。' } };
    }
  };
}

const reg = (name, methods, route, fn) => app.http(name, { methods, authLevel: 'anonymous', route, handler: wrap(fn) });

reg('me', ['GET'], 'me', h.me);
reg('getState', ['GET'], 'state', h.getState);
reg('putState', ['PUT'], 'state', h.putState);
reg('postAttempt', ['POST'], 'attempts', h.postAttempt);
reg('myStats', ['GET'], 'stats', h.myStats);
reg('manageOverview', ['GET'], 'manage/overview', h.manageOverview);
reg('manageUserStats', ['GET'], 'manage/users/{userId}/stats', h.manageUserStats);
reg('manageExport', ['GET'], 'manage/export', h.manageExport);
reg('manageAccounts', ['GET'], 'manage/accounts', h.manageAccounts);
reg('manageSetAccess', ['POST'], 'manage/accounts/{userId}', h.manageSetAccess);
