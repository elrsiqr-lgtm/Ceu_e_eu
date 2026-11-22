import type { Ctx } from '../App';
import type { Memory } from '../lib/memories';
import { formatShort } from '../lib/dates';
import { Header, Photo } from './ui';

export default function Gallery({ ctx, list }: { ctx: Ctx; list: Memory[] | null }) {
  return (
    <section>
      <Header title="Meus Céus" />
      {list === null ? null : list.length === 0 ? (
        <p className="empty">Seus céus aparecerão aqui.<br />Sem pressa: cada dia tem o seu.</p>
      ) : (
        <div className="mosaic">
          {list.map((m) => (
            <button key={m.id} className="tile" onClick={() => ctx.go({ name: 'memory', id: m.id, from: 'gallery' })}
              aria-label={`Memória de ${formatShort(m.date)}`}>
              <Photo src={m.thumbUrl} alt={`Céu de ${formatShort(m.date)}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
