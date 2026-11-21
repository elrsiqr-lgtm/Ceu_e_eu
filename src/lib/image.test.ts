import { describe, it, expect } from 'vitest';
import { fitToBudget, TARGET_BYTES } from './image';

// Simula um codificador: tamanho ∝ área × qualidade
const fake = (k: number) => async (side: number, q: number) => ({ size: Math.round(k * side * side * q) }) as Blob;

describe('fitToBudget', () => {
  it('mantém a qualidade máxima quando já cabe', async () => {
    const b = await fitToBudget(fake(0.05)); // 1920²·0.86·0.05 ≈ 158 KB
    expect(b.size).toBeLessThanOrEqual(TARGET_BYTES);
  });
  it('baixa a qualidade antes de reduzir dimensões', async () => {
    const calls: number[] = [];
    const enc = async (side: number, q: number) => { calls.push(side); return fake(0.15)(side, q); }; // 0.86 → ~475 KB… 
    await fitToBudget(enc);
    expect(new Set(calls).size).toBe(1);
  });
  it('reduz dimensões quando a qualidade mínima não basta', async () => {
    const b = await fitToBudget(fake(0.6));
    expect(b.size).toBeLessThanOrEqual(TARGET_BYTES);
  });
  it('sempre respeita o orçamento para qualquer foto razoável', async () => {
    for (const k of [0.01, 0.1, 0.3, 0.9, 1.5, 3]) expect((await fitToBudget(fake(k))).size).toBeLessThanOrEqual(TARGET_BYTES);
  });
});
