import { useEffect, useState } from 'react';
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
