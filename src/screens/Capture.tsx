import { useEffect, useRef, useState } from 'react';
import type { Ctx } from '../App';
import { drafts, memories, uid, type Draft, type PhotoSource } from '../lib/db';
import { formatLong } from '../lib/dates';
import { processImage } from '../lib/image';
import { pickQuestion } from '../lib/questions';
import { useBlobUrl } from '../lib/hooks';
import { Header, Icon } from './ui';

type Step = 'photo' | 'write' | 'review';

export default function Capture({ ctx, date }: { ctx: Ctx; date: string }) {
  const [ready, setReady] = useState(false);
  const [d, setD] = useState<Draft>({ userId: ctx.userId, date });
  const [thumb, setThumb] = useState<Blob>();
  const [history, setHistory] = useState<string[]>([]);
  const [step, setStep] = useState<Step>('photo');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const url = useBlobUrl(d.photo);

  // carrega rascunho e histórico de perguntas; se a data já tem memória, abre-a
  useEffect(() => {
    (async () => {
      const existing = await memories.byDate(ctx.userId, date);
      if (existing) { ctx.go({ name: 'memory', id: existing.id, from: 'today' }); return; }
      const [dr, all] = await Promise.all([drafts.get(ctx.userId, date), memories.list(ctx.userId)]);
      const hist = all.map((m) => m.question);
      setHistory(hist);
      const base: Draft = dr ?? { userId: ctx.userId, date };
      if (!base.question) base.question = pickQuestion(hist).text;
      setD(base);
      if (base.photo) setStep('write');
      setReady(true);
    })();
  }, [ctx.userId, date]);

  // autosalva rascunho (proteção contra perda de informações)
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => { drafts.put(d); }, 400);
    return () => clearTimeout(t);
  }, [d, ready]);

  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  async function pick(file: File | undefined, source: PhotoSource) {
    if (!file) return;
    setErr(''); setBusy(true);
    try { const { photo, thumb } = await processImage(file); setThumb(thumb); set({ photo, source }); setStep('write'); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const swap = (key: 'question' | 'question2') =>
    set({ [key]: pickQuestion(history, [d.question ?? '', d.question2 ?? '']).text } as Partial<Draft>);

  async function save() {
    if (!d.photo || !d.question) { setErr('A fotografia é obrigatória.'); return; }
    setBusy(true); setErr('');
    try {
      let t = thumb;
      if (!t) t = (await processImage(new File([d.photo], 'x.jpg', { type: d.photo.type }))).thumb;
      const now = Date.now();
      const id = uid();
      await memories.put({
        id, userId: ctx.userId, date, photo: d.photo, thumb: t, source: d.source ?? 'galeria',
        question: d.question, answer: (d.answer ?? '').trim(),
        question2: d.question2, answer2: d.question2 ? (d.answer2 ?? '').trim() : undefined,
        createdAt: now, updatedAt: now,
      });
      await drafts.remove(ctx.userId, date);
      ctx.refresh();
      ctx.go({ name: 'memory', id, from: 'today' });
    } catch (e) { setErr('Não foi possível salvar: ' + (e as Error).message); setBusy(false); }
  }

  async function leave() {
    if (ready) await drafts.put(d);
    ctx.go({ name: 'today' });
  }
  if (!ready) return null;
  const back = step === 'photo' ? leave : () => setStep(step === 'review' ? 'write' : 'photo');

  return (
    <section className="capture">
      <Header title={formatLong(date).split(', ')[1]} onBack={back} />
      {step === 'photo' && (
        <div className="stack">
          <p className="lead">Olhe para o alto. Como está o céu agora?</p>
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pick(e.target.files?.[0], 'camera'); e.target.value = ''; }} />
          <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0], 'galeria'); e.target.value = ''; }} />
          <button className="pill dark" disabled={busy} onClick={() => camRef.current?.click()}><Icon name="camera" /> Fotografar o céu</button>
          <button className="pill outline" disabled={busy} onClick={() => galRef.current?.click()}><Icon name="image" /> Escolher da galeria</button>
          {busy && <p className="hint">Preparando a imagem…</p>}
          {err && <p className="err" role="alert">{err}</p>}
        </div>
      )}
      {step === 'write' && (
        <div className="stack">
          {url && <img className="preview" src={url} alt="Foto escolhida" />}
          {d.source === 'galeria' && <p className="badge">Importada da galeria</p>}
          <label className="qlabel" htmlFor="a1">{d.question}</label>
          <textarea id="a1" placeholder="Escreva aqui… (opcional)" value={d.answer ?? ''} onChange={(e) => set({ answer: e.target.value })} rows={5} />
          <button className="textbtn" onClick={() => swap('question')}>Trocar pergunta</button>
          {d.question2 ? (
            <>
              <label className="qlabel" htmlFor="a2">{d.question2}</label>
              <textarea id="a2" placeholder="Escreva aqui… (opcional)" value={d.answer2 ?? ''} onChange={(e) => set({ answer2: e.target.value })} rows={4} />
              <div className="row">
                <button className="textbtn" onClick={() => swap('question2')}>Trocar pergunta</button>
                <button className="textbtn" onClick={() => set({ question2: undefined, answer2: undefined })}>Remover</button>
              </div>
            </>
          ) : <button className="textbtn" onClick={() => set({ question2: pickQuestion(history, [d.question ?? '']).text })}>Adicionar outra pergunta</button>}
          <button className="pill dark" onClick={() => setStep('review')}>Revisar</button>
        </div>
      )}
      {step === 'review' && (
        <div className="stack">
          {url && <img className="preview" src={url} alt="Foto escolhida" />}
          <article className="qa"><h2>{d.question}</h2><p>{d.answer?.trim() || <em>Sem resposta.</em>}</p></article>
          {d.question2 && <article className="qa"><h2>{d.question2}</h2><p>{d.answer2?.trim() || <em>Sem resposta.</em>}</p></article>}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="pill dark" disabled={busy} onClick={save}>{busy ? 'Salvando…' : 'Salvar memória'}</button>
        </div>
      )}
    </section>
  );
}
