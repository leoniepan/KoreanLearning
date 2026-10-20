// 瀏覽器 localStorage 包裝。所有鍵都會加上 krpv_ 前綴，讀寫失敗時不會讓頁面壞掉
export const LS = {
  get(k, d) { try { const v = localStorage.getItem('krpv_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('krpv_' + k, JSON.stringify(v)); } catch (e) { } }
};
