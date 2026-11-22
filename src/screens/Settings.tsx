import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import { settings, type Settings } from '../lib/settings';
import { signOut, deleteAccount } from '../lib/auth';
import { disablePush, enablePush } from '../lib/push';
import { Header } from './ui';

export default function SettingsScreen({ ctx }: { ctx: Ctx }) {
  const [s, setS] = useState<Settings | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { settings.get(ctx.userId).then(setS).catch((e: Error) => setNote(e.message)); }, [ctx.userId]);
  if (!s) return note ? <section><Header title="Configurações" /><p className="err">{note}</p></section> : null;

  async function apply(next: Settings) {
    const prev = s!;
    setS(next);
    try { await settings.save(ctx.userId, next); } catch (e) { setS(prev); setNote((e as Error).message); }
  }
  async function toggle(on: boolean) {
    setNote(''); setBusy(true);
    try {
      if (on) {
        const r = await enablePush(ctx.userId);
        if (r === 'denied') return setNote('Permita as notificações nas configurações do navegador para receber o lembrete.');
        if (r === 'unsupported') return setNote('Este navegador não oferece notificações push. No iPhone, adicione o app à Tela de Início primeiro.');
        await apply({ ...s!, remind: true });
      } else { await apply({ ...s!, remind: false }); await disablePush(); }
    } catch (e) { setNote((e as Error).message); } finally { setBusy(false); }
  }
  async function del() {
    if (!window.confirm('Excluir sua conta e TODAS as suas fotos e memórias? Isso não pode ser desfeito.')) return;
    setBusy(true);
    try { await deleteAccount(); } catch (e) { setNote((e as Error).message); setBusy(false); }
  }

  return (
    <section>
      <Header title="Configurações" />
      <div className="stack">
        <div className="card">
          <label className="switch"><span>Lembrete diário</span>
            <input type="checkbox" role="switch" checked={s.remind} disabled={busy} onChange={(e) => toggle(e.target.checked)} /></label>
          <label className="timerow"><span>Horário</span>
            <input type="time" value={s.time} disabled={!s.remind} onChange={(e) => e.target.value && apply({ ...s, time: e.target.value })} /></label>
          <p className="hint">O lembrete chega neste horário apenas se o dia ainda não tiver sido registrado. Vale para os aparelhos em que você ativou.</p>
          {note && <p className="err" role="alert">{note}</p>}
        </div>
        <div className="card">
          <p className="hint">Seus registros são privados e ficam protegidos na sua conta.</p>
          <button className="pill outline" disabled={busy} onClick={() => signOut()}>Sair</button>
          <button className="textbtn danger" disabled={busy} onClick={del}>Excluir minha conta e dados</button>
        </div>
      </div>
    </section>
  );
}
