import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import { memories, type Memory } from '../lib/memories';
import { formatLong } from '../lib/dates';
import { Header, Icon } from './ui';

export default function MemoryView({ ctx, id, from }: { ctx: Ctx; id: string; from: 'gallery' | 'calendar' | 'today' }) {
  const [m, setM] = useState<Memory | null | undefined>(undefined);
  const [edit, setEdit] = useState(false);
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    memories.get(ctx.userId, id)
      .then((x) => { setM(x ?? null); setA1(x?.answer ?? ''); setA2(x?.answer2 ?? ''); })
      .catch((e: Error) => { setM(null); setErr(e.message); });
  }, [ctx.userId, id]);
  if (m === undefined) return null;
  if (m === null) return <section><Header title="Memória" onBack={() => ctx.go({ name: from })} /><p className="empty">{err || 'Memória não encontrada.'}</p></section>;

  async function save() {
    setBusy(true); setErr('');
    try {
      const answer = a1.trim(), answer2 = m!.question2 ? a2.trim() : undefined;
      await memories.updateAnswers(m!.id, answer, answer2);
      setM({ ...m!, answer, answer2 }); setEdit(false); ctx.refresh();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function del() {
    if (!window.confirm('Excluir esta memória e a foto? Esta ação não pode ser desfeita.')) return;
    setBusy(true);
    try { await memories.remove(m!); ctx.refresh(); ctx.go({ name: from === 'today' ? 'gallery' : from }); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <section>
      <Header title={formatLong(m.date).split(', ')[1]} onBack={() => ctx.go({ name: from })}
        right={!edit && <button className="iconbtn" onClick={() => setEdit(true)} aria-label="Editar"><Icon name="edit" /></button>} />
      <div className="stack">
        {m.photoUrl && <img className="preview" src={m.photoUrl} alt={`Céu de ${formatLong(m.date)}`} />}
        <p className="badge plain">{formatLong(m.date)}{m.source === 'galeria' ? ' · importada da galeria' : ''}</p>
        <article className="qa"><h2>{m.question}</h2>
          {edit ? <textarea rows={5} value={a1} onChange={(e) => setA1(e.target.value)} aria-label={m.question} /> : <p>{m.answer || <em>Sem resposta.</em>}</p>}
        </article>
        {m.question2 && <article className="qa"><h2>{m.question2}</h2>
          {edit ? <textarea rows={4} value={a2} onChange={(e) => setA2(e.target.value)} aria-label={m.question2} /> : <p>{m.answer2 || <em>Sem resposta.</em>}</p>}
        </article>}
        {err && <p className="err" role="alert">{err}</p>}
        {edit ? (
          <div className="row"><button className="pill dark" disabled={busy} onClick={save}>Salvar</button>
            <button className="pill outline" disabled={busy} onClick={() => { setEdit(false); setA1(m.answer); setA2(m.answer2 ?? ''); }}>Cancelar</button></div>
        ) : <button className="textbtn danger" disabled={busy} onClick={del}><Icon name="trash" /> Excluir memória</button>}
      </div>
    </section>
  );
}
