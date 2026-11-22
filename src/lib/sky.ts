// Céu que acompanha a hora do dia: interpola, minuto a minuto, entre "fotografias" do céu
// em horas-chave (madrugada, amanhecer, dia, entardecer, anoitecer, noite).
type RGB = [number, number, number];
interface Key { h: number; c: [string, string, string, string, string]; glow: RGB; glowA: number; stars: number; name: string }

const KEYS: Key[] = [
  // madrugada: azul-escuro suave
  { h: 0,    name: 'madrugada',  c: ['#1b2550', '#262f66', '#34407c', '#46548f', '#5b6aa0'], glow: [150, 165, 230], glowA: 0.18, stars: 0.9 },
  { h: 4.5,  name: 'madrugada',  c: ['#222c5c', '#34407a', '#52609a', '#8a8fb8', '#b9b3c8'], glow: [210, 190, 220], glowA: 0.3,  stars: 0.6 },
  { h: 6,    name: 'amanhecer',  c: ['#6f7cc0', '#a08fcf', '#d3a8d6', '#f3b4b8', '#fbc9a6'], glow: [255, 210, 170], glowA: 0.7,  stars: 0.15 },
  // dia claro, em tons pastel (azul-lavanda → rosa)
  { h: 7.5,  name: 'dia',        c: ['#8fa6f2', '#b3b6f4', '#dcc4f2', '#f6d3ec', '#fbe0d6'], glow: [255, 240, 220], glowA: 0.4,  stars: 0 },
  { h: 12,   name: 'dia',        c: ['#86a4f0', '#a9bdf5', '#cdd2f7', '#e9dcf6', '#f8e8ee'], glow: [255, 255, 245], glowA: 0.3,  stars: 0 },
  { h: 15.5, name: 'tarde',      c: ['#8f9fe8', '#b5b0ee', '#dcb9e6', '#f5c8d0', '#fbd6b8'], glow: [255, 230, 190], glowA: 0.5,  stars: 0 },
  // entardecer alaranjado
  { h: 17.5, name: 'entardecer', c: ['#6b5fb0', '#a76fb0', '#e0869e', '#f59e82', '#ffbb6e'], glow: [255, 205, 140], glowA: 1,    stars: 0.1 },
  { h: 19,   name: 'anoitecer',  c: ['#3a3470', '#664584', '#b0557a', '#e97a69', '#f59a52'], glow: [255, 170, 110], glowA: 0.85, stars: 0.5 },
  // noite: índigo escuro com estrelas e um fio quente no horizonte
  { h: 20.5, name: 'noite',      c: ['#1a1745', '#2a2262', '#43337a', '#6b4a85', '#a1608a'], glow: [255, 160, 110], glowA: 0.45, stars: 1 },
  { h: 22.5, name: 'noite',      c: ['#15133b', '#221d55', '#382c6c', '#59407a', '#7f5384'], glow: [255, 160, 110], glowA: 0.35, stars: 1 },
  { h: 24,   name: 'madrugada',  c: ['#1b2550', '#262f66', '#34407c', '#46548f', '#5b6aa0'], glow: [150, 165, 230], glowA: 0.18, stars: 0.9 },
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
    '--sky-logo': darkText ? INK : '#fde8d4',
    '--sky-star-glow': darkText
      ? 'drop-shadow(0 0 4px rgba(255,255,255,.95)) drop-shadow(0 0 12px rgba(255,255,255,.8)) drop-shadow(0 0 26px rgba(255,255,255,.5))'
      : 'drop-shadow(0 0 4px rgba(255,255,255,.9)) drop-shadow(0 0 12px rgba(255,214,160,.95)) drop-shadow(0 0 28px rgba(255,170,110,.65))',
    '--sky-accent': darkText ? '#e8743f' : '#f7d7b5',
    '--sky-err': darkText ? '#8f1d12' : '#ffe1d6',
  };
  return { name: (t < 0.5 ? a : b).name, top: css(colors[0]), vars, darkText };
}

export const hourNow = (d = new Date()) => d.getHours() + d.getMinutes() / 60;
