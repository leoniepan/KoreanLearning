// 瀏覽器 localStorage 包裝。所有鍵都會加上 krpv_ 前綴，讀寫失敗時不會讓頁面壞掉。
// 寫入時會通知 sync.js，需要跨裝置同步的資料就會排程上傳。
const P = 'krpv_';
const listeners = new Set();

export const LS = {
  get(k, d) { try { const v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v, { silent = false } = {}) {
    try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { }
    if (!silent) listeners.forEach(fn => { try { fn(k); } catch (e) { } });
  },
  keys() { try { return Object.keys(localStorage).filter(k => k.startsWith(P)).map(k => k.slice(P.length)); } catch (e) { return []; } }
};

export const onSet = fn => listeners.add(fn);
