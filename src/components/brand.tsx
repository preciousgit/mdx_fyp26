import React from 'react';
import { Link } from 'react-router-dom';

/** The mark is a simplified GS1 DataMatrix: an L-shaped finder pattern with
 *  a few data modules. It is the code printed on every TrustChain pack. */
export function LogoMark({ size = 28, inverted = false }: { size?: number; inverted?: boolean }) {
  const bg = inverted ? '#FFFFFF' : '#0E4D3A';
  const fg = inverted ? '#0E4D3A' : '#FFFFFF';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill={bg} />
      <g fill={fg}>
        <rect x="7" y="7" width="3" height="18" />
        <rect x="7" y="22" width="18" height="3" />
        <rect x="12" y="7" width="3" height="3" />
        <rect x="17" y="7" width="3" height="3" />
        <rect x="22" y="7" width="3" height="3" />
        <rect x="22" y="12" width="3" height="3" />
        <rect x="22" y="17" width="3" height="3" />
        <rect x="12" y="12" width="3" height="3" />
        <rect x="17" y="17" width="3" height="3" />
      </g>
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 w-fit" aria-label="TrustChain home">
      <LogoMark inverted={inverted} />
      <span
        className={`text-[1.2rem] ${inverted ? 'text-white' : 'text-ink'}`}
        style={{ fontVariationSettings: "'wdth' 86", fontWeight: 720, letterSpacing: '-0.01em' }}
      >
        TrustChain
      </span>
    </Link>
  );
}

/** Deterministic DataMatrix-style graphic for illustrations. Not a scannable code. */
export function DataMatrix({ seed = 'trustchain', size = 112, modules = 16, color = '#15201B' }: {
  seed?: string; size?: number; modules?: number; color?: string;
}) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  const cells: React.ReactNode[] = [];
  const u = size / modules;
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      const finder = x === 0 || y === modules - 1;
      const timing = (y === 0 && x % 2 === 0) || (x === modules - 1 && y % 2 === 1);
      const on = finder || timing || (x > 0 && y > 0 && x < modules - 1 && y < modules - 1 && rand() > 0.52);
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * u} y={y * u} width={u + 0.3} height={u + 0.3} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill={color} role="img" aria-label="Printed pack code">
      {cells}
    </svg>
  );
}

export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
