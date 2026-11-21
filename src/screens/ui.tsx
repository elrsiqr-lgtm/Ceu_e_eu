import type { ReactNode } from 'react';
import { useBlobUrl } from '../lib/hooks';

const P: Record<string, ReactNode> = {
  home: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  chev: <path d="M9 5l7 7-7 7" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16z" />,
};
export const Icon = ({ name }: { name: string }) => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name]}</svg>
);
export const Sparkle = () => (
  <svg className="sparkle" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3z" fill="currentColor" /></svg>
);

export function Photo({ blob, alt, className }: { blob?: Blob; alt: string; className?: string }) {
  const url = useBlobUrl(blob);
  return url ? <img src={url} alt={alt} className={className} loading="lazy" /> : <div className={`ph ${className ?? ''}`} />;
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="head">
      {onBack ? <button className="iconbtn" onClick={onBack} aria-label="Voltar"><Icon name="back" /></button> : <span className="iconbtn" />}
      <h1>{title}</h1>
      <span className="iconbtn">{right}</span>
    </header>
  );
}
