import type { Ctx } from '../App';
import type { Memory } from '../lib/memories';
import { formatLong, formatShort, greeting, todayISO } from '../lib/dates';
import { Icon, Photo, Sparkle } from './ui';

export default function Today({ ctx, list }: { ctx: Ctx; list: Memory[] | null }) {
  const today = todayISO();
  const done = list?.find((m) => m.date === today);
  const last = list?.[0];
  return (
    <section className="today">
      <div className="hero">
        <Sparkle />
        <h1 className="brand">Entre o Céu e Eu</h1>
        <p className="greet">{greeting()}</p>
        <p className="date">{formatLong(today)}</p>
        <p className="sub">{done ? 'Seu céu de hoje já está guardado.' : 'Um novo céu espera por você.'}</p>
        {done
          ? <button className="pill light" onClick={() => ctx.go({ name: 'memory', id: done.id, from: 'today' })}>Ver a memória de hoje</button>
          : <button className="pill light" onClick={() => ctx.go({ name: 'capture', date: today })}><Icon name="camera" /> Registrar o céu</button>}
        <button className="textbtn" onClick={() => ctx.go({ name: 'calendar' })}>Registrar um dia anterior</button>
      </div>
      {last && (
        <button className="lastcard" onClick={() => ctx.go({ name: 'memory', id: last.id, from: 'today' })}>
          <Photo src={last.thumbUrl} alt="Miniatura da última memória" />
          <span><strong>Sua última memória</strong><small>{formatShort(last.date)}</small></span>
          <Icon name="chev" />
        </button>
      )}
    </section>
  );
}
