import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONTS } from '../constants';
import { BilingualSubtitle } from '../components/BilingualSubtitle';

const BARRIERS = [
  { icon: '🌐', label: 'Idioma', zh: '语言', delay: 60 },
  { icon: '📜', label: 'Legislação', zh: '法律法规', delay: 120 },
  { icon: '💱', label: 'Câmbio', zh: '汇率', delay: 180 },
  { icon: '🕐', label: 'Fuso Horário', zh: '时区', delay: 240 },
];

export const Scene03Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const distanceOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Animated route line
  const routeProgress = interpolate(frame, [10, 160], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at center, ${COLORS.bg} 0%, #0d0d1a 100%)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Route visualization */}
      <div style={{ position: 'relative', width: 900, marginBottom: 40 }}>
        <svg width="900" height="120" viewBox="0 0 900 120">
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill={COLORS.gold} />
            </marker>
          </defs>
          {/* Base line */}
          <line x1="80" y1="60" x2="820" y2="60" stroke={`${COLORS.gold}33`} strokeWidth="2" />
          {/* Animated line */}
          <line
            x1="80"
            y1="60"
            x2={80 + 740 * routeProgress}
            y2="60"
            stroke={COLORS.gold}
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            strokeDasharray="8 4"
            opacity={0.9}
          />
          {/* Brazil dot */}
          <circle cx="80" cy="60" r="8" fill={COLORS.green} />
          <text x="80" y="90" textAnchor="middle" fill={COLORS.white} fontSize="14" fontFamily="sans-serif">🇧🇷</text>
          {/* China dot */}
          <circle cx="820" cy="60" r="8" fill={COLORS.red} opacity={routeProgress > 0.9 ? 1 : 0} />
          <text x="820" y="90" textAnchor="middle" fill={COLORS.white} fontSize="14" fontFamily="sans-serif" opacity={routeProgress > 0.9 ? 1 : 0}>🇨🇳</text>
        </svg>

        {/* Distance label */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: distanceOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: FONTS.title, fontSize: 56, color: COLORS.red, fontWeight: 900 }}>17.800 km</div>
          <div style={{ fontFamily: FONTS.chinese, fontSize: 22, color: `${COLORS.gold}bb` }}>距离 · Distância Geográfica</div>
        </div>
      </div>

      {/* Barrier icons */}
      <div style={{ display: 'flex', gap: 48, marginTop: 20 }}>
        {BARRIERS.map((b, i) => {
          const localFrame = Math.max(0, frame - b.delay);
          const scale = spring({ frame: localFrame, fps: 30, config: { damping: 12, stiffness: 160 } });
          const blockOpacity = interpolate(frame, [b.delay + 20, b.delay + 40], [0, 0.8], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

          return (
            <div
              key={i}
              style={{
                transform: `scale(${scale})`,
                opacity: localFrame > 0 ? 1 : 0,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 16,
                  background: `${COLORS.bg}`,
                  border: `2px solid ${COLORS.red}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  position: 'relative',
                }}
              >
                {b.icon}
                {/* Red block overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 14,
                    background: `${COLORS.red}`,
                    opacity: blockOpacity,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                  }}
                >
                  🚫
                </div>
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.white, marginTop: 8, fontWeight: 600 }}>{b.label}</div>
              <div style={{ fontFamily: FONTS.chinese, fontSize: 14, color: COLORS.gold, marginTop: 2 }}>{b.zh}</div>
            </div>
          );
        })}
      </div>

      <BilingualSubtitle
        pt="As diferenças de idioma, cultura e legislação criam barreiras reais para quem quer fazer negócios entre Brasil e China."
        zh="语言、文化和法律法规的差异形成了真实的障碍，阻碍着希望在巴中两国开展业务的人们。"
        startFrame={300}
        endFrame={880}
      />
    </div>
  );
};
