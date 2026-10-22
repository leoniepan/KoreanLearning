// 學習狀態（進度、最佳分數、每日紀錄、自訂單字）的合併規則。
// 前端與 API 共用同一套規則，兩台裝置同時使用也不會互相覆蓋掉進度。
// js/core/merge.js 必須和 api/src/lib/merge.js 內容完全相同（API 測試會檢查）。
//
//   字串陣列（已完成的課）        → 聯集
//   數字（最佳分數、目前課次）     → 取較大值（目前課次除外，取較新的值）
//   物件且值都是數字（每日紀錄）   → 每個鍵取較大值
//   物件陣列（自訂單字）           → 以較新的一方為準（這樣刪除才會同步）
//   其他                          → 以較新的一方為準

const LATEST_WINS = /^(lesson|lesson_.*|custom|custom_nouns)$/;

export function mergeValue(key, older, newer) {
  if (newer === undefined) return older;
  if (older === undefined || LATEST_WINS.test(key)) return newer;
  if (isStrArr(older) && isStrArr(newer)) return [...new Set([...older, ...newer])];
  if (typeof older === 'number' && typeof newer === 'number') return Math.max(older, newer);
  if (isNumMap(older) && isNumMap(newer)) {
    const out = { ...older };
    for (const [k, v] of Object.entries(newer)) out[k] = Math.max(out[k] ?? -Infinity, v);
    return out;
  }
  return newer;
}

export function mergeState(older = {}, newer = {}) {
  const out = { ...older };
  for (const k of Object.keys(newer)) out[k] = mergeValue(k, older[k], newer[k]);
  return out;
}

const isStrArr = v => Array.isArray(v) && v.every(x => typeof x === 'string');
const isNumMap = v => v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(x => typeof x === 'number');
