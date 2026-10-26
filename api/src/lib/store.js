// 資料存取。正式環境用 Azure Cosmos DB；測試與本機模擬用記憶體（memory-store.js）。
//
// Cosmos DB 結構：資料庫 korean／容器 records，分割區索引鍵 /userId
//   使用者    { id:'user',  userId, type:'user',  email, roles, firstSeen, lastSeen }
//   開通狀態  { id:'access', userId, type:'access', status, email, requestedAt, decidedAt, decidedBy }
//   學習狀態  { id:'state', userId, type:'state', data:{...}, updatedAt }
//   測驗紀錄  { id:<uuid>,  userId, type:'attempt', email, route, module, title, score, total, finishedAt, answers:[...] }
import { CosmosClient } from '@azure/cosmos';

export class CosmosStore {
  constructor(connectionString, databaseId = 'korean', containerId = 'records') {
    this.client = new CosmosClient(connectionString);
    this.databaseId = databaseId; this.containerId = containerId;
    this.ready = null;
  }
  async container() {
    if (!this.ready) {
      this.ready = (async () => {
        const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
        const { container } = await database.containers.createIfNotExists({ id: this.containerId, partitionKey: { paths: ['/userId'] } });
        return container;
      })().catch(e => { this.ready = null; throw e; });
    }
    return this.ready;
  }
  async get(userId, id) {
    const c = await this.container();
    try {
      const { resource } = await c.item(id, userId).read();
      return resource ? strip(resource) : null;
    } catch (e) {
      if (e.code === 404) return null;
      throw e;
    }
  }
  async put(doc) {
    const c = await this.container();
    const { resource } = await c.items.upsert(doc);
    return strip(resource);
  }
  async listAttempts(userId, limit = 500) {
    const c = await this.container();
    const { resources } = await c.items.query({
      query: 'SELECT TOP @n * FROM c WHERE c.userId = @u AND c.type = "attempt" ORDER BY c.finishedAt DESC',
      parameters: [{ name: '@n', value: limit }, { name: '@u', value: userId }]
    }, { partitionKey: userId }).fetchAll();
    return resources.map(strip);
  }
  async listUsers() {
    const c = await this.container();
    const { resources } = await c.items.query('SELECT * FROM c WHERE c.type = "user"').fetchAll();
    return resources.map(strip);
  }
  async listByType(type) {
    const c = await this.container();
    const { resources } = await c.items.query({
      query: 'SELECT * FROM c WHERE c.type = @t',
      parameters: [{ name: '@t', value: type }]
    }).fetchAll();
    return resources.map(strip);
  }
  async listAllAttempts(limit = 5000) {
    const c = await this.container();
    const { resources } = await c.items.query({
      query: 'SELECT TOP @n * FROM c WHERE c.type = "attempt" ORDER BY c.finishedAt DESC',
      parameters: [{ name: '@n', value: limit }]
    }).fetchAll();
    return resources.map(strip);
  }
}

// 去掉 Cosmos DB 自動加上的系統欄位（_rid、_etag…）
function strip(d) {
  const out = {};
  for (const [k, v] of Object.entries(d)) if (!k.startsWith('_')) out[k] = v;
  return out;
}

let shared = null;
export function getStore() {
  if (shared) return shared;
  const cs = process.env.COSMOS_CONNECTION;
  if (!cs) return null;
  shared = new CosmosStore(cs, process.env.COSMOS_DATABASE || 'korean', process.env.COSMOS_CONTAINER || 'records');
  return shared;
}
export function setStore(s) { shared = s; }
