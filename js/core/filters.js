// 單字表共用的篩選列：主題分類標籤＋字首索引（ㄱ ㄴ ㄷ…）
import { dec } from './hangul.js';
import { esc } from './dom.js';

export const INITIALS = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'.split('');
const BASE = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
// 單字第一個字的子音（硬音併入原本的子音，例如 떡볶이 歸在 ㄷ）
export const initialOf = w => { const d = dec(w[0]); return d ? (BASE[d.L] || d.L) : ''; };

// groups: [{label:'動詞', items:[[id, 名稱], …]}, …]；counts: {id: 數量}
export function chipsHTML(groups, active, counts) {
  return groups.filter(g => g.items.length).map(g => `<div class="chip-row">${g.label ? `<span class="chip-g">${esc(g.label)}</span>` : ''}${g.items.map(([id, name]) => `<button type="button" class="chip" data-cat="${id}" aria-pressed="${id === active}" ${counts[id] ? '' : 'disabled'}>${esc(name)}<span class="cnt">${counts[id] || 0}</span></button>`).join('')}</div>`).join('');
}

// available: 有單字的字首 Set；active: 目前選的字首（'' 表示不限）
export function initialsHTML(available, active) {
  return `<span class="chip-g">字首</span>${INITIALS.map(c => `<button type="button" class="ini" data-ini="${c}" aria-pressed="${c === active}" ${available.has(c) ? '' : 'disabled'} lang="ko">${c}</button>`).join('')}${active ? `<button type="button" class="ini clear" data-ini="">不限</button>` : ''}`;
}

// 下拉選單用：<optgroup> 版的分類選項
export const catOptions = groups => groups.map(g => g.label ? `<optgroup label="${esc(g.label)}">${g.items.map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('')}</optgroup>` : g.items.map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('')).join('');
