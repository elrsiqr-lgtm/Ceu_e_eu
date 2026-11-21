import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { memories, users, drafts, type Memory } from './db';

const blob = new Blob(['x']);
const mk = (userId: string, date: string, id: string = crypto.randomUUID()): Memory => ({ id, userId, date, photo: blob, thumb: blob, source: 'camera', question: 'q', answer: 'a', createdAt: 1, updatedAt: 1 });

describe('isolamento entre usuários', () => {
  it('um usuário não lê, sobrescreve nem apaga memórias de outro', async () => {
    const m = mk('A', '2025-04-16', 'm1');
    await memories.put(m);
    expect(await memories.get('B', 'm1')).toBeUndefined();
    expect((await memories.list('B')).length).toBe(0);
    await expect(memories.put({ ...m, userId: 'B' })).rejects.toThrow();
    await expect(memories.remove('B', 'm1')).rejects.toThrow();
    expect(await memories.get('A', 'm1')).toBeDefined();
  });
  it('uma memória por usuário e data', async () => {
    await memories.put(mk('C', '2025-05-01'));
    await expect(memories.put(mk('C', '2025-05-01'))).rejects.toBeTruthy();
    await memories.put(mk('D', '2025-05-01')); // outro usuário, mesma data: ok
  });
  it('exclusão de conta remove tudo', async () => {
    await users.add({ id: 'E', email: 'e@e.com', salt: '', hash: '', createdAt: 1 });
    await memories.put(mk('E', '2025-06-01'));
    await drafts.put({ userId: 'E', date: '2025-06-02', answer: 'x' });
    await users.deleteAccount('E');
    expect(await memories.list('E')).toHaveLength(0);
    expect(await drafts.get('E', '2025-06-02')).toBeUndefined();
    expect(await users.get('E')).toBeUndefined();
  });
});
