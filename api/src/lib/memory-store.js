// 記憶體版的資料存取，介面和 CosmosStore 相同。用在測試與本機模擬（tools/dev-server.mjs）。
// 傳入 onChange 可以在每次寫入後把資料存到檔案。
export class MemoryStore {
  constructor(docs = [], onChange = null) { this.docs = new Map(docs.map(d => [d.userId + '|' + d.id, d])); this.onChange = onChange; }
  all() { return [...this.docs.values()]; }
  k(userId, id) { return userId + '|' + id; }
  async get(userId, id) { const d = this.docs.get(this.k(userId, id)); return d ? structuredClone(d) : null; }
  async put(doc) { this.docs.set(this.k(doc.userId, doc.id), structuredClone(doc)); this.onChange?.(this); return doc; }
  async listAttempts(userId, limit = 500) {
    return [...this.docs.values()].filter(d => d.type === 'attempt' && d.userId === userId)
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, limit).map(d => structuredClone(d));
  }
  async listUsers() { return [...this.docs.values()].filter(d => d.type === 'user').map(d => structuredClone(d)); }
  async listByType(type) { return [...this.docs.values()].filter(d => d.type === type).map(d => structuredClone(d)); }
  async listAllAttempts(limit = 5000) {
    return [...this.docs.values()].filter(d => d.type === 'attempt')
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, limit).map(d => structuredClone(d));
  }
}

