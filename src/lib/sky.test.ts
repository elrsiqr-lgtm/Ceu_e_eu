import { describe, it, expect } from 'vitest';
import { skyAt, luminance } from './sky';

const num = (s: string) => Number(s);
describe('skyAt', () => {
  it('é contínuo na virada da meia-noite', () => {
    expect(skyAt(0).vars['--s0']).toBe(skyAt(24 - 1e-9).vars['--s0']);
    expect(skyAt(23.99).vars['--s2']).toBeDefined();
  });
  it('meio-dia: claro, sem estrelas, texto escuro', () => {
    const s = skyAt(12);
    expect(num(s.vars['--stars'])).toBe(0);
    expect(s.darkText).toBe(true);
  });
  it('noite: escuro, estrelas, texto branco', () => {
    for (const h of [21, 22, 23]) { const s = skyAt(h); expect(s.darkText).toBe(false); expect(num(s.vars['--stars'])).toBeGreaterThan(0.9); }
  });
  it('entardecer tem o brilho do sol no máximo', () => {
    expect(num(skyAt(17.5).vars['--glow-a'])).toBe(1);
    expect(skyAt(17.5).name).toBe('entardecer');
  });
  it('madrugada é azul (mais azul que vermelho) e mais clara que a noite', () => {
    const rgb = (v: string) => v.match(/\d+/g)!.map(Number) as [number, number, number];
    const m = rgb(skyAt(2).vars['--s2']); const n = rgb(skyAt(21.5).vars['--s2']);
    expect(m[2]).toBeGreaterThan(m[0]);
    expect(luminance(m)).toBeGreaterThan(luminance(n));
  });
  it('interpola entre duas horas-chave', () => {
    const lum = (h: number) => luminance((skyAt(h).vars['--s0'].match(/\d+/g)!.map(Number)) as [number, number, number]);
    expect(lum(7)).toBeGreaterThan(lum(6)); // amanhece
    expect(lum(18.5)).toBeLessThan(lum(16));  // anoitece
  });
  it('aceita qualquer hora sem quebrar', () => {
    for (let h = 0; h < 24; h += 0.25) expect(skyAt(h).vars['--s0']).toMatch(/^rgb\(/);
    expect(skyAt(-1).vars['--s0']).toBe(skyAt(23).vars['--s0']);
  });
});
