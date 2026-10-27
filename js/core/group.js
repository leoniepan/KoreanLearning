// 把幾個既有的頁面組成一頁，上方用小按鈕切換（例如「基本」的「數字」裡有數字表、量詞、日期…）
// items: [{ id, title, render, mod, fresh }]；mod 是作答紀錄用的單元代號
// 跳到這一頁時可帶 params.sub 指定要打開哪一個
import { esc } from './dom.js';
import { LS } from './storage.js';
import { setRouteInfo } from './sync.js';

export function group(gid, items, { label } = {}) {
  return function render(el, ctx) {
    const key = 'grp_' + gid;
    let cur = items.find(x => x.id === ctx.params.sub) ? ctx.params.sub : LS.get(key, items[0].id);
    if (!items.find(x => x.id === cur)) cur = items[0].id;
    el.innerHTML = `${items.length > 1 ? `<div class="grp-tabs" role="tablist" aria-label="${esc(label || '切換')}">${items.map(x => `<button type="button" class="chip grp-t" role="tab" data-g="${x.id}">${esc(x.title)}</button>`).join('')}</div>` : ''}<div class="grp-body"></div>`;
    const body = el.querySelector('.grp-body'), views = new Map();
    const { sub, ...rest } = ctx.params;
    function show(id, params = {}) {
      cur = id; LS.set(key, id);
      el.querySelectorAll('.grp-t').forEach(b => b.setAttribute('aria-selected', b.dataset.g === id));
      views.forEach((v, k) => { v.hidden = k !== id; });
      const it = items.find(x => x.id === id);
      let v = views.get(id);
      if (!v || it.fresh || Object.keys(params).length) {
        if (!v) { v = document.createElement('div'); body.appendChild(v); views.set(id, v); }
        v.hidden = false;
        try { it.render(v, { ...ctx, params }); }
        catch (err) { v.innerHTML = `<p class="muted">這個頁面載入時發生錯誤：${esc(err.message)}</p>`; console.error(err); }
      }
      el._onShow();
    }
    // 從別頁切回來時（頁面沒有重畫），也要更新作答紀錄的單元代號
    el._onShow = () => { const it = items.find(x => x.id === cur); if (it && it.mod) setRouteInfo({ route: location.hash.slice(1), module: it.mod, title: it.label || it.title }); };
    el.querySelector('.grp-tabs')?.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) show(b.dataset.g); });
    show(cur, rest);
  };
}
