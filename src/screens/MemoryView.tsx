import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import { memories, type Memory } from '../lib/db';
import { formatLong } from '../lib/dates';
import { useBlobUrl } from '../lib/hooks';
import { Header, Icon } from './ui';

export default function MemoryView({ ctx, id, from }: { ctx: Ctx; id: string; from: 'gallery' | 'calendar' | 'today' }) {
  const [m, setM] = useState<Memory | null | undefined>(undefined);
  const [edit, setEdit] = useState(false);
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [err, setErr] = useState('');
  const url = useBlobUrl(m?.photo);
  useEffect(() => { memories.get(ctx.userId, id).then((x) => { setM(x ?? null); setA1(x?.answer ?? ''); setA2(x?.answer2 ?? ''); }); }, [ctx.userId, id]);
  if (m === undefined) return null;
  if (m === null) return <section><Header title="Memória" onBack={() => ctx.go({ name: from })} /><p className="empty">Memória não encontrada.</p></section>;

  async function save() {
    try {
      const next = { ...m!, answer: a1.trim(), answer2: m!.question2 ? a2.trim() : undefined, updatedAt: Date.now() };
      await memories.put(next); setM(next); setEdit(false); ctx.refresh();
    } catch (e) { setErr((e as Error).message); }
  }
  async function del() {
    if (!window.confirm('Excluir esta memória? Esta ação não pode ser desfeita.')) return;
    await memories.remove(ctx.userId, id); ctx.refresh(); ctx.go({ name: from === 'today' ? 'gallery' : from });
  }

  return (
    <section>
      <Header title={formatLong(m.date).split(', ')[1]} onBack={() => ctx.go({ name: from })}
        right={!edit && <button className="iconbtn" onClick={() => setEdit(true)} aria-label="Editar"><Icon name="edit" /></button>} />
      <div className="stack">
        {url && <img className="preview" src={url} alt={`Céu de ${formatLong(m.date)}`} />}
        <p className="badge plain">{formatLong(m.date)}{m.source === 'galeria' ? ' · importada da galeria' : ''}</p>
        <article className="qa"><h2>{m.question}</h2>
          {edit ? <textarea rows={5} value={a1} onChange={(e) => setA1(e.target.value)} aria-label={m.question} /> : <p>{m.answer || <em>Sem resposta.</em>}</p>}
        </article>
        {m.question2 && <article className="qa"><h2>{m.question2}</h2>
          {edit ? <textarea rows={4} value={a2} onChange={(e) => setA2(e.target.value)} aria-label={m.question2} /> : <p>{m.answer2 || <em>Sem resposta.</em>}</p>}
        </article>}
        {err && <p className="err" role="alert">{err}</p>}
        {edit ? (
          <div className="row"><button className="pill dark" onClick={save}>Salvar</button>
            <button className="pill outline" onClick={() => { setEdit(false); setA1(m.answer); setA2(m.answer2 ?? ''); }}>Cancelar</button></div>
        ) : <button className="textbtn danger" onClick={del}><Icon name="trash" /> Excluir memória</button>}
      </div>
    </section>
  );
}
