import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../constants';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  seed: number;
}

const PARTICLES: Particle[] = Array.from({ length: 40 }, (_, i) => ({
  x: 10 + (i * 37.3) % 80,
  y: 10 + (i * 53.7) % 80,
  vx: (Math.sin(i * 1.3) * 0.4),
  vy: -(0.3 + (i % 4) * 0.15),
  size: 2 + (i % 4),
  seed: i * 0.7,
}));

export const GoldenParticles: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {PARTICLES.map((p, i) => {
        const t = (frame * 0.4 + p.seed * 60) % 200;
        const x = p.x + p.vx * t + Math.sin(t * 0.05 + p.seed) * 3;
        const y = p.y + p.vy * t;
        const opacity = interpolate(t % 200, [0, 30, 160, 200], [0, 0.8 * intensity, 0.8 * intensity, 0]) * intensity;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: COLORS.gold,
              opacity,
              boxShadow: `0 0 ${p.size * 3}px ${COLORS.gold}`,
            }}
          />
        );
      })}
    </div>
  );
};
