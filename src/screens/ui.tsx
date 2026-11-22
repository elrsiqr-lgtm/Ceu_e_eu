import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  home: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  gear: <><path d="M9.89 5.11 L10.30 2.35 L13.70 2.35 L14.11 5.11 A7.2 7.2 0 0 1 15.38 5.64 L17.62 3.97 L20.03 6.38 L18.36 8.62 A7.2 7.2 0 0 1 18.89 9.89 L21.65 10.30 L21.65 13.70 L18.89 14.11 A7.2 7.2 0 0 1 18.36 15.38 L20.03 17.62 L17.62 20.03 L15.38 18.36 A7.2 7.2 0 0 1 14.11 18.89 L13.70 21.65 L10.30 21.65 L9.89 18.89 A7.2 7.2 0 0 1 8.62 18.36 L6.38 20.03 L3.97 17.62 L5.64 15.38 A7.2 7.2 0 0 1 5.11 14.11 L2.35 13.70 L2.35 10.30 L5.11 9.89 A7.2 7.2 0 0 1 5.64 8.62 L3.97 6.38 L6.38 3.97 L8.62 5.64 A7.2 7.2 0 0 1 9.89 5.11Z" /><circle cx="12" cy="12" r="3" /></>,
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

export function Photo({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return src ? <img src={src} alt={alt} className={className} loading="lazy" /> : <div className={`ph ${className ?? ''}`} />;
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
