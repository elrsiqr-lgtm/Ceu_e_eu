import { Sparkle } from './ui';

/** Marca "Enlevo": palavra em serifa com um arco de céu e uma estrela. */
export default function Logo({ size = 'md', tagline }: { size?: 'md' | 'lg'; tagline?: string }) {
  return (
    <div className={`logo ${size}`}>
      <div className="logo-mark">
        <svg className="logo-arc" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 20 Q48 -12 100 7" fill="none" stroke="currentColor" strokeWidth="1.3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>
        <Sparkle />
        <h1 className="logo-word">Enlevo</h1>
      </div>
      {tagline && <p className="logo-tag">{tagline}</p>}
    </div>
  );
}
