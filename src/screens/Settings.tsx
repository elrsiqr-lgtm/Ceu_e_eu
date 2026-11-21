import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import { users, settings, type Settings } from '../lib/db';
import { signOut } from '../lib/auth';
import { notificationsSupported, requestPermission } from '../lib/notifications';
import { Header } from './ui';

export default function SettingsScreen({ ctx }: { ctx: Ctx }) {
  const [s, setS] = useState<Settings | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => { settings.get(ctx.userId).then(setS); }, [ctx.userId]);
  if (!s) return null;

  async function update(p: Partial<Settings>) {
    const next = { ...s!, ...p };
    setS(next); await settings.put(next);
  }
  async function toggle(on: boolean) {
    setNote('');
    if (on && !(await requestPermission())) {
      setNote(notificationsSupported() ? 'Permita notificações no navegador para receber o lembrete.' : 'Este navegador não oferece notificações.');
      return update({ remind: false });
    }
    await update({ remind: on });
  }
  async function del() {
    if (!window.confirm('Excluir sua conta e TODAS as suas memórias? Isso não pode ser desfeito.')) return;
    await users.deleteAccount(ctx.userId); signOut(); ctx.logout();
  }

  return (
    <section>
      <Header title="Configurações" />
      <div className="stack">
        <div className="card">
          <label className="switch"><span>Lembrete diário</span>
            <input type="checkbox" role="switch" checked={s.remind} onChange={(e) => toggle(e.target.checked)} /></label>
          <label className="timerow"><span>Horário</span>
            <input type="time" value={s.time} disabled={!s.remind} onChange={(e) => update({ time: e.target.value || '18:00' })} /></label>
          <p className="hint">Sem lembrete se o dia já tiver sido registrado. O aviso aparece enquanto o app estiver aberto.</p>
          {note && <p className="err" role="alert">{note}</p>}
        </div>
        <div className="card">
          <p className="hint">Seus registros são privados e ficam guardados apenas neste aparelho.</p>
          <button className="pill outline" onClick={() => { signOut(); ctx.logout(); }}>Sair</button>
          <button className="textbtn danger" onClick={del}>Excluir minha conta e dados</button>
        </div>
      </div>
    </section>
  );
}
