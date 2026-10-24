// 朗讀（瀏覽器內建韓文語音）與 Naver 辭典連結
import { $, esc } from './dom.js';
import { LS } from './storage.js';

let rate = LS.get('rate', 1);

// 裝置上所有韓文語音，音質好的（自然／線上語音）排前面
const score = v => (/natural|neural|online/i.test(v.name) ? 0 : /premium|enhanced|plus/i.test(v.name) ? 1 : /google/i.test(v.name) ? 2 : 3);
function koVoices() {
  try { return speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang)).sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name)); } catch (e) { return []; }
}
// 使用者選的語音；沒選過或這台裝置沒有，就用排第一的
function koVoice() { const vs = koVoices(), want = LS.get('voice', ''); return vs.find(v => v.name === want) || vs[0] || null; }
const shortName = n => n.replace(/^Microsoft\s+/i, '').replace(/\s+Online/i, '').replace(/\s*-\s*Korean.*$/i, '').replace(/\s*\(.*?\)\s*/g, m => /natural/i.test(m) ? '（自然）' : '').trim();

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

// 依序朗讀多句（例如聽力對話），句子之間不會互相打斷
export function sayLines(lines) {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const v = koVoice();
    lines.forEach(t => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'ko-KR'; if (v) u.voice = v; u.rate = rate;
      speechSynthesis.speak(u);
    });
  } catch (e) { }
}

function voiceStatus() {
  const el = $('#voice'); if (!el) return;
  if (!('speechSynthesis' in window)) { el.textContent = '這個瀏覽器不支援朗讀'; el.className = 'vs warn'; return; }
  const v = koVoice(), vs = koVoices(), box = $('#vpick'), sel = $('#voice-sel');
  if (box && sel) {
    box.hidden = !vs.length;
    sel.innerHTML = vs.map(x => `<option value="${esc(x.name)}"${x === v ? ' selected' : ''}>${esc(shortName(x.name) || x.name)}${x.localService ? '' : '・線上'}</option>`).join('');
  }
  if (v) { el.textContent = vs.length > 1 ? `這台裝置有 ${vs.length} 種韓文語音` : '韓文語音：' + v.name; el.className = 'vs'; }
  else { el.textContent = '尚未偵測到韓文語音；若按喇叭沒有聲音，請在系統設定加入韓文語音，或按 Naver 聽真人發音'; el.className = 'vs warn'; }
}

function setRate(r) {
  rate = r; LS.set('rate', r);
  $('#rate-n').setAttribute('aria-pressed', r === 1);
  $('#rate-s').setAttribute('aria-pressed', r !== 1);
}

// 在 app 啟動時呼叫一次：語速按鈕、語音狀態、所有 data-say 按鈕的點擊
// 使用者剛按了「頁面內」的按鈕（作答、開始測驗、下一題…）。切換頁面、選單、分頁的點擊不算，
// 這樣打開新頁面時不會自動出聲，但在測驗裡按下一題時聽力題仍會自動播放。
let lastAct = 0;
const NAV = '.mast,.side,.tabbar-b,.topbar,.subtabs,.grp-tabs,.steps,.rd-list,.rd-tiers,[data-go],[data-mod],[data-hgo],[data-link],a[href]';
document.addEventListener('pointerdown', e => { if (!e.target.closest(NAV)) lastAct = Date.now(); }, true);
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest(NAV)) lastAct = Date.now(); }, true);
export const userJustActed = () => Date.now() - lastAct < 2000;

export function initSpeech() {
  setRate(rate);
  $('#rate-n').onclick = () => setRate(1);
  $('#rate-s').onclick = () => setRate(0.7);
  voiceStatus(); setTimeout(voiceStatus, 1200);
  const sel = $('#voice-sel'), tryB = $('#voice-try');
  if (sel) sel.onchange = () => { LS.set('voice', sel.value); say('안녕하세요. 만나서 반가워요.'); };
  if (tryB) tryB.onclick = () => say('안녕하세요. 만나서 반가워요.');
  try { speechSynthesis.onvoiceschanged = voiceStatus; } catch (e) { }
  document.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) say(s.dataset.say); });
}

export const SPK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="currentColor"/><path d="M13 6.8a4.6 4.6 0 0 1 0 6.4M15.4 4.4a8 8 0 0 1 0 11.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
export const sayBtn = t => `<button type="button" class="say" data-say="${esc(t)}" aria-label="朗讀 ${esc(t)}">${SPK}</button>`;

export const naverUrl = w => 'https://korean.dict.naver.com/kozhdict/#/search?query=' + encodeURIComponent(w);
export const nvBtn = w => `<a class="nv" href="${naverUrl(w)}" target="_blank" rel="noopener" title="在 Naver 辭典聽真人發音" aria-label="在 Naver 辭典查「${esc(w)}」">Naver</a>`;
