// 共用的小工具：選取元素、跳脫 HTML、亂數
export const $ = (s, root = document) => root.querySelector(s);
export const qa = (root, s) => [...root.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const uniq = a => [...new Set(a)];
