import { celestialAt } from '../lib/sky';

/** Paisagem do fim da tela Hoje: colinas e o sol (ou a lua) na posição da hora atual. */
export default function Horizon({ hour }: { hour: number }) {
  const c = celestialAt(hour);
  return (
    <div className="scene" aria-hidden="true">
      <div className={`body ${c.kind}`} style={{ left: `${c.x * 100}%`, top: `max(calc(86% - ${c.alt * 40}%), 392px)` }} />
      <svg className="hills" viewBox="0 0 390 260" preserveAspectRatio="xMidYMax slice">
        <path d="M0 118C60 88 132 98 204 118S334 142 390 100V260H0z" fill="var(--hill-far)" />
        <path d="M0 176C84 140 170 152 252 176S362 190 390 162V260H0z" fill="var(--hill-near)" />
        <path d="M0 176C84 140 170 152 252 176S362 190 390 162" fill="none" stroke="var(--ridge)" strokeWidth="1.6" strokeOpacity=".75" />
      </svg>
    </div>
  );
}
