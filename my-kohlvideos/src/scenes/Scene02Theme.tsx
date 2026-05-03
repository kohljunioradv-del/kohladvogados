import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, FONTS } from '../constants';
import { BilingualSubtitle } from '../components/BilingualSubtitle';

const DOT_GRID = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 20) * 5.2 + 2,
  y: Math.floor(i / 20) * 11 + 5,
  delay: Math.floor(i / 4) * 3,
}));

// Approximate positions on the map grid
const BRAZIL_X = 22;
const BRAZIL_Y = 62;
const CHINA_X = 78;
const CHINA_Y = 38;

export const Scene02Theme: React.FC = () => {
  const frame = useCurrentFrame();

  const mapOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const lineProgress = interpolate(frame, [30, 200], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const titleOpacity = interpolate(frame, [20, 60], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const lineEndX = BRAZIL_X + (CHINA_X - BRAZIL_X) * lineProgress;
  const lineEndY = BRAZIL_Y + (CHINA_Y - BRAZIL_Y) * lineProgress;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: COLORS.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* World map dots */}
      <div style={{ position: 'absolute', inset: 0, opacity: mapOpacity }}>
        {DOT_GRID.map((dot, i) => {
          const dotOpacity = interpolate(frame, [dot.delay, dot.delay + 12], [0, 0.2], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: COLORS.gold,
                opacity: dotOpacity,
              }}
            />
          );
        })}
      </div>

      {/* Connection line */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.green} />
            <stop offset="100%" stopColor={COLORS.red} />
          </linearGradient>
        </defs>
        <line
          x1={BRAZIL_X}
          y1={BRAZIL_Y}
          x2={lineEndX}
          y2={lineEndY}
          stroke="url(#lineGrad)"
          strokeWidth="0.4"
          strokeDasharray="1 0.5"
          opacity={0.8}
        />
      </svg>

      {/* Brazil marker */}
      <div style={{ position: 'absolute', left: `${BRAZIL_X}%`, top: `${BRAZIL_Y}%`, transform: 'translate(-50%, -50%)', opacity: mapOpacity }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: COLORS.green, border: `2px solid ${COLORS.white}`, boxShadow: `0 0 12px ${COLORS.green}` }} />
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.white, marginTop: 4, whiteSpace: 'nowrap', fontWeight: 600 }}>🇧🇷 Brasil</div>
      </div>

      {/* China marker */}
      <div style={{ position: 'absolute', left: `${CHINA_X}%`, top: `${CHINA_Y}%`, transform: 'translate(-50%, -50%)', opacity: interpolate(frame, [150, 200], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }) }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: COLORS.red, border: `2px solid ${COLORS.white}`, boxShadow: `0 0 12px ${COLORS.red}` }} />
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.white, marginTop: 4, whiteSpace: 'nowrap', fontWeight: 600 }}>🇨🇳 China</div>
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <div style={{ fontFamily: FONTS.title, fontSize: 52, color: COLORS.white, fontWeight: 700 }}>
          Brasil <span style={{ color: COLORS.gold }}>×</span> China
        </div>
        <div style={{ fontFamily: FONTS.chinese, fontSize: 28, color: COLORS.gold, marginTop: 8 }}>
          巴西 × 中国
        </div>
      </div>

      <BilingualSubtitle
        pt="O mundo está cada vez mais conectado. Brasil e China compartilham uma das relações comerciais mais importantes do planeta."
        zh="世界正变得越来越紧密相连。巴西与中国共享着地球上最重要的贸易关系之一。"
        startFrame={60}
        endFrame={640}
      />
    </div>
  );
};
