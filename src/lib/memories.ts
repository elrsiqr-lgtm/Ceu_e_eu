import { supabase } from './supabase';

export type PhotoSource = 'camera' | 'galeria';
export interface Memory {
  id: string; userId: string; date: string;
  photoPath: string; thumbPath: string; source: PhotoSource;
  question: string; answer: string; question2?: string; answer2?: string;
  createdAt: string; updatedAt: string;
  /** URLs assinadas e temporárias (o bucket é privado). */
  thumbUrl?: string; photoUrl?: string;
}
export interface NewMemory {
  id: string; userId: string; date: string; photo: Blob; thumb: Blob; source: PhotoSource;
  question: string; answer: string; question2?: string; answer2?: string;
}
export class DuplicateDateError extends Error { constructor() { super('Já existe uma memória nesta data.'); } }

const BUCKET = 'skies';
const URL_TTL = 60 * 60 * 24;

/* eslint-disable @typescript-eslint/no-explicit-any */
const fromRow = (r: any): Memory => ({
  id: r.id, userId: r.user_id, date: r.date, photoPath: r.photo_path, thumbPath: r.thumb_path, source: r.source,
  question: r.question, answer: r.answer, question2: r.question2 ?? undefined, answer2: r.answer2 ?? undefined,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

async function sign(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, URL_TTL);
  if (error) throw new Error(error.message);
  const out: Record<string, string> = {};
  for (const d of data) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}

export const photoPaths = (userId: string, id: string) => ({ photo: `${userId}/${id}.jpg`, thumb: `${userId}/${id}_t.jpg` });

export const memories = {
  async list(userId: string): Promise<Memory[]> {
    const { data, error } = await supabase.from('memories').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (error) throw new Error(error.message);
    const list = data.map(fromRow);
    const urls = await sign(list.map((m) => m.thumbPath));
    return list.map((m) => ({ ...m, thumbUrl: urls[m.thumbPath] }));
  },

  async get(userId: string, id: string): Promise<Memory | undefined> {
    const { data, error } = await supabase.from('memories').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return undefined;
    const m = fromRow(data);
    const urls = await sign([m.photoPath]);
    return { ...m, photoUrl: urls[m.photoPath] };
  },

  async byDate(userId: string, date: string): Promise<{ id: string } | undefined> {
    const { data, error } = await supabase.from('memories').select('id').eq('user_id', userId).eq('date', date).maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? undefined;
  },

  /** Envia as duas imagens e grava o registro; se o registro falhar, remove os arquivos enviados. */
  async create(n: NewMemory): Promise<void> {
    const p = photoPaths(n.userId, n.id);
    const up = async (path: string, blob: Blob) => {
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw new Error('Falha ao enviar a foto: ' + error.message);
    };
    await up(p.photo, n.photo);
    try {
      await up(p.thumb, n.thumb);
      const { error } = await supabase.from('memories').insert({
        id: n.id, user_id: n.userId, date: n.date, photo_path: p.photo, thumb_path: p.thumb, source: n.source,
        question: n.question, answer: n.answer, question2: n.question2 ?? null, answer2: n.answer2 ?? null,
      });
      if (error) throw error.code === '23505' ? new DuplicateDateError() : new Error(error.message);
    } catch (e) {
      await supabase.storage.from(BUCKET).remove([p.photo, p.thumb]).catch(() => {});
      throw e;
    }
  },

  async updateAnswers(id: string, answer: string, answer2?: string): Promise<void> {
    const { error } = await supabase.from('memories').update({ answer, answer2: answer2 ?? null }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async remove(m: Memory): Promise<void> {
    const { error } = await supabase.from('memories').delete().eq('id', m.id);
    if (error) throw new Error(error.message);
    await supabase.storage.from(BUCKET).remove([m.photoPath, m.thumbPath]).catch(() => {});
  },
};
