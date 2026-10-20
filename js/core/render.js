// 共用的顯示元件：發音標示、原稿紙格子、例詞卡、例句列
import { esc } from './dom.js';
import { pronSentence } from './hangul.js';
import { sayBtn, nvBtn } from './speech.js';

// 把發音和拼寫不同的字標紅
export function diffHTML(orig, pron) {
  const o = [...orig], p = [...pron];
  if (o.length !== p.length) return esc(pron);
  return p.map((c, i) => c !== o[i] ? `<b class="chg">${esc(c)}</b>` : esc(c)).join('');
}
export const prHTML = t => `<span class="pr">[${diffHTML(t, pronSentence(t))}]</span>`;

// 原稿紙格子；傳入 ref 時，和 ref 不同的格子會標紅
export function boxes(str, ref) {
  return `<span class="gw" lang="ko">${[...str].map((c, i) => c === ' ' ? '<i class="sp"></i>' : `<span class="${ref && ref[i] !== c ? 'cg' : ''}">${esc(c)}</span>`).join('')}</span>`;
}

export function wordCard(w) {
  const p = pronSentence(w);
  return `<div class="wc"><div class="wc-row"><span class="lab">拼寫</span>${boxes(w)}</div><div class="wc-row"><span class="lab">發音</span>${boxes(p, [...w])}</div><div class="wc-act">${sayBtn(w)}${nvBtn(w)}</div></div>`;
}

// 例句：[韓文, 中文]，tag 為左上角小標籤
export function sentRow([ko, zh], tag) {
  return `<li class="sent">${sayBtn(ko)}<div class="sent-b"><div class="ko" lang="ko">${tag ? `<span class="tag">${esc(tag)}</span>` : ''}${esc(ko)}</div>${prHTML(ko)}<div class="zh">${esc(zh)}</div></div></li>`;
}

// 表格儲存格：含韓文的字串會用韓文字體
export const cell = c => /[가-힣]/.test(c) ? `<td class="hg" lang="ko">${esc(c)}</td>` : `<td>${esc(c)}</td>`;
export function table({ head, rows }) {
  return `<div class="ctab-wrap"><table class="ctab"><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(cell).join('')}</tr>`).join('')}</table></div>`;
}
