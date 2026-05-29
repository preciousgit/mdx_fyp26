import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;      // radius
  glow: number;   // glow multiplier (hub nodes are larger)
  bright: number; // brightness 0-1
}

const HUB_CHANCE = 0.12;        // 12% of nodes are "hub" nodes (larger, brighter)
const MAX_DIST = 160;           // connection draw distance in px
const PARTICLE_COUNT = 90;
const DRIFT_SPEED = 0.22;       // base drift per frame

// Electric blue palette matching the image
const LINE_COLOR   = [96, 165, 250];  // blue-400
const NODE_COLOR   = [147, 197, 253]; // blue-300
const GLOW_COLOR   = [59, 130, 246];  // blue-500

function rgba(rgb: number[], a: number) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
}

function dist(a: Particle, b: Particle) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function makeParticles(w: number, h: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const hub = Math.random() < HUB_CHANCE;
    return {
      x: Math.random() * w,
      // bias toward bottom half, matching the image composition
      y: Math.random() < 0.55 ? h * 0.45 + Math.random() * h * 0.55 : Math.random() * h * 0.6,
      vx: (Math.random() - 0.5) * DRIFT_SPEED,
      vy: (Math.random() - 0.5) * DRIFT_SPEED,
      r:  hub ? 3.5 + Math.random() * 2 : 1.2 + Math.random() * 1.6,
      glow: hub ? 6 : 3.5,
      bright: hub ? 0.85 + Math.random() * 0.15 : 0.45 + Math.random() * 0.45,
    };
  });
}

export default function PlexusBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const ptcls     = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ptcls.current = makeParticles(canvas.width, canvas.height);
    };

    const draw = () => {
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      const ps = ptcls.current;

      // ── Connections ──────────────────────────────────────────────────
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const d = dist(ps[i], ps[j]);
          if (d >= MAX_DIST) continue;
          const proximity = 1 - d / MAX_DIST;
          // blend brightness of both endpoints
          const alpha = proximity * proximity * 0.55 * ((ps[i].bright + ps[j].bright) / 2);
          ctx.beginPath();
          ctx.strokeStyle = rgba(LINE_COLOR, alpha);
          ctx.lineWidth   = proximity * 0.9 + 0.2;
          ctx.moveTo(ps[i].x, ps[i].y);
          ctx.lineTo(ps[j].x, ps[j].y);
          ctx.stroke();
        }
      }

      // ── Nodes ────────────────────────────────────────────────────────
      for (const p of ps) {
        // Outer glow
        const glowR = p.r * p.glow;
        const grad  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0, rgba(GLOW_COLOR, p.bright * 0.6));
        grad.addColorStop(0.4, rgba(GLOW_COLOR, p.bright * 0.15));
        grad.addColorStop(1, rgba(GLOW_COLOR, 0));
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Inner halo
        const haloR = p.r * 2.2;
        const halo  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        halo.addColorStop(0, rgba(NODE_COLOR, p.bright * 0.9));
        halo.addColorStop(1, rgba(NODE_COLOR, 0));
        ctx.beginPath();
        ctx.fillStyle = halo;
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.fillStyle = rgba(NODE_COLOR, p.bright);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Move ─────────────────────────────────────────────────────────
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        // Soft-wrap: bounce off edges with some margin
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    draw();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
