// 學習紀錄的統計與錯題本。前端（離線模式）與 API 共用同一份程式，
// js/core/stats.js 必須和 api/src/lib/stats.js 內容完全相同（API 測試會檢查）。
const tzDate = (iso, offsetMin) => new Date(Date.parse(iso) - offsetMin * 60_000).toISOString().slice(0, 10);

export function buildStats(attempts, { tz = -480, days = 30 } = {}) {
  const totals = { attempts: attempts.length, answers: 0, correct: 0 };
  const byModule = {};
  const daily = {};
  const items = new Map();
  const chrono = [...attempts].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  for (const at of chrono) {
    const m = byModule[at.module] ||= { module: at.module, attempts: 0, answers: 0, correct: 0 };
    m.attempts++;
    const d = tzDate(at.finishedAt, tz);
    const day = daily[d] ||= { date: d, attempts: 0, answers: 0, correct: 0 };
    day.attempts++;
    for (const a of at.answers) {
      totals.answers++; m.answers++; day.answers++;
      if (a.ok) { totals.correct++; m.correct++; day.correct++; }
      const it = items.get(a.key) || { key: a.key, module: at.module, right: 0, wrong: 0 };
      if (a.ok) it.right++; else { it.wrong++; it.lastWrongAt = at.finishedAt; it.lastChosen = a.chosen; }
      Object.assign(it, { label: a.label, prompt: a.prompt, ko: a.ko, audio: a.audio, correct: a.correct, word: a.word, opts: a.opts, lastOk: a.ok, lastAt: at.finishedAt });
      items.set(a.key, it);
    }
  }
  // 錯題本：最近一次作答仍然答錯的題目。重練答對後就會自動移出。
  const mistakes = [...items.values()].filter(i => !i.lastOk).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const since = tzDate(new Date(Date.now() - (days - 1) * 86_400_000).toISOString(), tz);
  const recent = attempts.slice(0, 20).map(({ id, module, route, title, score, total, finishedAt }) => ({ id, module, route, title, score, total, finishedAt }));
  return {
    totals,
    byModule: Object.values(byModule).sort((a, b) => b.answers - a.answers),
    daily: Object.values(daily).filter(d => d.date >= since).sort((a, b) => a.date.localeCompare(b.date)),
    recent,
    mistakes
  };
}

