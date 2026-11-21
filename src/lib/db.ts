// Camada de repositório sobre IndexedDB. Toda leitura/escrita de memórias exige userId,
// e o repositório confere a posse — assim um usuário nunca alcança dados de outro (F10).
export interface User { id: string; email: string; salt: string; hash: string; createdAt: number }
export type PhotoSource = 'camera' | 'galeria';
export interface Memory {
  id: string; userId: string; date: string;
  photo: Blob; thumb: Blob; source: PhotoSource;
  question: string; answer: string;
  question2?: string; answer2?: string;
  createdAt: number; updatedAt: number;
}
export interface Draft {
  userId: string; date: string; photo?: Blob; source?: PhotoSource;
  question?: string; answer?: string; question2?: string; answer2?: string;
}
export interface Settings { userId: string; remind: boolean; time: string; lastReminded?: string }

const NAME = 'ceu-e-eu';
let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const r = indexedDB.open(NAME, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore('users', { keyPath: 'id' }).createIndex('email', 'email', { unique: true });
      const m = db.createObjectStore('memories', { keyPath: 'id' });
      m.createIndex('userId', 'userId');
      m.createIndex('userDate', ['userId', 'date'], { unique: true });
      db.createObjectStore('drafts', { keyPath: ['userId', 'date'] });
      db.createObjectStore('settings', { keyPath: 'userId' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}
export function resetDbForTests() { dbp = null; }

const wrap = <T,>(req: IDBRequest<T>) => new Promise<T>((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
async function store(name: string, mode: IDBTransactionMode = 'readonly') {
  return (await open()).transaction(name, mode).objectStore(name);
}

export const uid = () => crypto.randomUUID();

// ---------- usuários ----------
export const users = {
  async byEmail(email: string) { return (await wrap((await store('users')).index('email').get(email))) as User | undefined; },
  async get(id: string) { return (await wrap((await store('users')).get(id))) as User | undefined; },
  async add(u: User) { await wrap((await store('users', 'readwrite')).add(u)); },
  async update(u: User) { await wrap((await store('users', 'readwrite')).put(u)); },
  /** Exclusão de conta: remove usuário e TODOS os seus dados. */
  async deleteAccount(userId: string) {
    const db = await open();
    const tx = db.transaction(['users', 'memories', 'drafts', 'settings'], 'readwrite');
    tx.objectStore('users').delete(userId);
    tx.objectStore('settings').delete(userId);
    const ms = tx.objectStore('memories');
    const keys = await wrap(ms.index('userId').getAllKeys(userId));
    keys.forEach((k) => ms.delete(k));
    const ds = tx.objectStore('drafts');
    const dk = await wrap(ds.getAllKeys());
    dk.forEach((k) => { if ((k as IDBValidKey[])[0] === userId) ds.delete(k); });
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
  },
};

// ---------- memórias ----------
export const memories = {
  async list(userId: string): Promise<Memory[]> {
    const all = (await wrap((await store('memories')).index('userId').getAll(userId))) as Memory[];
    return all.sort((a, b) => b.date.localeCompare(a.date));
  },
  async get(userId: string, id: string) {
    const m = (await wrap((await store('memories')).get(id))) as Memory | undefined;
    return m && m.userId === userId ? m : undefined;
  },
  async byDate(userId: string, date: string) {
    return (await wrap((await store('memories')).index('userDate').get([userId, date]))) as Memory | undefined;
  },
  async put(m: Memory) {
    const existing = (await wrap((await store('memories')).get(m.id))) as Memory | undefined;
    if (existing && existing.userId !== m.userId) throw new Error('Acesso negado');
    await wrap((await store('memories', 'readwrite')).put(m));
  },
  async remove(userId: string, id: string) {
    const m = await this.get(userId, id);
    if (!m) throw new Error('Acesso negado');
    await wrap((await store('memories', 'readwrite')).delete(id));
  },
};

// ---------- rascunhos (proteção contra perda durante o preenchimento) ----------
export const drafts = {
  async get(userId: string, date: string) { return (await wrap((await store('drafts')).get([userId, date]))) as Draft | undefined; },
  async put(d: Draft) { await wrap((await store('drafts', 'readwrite')).put(d)); },
  async remove(userId: string, date: string) { await wrap((await store('drafts', 'readwrite')).delete([userId, date])); },
};

// ---------- configurações ----------
export const settings = {
  async get(userId: string): Promise<Settings> {
    return ((await wrap((await store('settings')).get(userId))) as Settings | undefined) ?? { userId, remind: false, time: '18:00' };
  },
  async put(s: Settings) { await wrap((await store('settings', 'readwrite')).put(s)); },
};
