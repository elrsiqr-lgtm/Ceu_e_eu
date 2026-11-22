// Compressão para caber no plano gratuito do Supabase (1 GB): a foto principal fica em ~300–480 KB.
export const TARGET_BYTES = 480 * 1024;
export const MAX_SIDE = 1920;
export const THUMB_SIDE = 480;

export type Encoder = (maxSide: number, quality: number) => Promise<Blob>;

/**
 * Começa na melhor qualidade e vai baixando até caber no orçamento: primeiro reduz a qualidade
 * (até 0,55, abaixo disso surgem artefatos); se ainda passar, reduz as dimensões e recomeça.
 * Ao terminar, devolve o primeiro resultado que cabe — nunca mais comprimido do que o necessário.
 */
export async function fitToBudget(encode: Encoder, startSide = MAX_SIDE, budget = TARGET_BYTES): Promise<Blob> {
  const QUALITIES = [0.86, 0.8, 0.74, 0.68, 0.62, 0.55];
  let side = startSide;
  let best: Blob | undefined;
  for (let round = 0; round < 8; round++) {
    for (const q of QUALITIES) {
      const b = await encode(side, q);
      if (b.size <= budget) return b;
      if (!best || b.size < best.size) best = b;
    }
    side = Math.round(side * 0.82);
  }
  return best!; // inalcançável na prática; devolve o menor obtido
}

function encoderFor(bitmap: ImageBitmap): Encoder {
  return (maxSide, quality) => {
    const r = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height)); // nunca amplia
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bitmap.width * r));
    c.height = Math.max(1, Math.round(bitmap.height * r));
    c.getContext('2d')!.drawImage(bitmap, 0, 0, c.width, c.height);
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Falha ao processar a imagem.'))), 'image/jpeg', quality));
  };
}

export async function processImage(file: File): Promise<{ photo: Blob; thumb: Blob }> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new Error('Não foi possível ler esta imagem. Tente outro formato (JPEG ou PNG).'); }
  try {
    const enc = encoderFor(bitmap);
    return { photo: await fitToBudget(enc), thumb: await fitToBudget(enc, THUMB_SIDE, 60 * 1024) };
  } finally { bitmap.close(); }
}
