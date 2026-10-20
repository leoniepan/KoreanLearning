// 在 Azure Static Web Apps 上顯示登入者與「登出」。
// 其他環境（本機預覽、GitHub Pages）沒有 /.auth/me，會安靜地略過，不顯示任何東西。
import { $, esc } from './dom.js';

export async function initAccount() {
  const box = $('#acct'); if (!box) return;
  try {
    const res = await fetch('/.auth/me', { cache: 'no-store' });
    if (!res.ok) return;
    const { clientPrincipal: p } = await res.json();
    if (!p) return;
    box.innerHTML = `<span class="acct-name" title="${esc(p.userDetails)}">${esc(p.userDetails)}</span><a class="acct-out" href="/logout">登出</a>`;
    box.hidden = false;
  } catch (e) { }
}
