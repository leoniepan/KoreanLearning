// 朗讀（瀏覽器內建韓文語音）與 Naver 辭典連結
import { $, esc } from './dom.js';
import { LS } from './storage.js';

let rate = LS.get('rate', 1);

function koVoice() { try { return speechSynthesis.getVoices().find(v => /^ko/i.test(v.lang)); } catch (e) { return null; } }

export function say(t) {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'ko-KR';
    const v = koVoice(); if (v) u.voice = v;
    u.rate = rate;
    speechSynthesis.speak(u);
  } catch (e) { }
}

function voiceStatus() {
  const el = $('#voice'); if (!el) return;
  if (!('speechSynthesis' in window)) { el.textContent = '這個瀏覽器不支援朗讀'; el.className = 'vs warn'; return; }
  const v = koVoice();
  if (v) { el.textContent = '韓文語音：' + v.name; el.className = 'vs'; }
  else { el.textContent = '尚未偵測到韓文語音；若按喇叭沒有聲音，請在系統設定加入韓文語音，或按 Naver 聽真人發音'; el.className = 'vs warn'; }
}

function setRate(r) {
  rate = r; LS.set('rate', r);
  $('#rate-n').setAttribute('aria-pressed', r === 1);
  $('#rate-s').setAttribute('aria-pressed', r !== 1);
}

// 在 app 啟動時呼叫一次：語速按鈕、語音狀態、所有 data-say 按鈕的點擊
export function initSpeech() {
  setRate(rate);
  $('#rate-n').onclick = () => setRate(1);
  $('#rate-s').onclick = () => setRate(0.7);
  voiceStatus(); setTimeout(voiceStatus, 1200);
  try { speechSynthesis.onvoiceschanged = voiceStatus; } catch (e) { }
  document.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) say(s.dataset.say); });
}

export const SPK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="currentColor"/><path d="M13 6.8a4.6 4.6 0 0 1 0 6.4M15.4 4.4a8 8 0 0 1 0 11.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
export const sayBtn = t => `<button type="button" class="say" data-say="${esc(t)}" aria-label="朗讀 ${esc(t)}">${SPK}</button>`;

export const naverUrl = w => 'https://korean.dict.naver.com/kozhdict/#/search?query=' + encodeURIComponent(w);
export const nvBtn = w => `<a class="nv" href="${naverUrl(w)}" target="_blank" rel="noopener" title="在 Naver 辭典聽真人發音" aria-label="在 Naver 辭典查「${esc(w)}」">Naver</a>`;
