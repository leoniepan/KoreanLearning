// 今日測驗課別範圍的終點（使用者在今日測驗的設定中選擇，存在 localStorage 的 progress，登入後會跨裝置同步）。
import { LS } from './storage.js';

export const BOOKS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];
export const UNITS = { '1A': 10, '1B': 12, '2A': 12, '2B': 12, '3A': 12, '3B': 12, '4A': 12, '4B': 12 };
export const DEFAULT = { book: '4B', unit: 12 };  // 沒有選擇時不限制範圍

const ORDER = Object.fromEntries(BOOKS.map((b, i) => [b, i + 1]));
export const parse = s => { const m = /^(\d[AB])-(\d+)$/.exec(s || ''); return m && UNITS[m[1]] ? { book: m[1], unit: Math.min(+m[2], UNITS[m[1]]) } : null; };

export function getProgress() { return parse(LS.get('progress', '')) || DEFAULT; }
export function setProgress(book, unit) { LS.set('progress', `${book}-${unit}`); }
export const progressLabel = (p = getProgress()) => `${p.book} 第 ${p.unit} 課`;

// 某冊某課是否在範圍終點以內；沒有冊別（補充、自訂）一律算在內
export function isLearned(book, unit = 1) {
  if (!ORDER[book]) return true;
  const p = getProgress();
  return ORDER[book] < ORDER[p.book] || (book === p.book && (unit || 1) <= p.unit);
}

// 範圍終點選擇器（冊＋課），onChange 在使用者改變時呼叫
export function progressPicker(el, onChange) {
  const p = getProgress();
  el.innerHTML = `<label class="pp-pick"><span>到</span><select class="pp-book" aria-label="冊">${BOOKS.map(b => `<option ${b === p.book ? 'selected' : ''}>${b}</option>`).join('')}</select><select class="pp-unit" aria-label="課"></select></label>`;
  const bs = el.querySelector('.pp-book'), us = el.querySelector('.pp-unit');
  const fill = (u) => { us.innerHTML = Array.from({ length: UNITS[bs.value] }, (_, i) => `<option value="${i + 1}" ${i + 1 === u ? 'selected' : ''}>第 ${i + 1} 課</option>`).join(''); };
  fill(p.unit);
  bs.onchange = () => { fill(1); setProgress(bs.value, 1); onChange && onChange(); };
  us.onchange = () => { setProgress(bs.value, +us.value); onChange && onChange(); };
}

// 課別比較：a 在 b 之前回傳負數
export const cmp = (a, b) => (ORDER[a.book] - ORDER[b.book]) || (a.unit - b.unit);
// 是否在「from ～ 目前進度」之間；沒有冊別（補充、自訂）一律算在內
export function inRange(book, unit = 1, from = { book: '1A', unit: 1 }) {
  if (!ORDER[book]) return true;
  return isLearned(book, unit) && cmp({ book, unit: unit || 1 }, from) >= 0;
}
