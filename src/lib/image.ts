// Otimização: foto principal (máx. 1600px) e miniatura (480px), ambas JPEG.
async function scale(bitmap: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const r = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * r), h = Math.round(bitmap.height * r);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Falha ao processar a imagem.'))), 'image/jpeg', quality));
}

export async function processImage(file: File): Promise<{ photo: Blob; thumb: Blob }> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    return { photo: await scale(bitmap, 1600, 0.85), thumb: await scale(bitmap, 480, 0.8) };
  } finally { bitmap.close(); }
}
