// Rascunhos ficam só no aparelho (IndexedDB): protegem o texto e a foto contra perda antes de salvar.
import type { PhotoSource } from './memories';

export interface Draft {
  userId: string; date: string; photo?: Blob; source?: PhotoSource;
  question?: string; answer?: string; question2?: string; answer2?: string;
}

let dbp: Promise<IDBDatabase> | null = null;
const open = () => (dbp ??= new Promise((res, rej) => {
  const r = indexedDB.open('ceu-e-eu-drafts', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('drafts', { keyPath: ['userId', 'date'] });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
}));
const run = async <T,>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) => {
  const s = (await open()).transaction('drafts', mode).objectStore('drafts');
  return new Promise<T>((res, rej) => { const q = f(s); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
};

export const drafts = {
  get: (userId: string, date: string) => run('readonly', (s) => s.get([userId, date])) as Promise<Draft | undefined>,
  put: (d: Draft) => run('readwrite', (s) => s.put(d)).then(() => {}),
  remove: (userId: string, date: string) => run('readwrite', (s) => s.delete([userId, date])).then(() => {}),
};
