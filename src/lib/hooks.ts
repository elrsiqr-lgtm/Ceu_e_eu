import { useEffect, useState } from 'react';
import { memories, type Memory } from './db';

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

export function useMemories(userId: string, version: number) {
  const [list, setList] = useState<Memory[] | null>(null);
  useEffect(() => { let on = true; memories.list(userId).then((l) => on && setList(l)); return () => { on = false; }; }, [userId, version]);
  return list;
}
