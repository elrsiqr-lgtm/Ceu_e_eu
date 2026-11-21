import { useState } from 'react';
import type { Ctx } from '../App';
import type { Memory } from '../lib/db';
import { monthName, pad, todayISO } from '../lib/dates';
import { Header, Icon, Photo } from './ui';

export default function CalendarScreen({ ctx, list, initialMonth }: { ctx: Ctx; list: Memory[] | null; initialMonth?: string }) {
  const now = new Date();
  const [ym, setYm] = useState(() => {
    const [y, m] = (initialMonth ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}`).split('-').map(Number);
    return { y, m: m - 1 };
  });
  const byDate = new Map((list ?? []).map((m) => [m.date, m]));
  const first = new Date(ym.y, ym.m, 1).getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const today = todayISO();
  const shift = (d: number) => { const dt = new Date(ym.y, ym.m + d, 1); setYm({ y: dt.getFullYear(), m: dt.getMonth() }); };
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <section>
      <Header title="Calendário" />
      <div className="monthnav">
        <button className="iconbtn" onClick={() => shift(-1)} aria-label="Mês anterior"><Icon name="back" /></button>
        <strong>{monthName(ym.m).replace(/^./, (c) => c.toUpperCase())} de {ym.y}</strong>
        <button className="iconbtn" onClick={() => shift(1)} aria-label="Próximo mês"><Icon name="next" /></button>
      </div>
      <div className="cal" role="grid">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="dow" aria-hidden="true">{d}</span>)}
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const iso = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
          const mem = byDate.get(iso);
          const future = iso > today;
          return (
            <button key={i} className={`day ${mem ? 'has' : ''} ${iso === today ? 'today' : ''}`} disabled={future}
              aria-label={`${d} de ${monthName(ym.m)}${mem ? ', com memória' : ''}`}
              onClick={() => ctx.go(mem ? { name: 'memory', id: mem.id, from: 'calendar' } : { name: 'capture', date: iso })}>
              {mem ? <Photo blob={mem.thumb} alt="" /> : d}
            </button>
          );
        })}
      </div>
      <p className="hint">Toque em um dia vazio para registrar um céu que ficou para trás.</p>
    </section>
  );
}
