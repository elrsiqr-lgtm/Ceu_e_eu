// Céu que acompanha a hora do dia: interpola, minuto a minuto, entre "fotografias" do céu
// em horas-chave (madrugada, amanhecer, dia, entardecer, anoitecer, noite).
type RGB = [number, number, number];
interface Key { h: number; c: [string, string, string, string, string]; glow: RGB; glowA: number; stars: number; name: string }

const KEYS: Key[] = [
  // madrugada: azul-escuro suave
  { h: 0,    name: 'madrugada',  c: ['#16224a', '#1e3060', '#2a427c', '#3a5594', '#4c68a8'], glow: [140, 170, 255], glowA: 0.22, stars: 0.9 },
  { h: 4.5,  name: 'madrugada',  c: ['#1a2858', '#283d78', '#3d5a96', '#6a82b0', '#97a0c0'], glow: [190, 190, 230], glowA: 0.3,  stars: 0.6 },
  { h: 6,    name: 'amanhecer',  c: ['#3d5f9e', '#6d8dc4', '#a8b6d8', '#eac4b2', '#f7c99b'], glow: [255, 205, 150], glowA: 0.75, stars: 0.15 },
  // dia claro
  { h: 7.5,  name: 'dia',        c: ['#4f8fd8', '#78aee6', '#a4cbef', '#d2e4f4', '#f0efe6'], glow: [255, 236, 190], glowA: 0.5,  stars: 0 },
  { h: 12,   name: 'dia',        c: ['#3f86dc', '#62a8ee', '#8cc4f6', '#b8dcfa', '#e3f2fd'], glow: [255, 255, 245], glowA: 0.35, stars: 0 },
  { h: 15.5, name: 'tarde',      c: ['#4a8ad6', '#78a8e0', '#a9c0e0', '#e3d0c0', '#f8dcb0'], glow: [255, 226, 170], glowA: 0.5,  stars: 0 },
  // entardecer alaranjado
  { h: 17.5, name: 'entardecer', c: ['#55579a', '#9a80b6', '#e69a8c', '#f5a86e', '#ffc27a'], glow: [255, 214, 150], glowA: 1,    stars: 0.1 },
  { h: 19,   name: 'anoitecer',  c: ['#2c2a6a', '#5a4086', '#a8527c', '#e0716a', '#f48a5d'], glow: [255, 170, 110], glowA: 0.85, stars: 0.5 },
  // noite escura
  { h: 20.5, name: 'noite',      c: ['#0b0d24', '#141638', '#1d1c48', '#2a235c', '#382c68'], glow: [120, 110, 200], glowA: 0.22, stars: 1 },
  { h: 22.5, name: 'noite',      c: ['#0a0c22', '#121436', '#1a1946', '#26205a', '#342a64'], glow: [120, 110, 200], glowA: 0.18, stars: 1 },
  { h: 24,   name: 'madrugada',  c: ['#16224a', '#1e3060', '#2a427c', '#3a5594', '#4c68a8'], glow: [140, 170, 255], glowA: 0.22, stars: 0.9 },
];

const hex = (s: string): RGB => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const css = (c: RGB) => `rgb(${c.map(Math.round).join(',')})`;

/** Luminância relativa (WCAG) */
export function luminance([r, g, b]: RGB): number {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (l1: number, l2: number) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

const INK = '#1c2350';
const INK_LUM = luminance(hex(INK));

export interface Sky {
  name: string;
  top: string;                // cor do topo (para theme-color)
  vars: Record<string, string>; // variáveis CSS prontas para o estilo
  darkText: boolean;
}

/** `hour` fracionária, 0 ≤ hour < 24 (ex.: 17,5 = 17h30). */
export function skyAt(hour: number): Sky {
  const h = ((hour % 24) + 24) % 24;
  let i = KEYS.findIndex((k, n) => h >= k.h && h < KEYS[n + 1].h);
  if (i < 0) i = KEYS.length - 2;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = (h - a.h) / (b.h - a.h);
  const colors = a.c.map((c, n) => mix(hex(c), hex(b.c[n]), t));
  const glow = mix(a.glow, b.glow, t);
  const glowA = lerp(a.glowA, b.glowA, t);
  const stars = lerp(a.stars, b.stars, t);

  // o texto fica na metade de cima: escolhe branco ou escuro pelo melhor contraste ali
  const region = mix(mix(colors[0], colors[1], 0.5), colors[2], 0.3);
  const L = luminance(region);
  // branco tem preferência (leva o halo de luz): o escuro só entra quando o céu está claramente claro
  const darkText = contrast(L, INK_LUM) > contrast(L, 1) * 1.3;

  const vars: Record<string, string> = {
    '--s0': css(colors[0]), '--s1': css(colors[1]), '--s2': css(colors[2]), '--s3': css(colors[3]), '--s4': css(colors[4]),
    '--glow': glow.map(Math.round).join(' '), '--glow-a': glowA.toFixed(3), '--stars': stars.toFixed(3),
    '--sky-fg': darkText ? INK : '#ffffff',
    '--sky-shadow': darkText
      ? '0 1px 0 rgba(255,255,255,.55), 0 0 22px rgba(255,255,255,.55)'
      : '0 2px 0 rgba(46,40,100,.28), 0 0 22px rgba(255,222,180,.6), 0 10px 30px rgba(36,30,80,.45)',
    '--sky-accent': darkText ? '#e8743f' : '#f7d7b5',
    '--sky-err': darkText ? '#8f1d12' : '#ffe1d6',
  };
  return { name: (t < 0.5 ? a : b).name, top: css(colors[0]), vars, darkText };
}

export const hourNow = (d = new Date()) => d.getHours() + d.getMinutes() / 60;
