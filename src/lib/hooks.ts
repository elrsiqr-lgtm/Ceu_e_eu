import { useEffect, useState, type CSSProperties } from 'react';
import { skyAt, hourNow } from './sky';
import { memories, type Memory } from './memories';

export function useBlobUrl(blob?: Blob) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) { setUrl(undefined); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export function useMemories(userId: string, version: number): [Memory[] | null, string] {
  const [list, setList] = useState<Memory[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let on = true;
    memories.list(userId)
      .then((l) => { if (on) { setList(l); setError(''); } })
      .catch((e: Error) => { if (on) { setList((x) => x ?? []); setError('Não foi possível carregar seus céus. ' + e.message); } });
    return () => { on = false; };
  }, [userId, version]);
  return [list, error];
}

/** Estilo (variáveis CSS) do céu para a hora atual; atualiza a cada minuto e ao voltar para o app. */
export function useSky(): CSSProperties {
  const [sky, setSky] = useState(() => skyAt(hourNow()));
  useEffect(() => {
    const tick = () => setSky(skyAt(hourNow()));
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  return sky.vars as CSSProperties;
}

/** Hora do dia (fracionária) que se atualiza a cada minuto. */
export function useHour(): number {
  const [h, setH] = useState(() => hourNow());
  useEffect(() => {
    const tick = () => setH(hourNow());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  return h;
}
