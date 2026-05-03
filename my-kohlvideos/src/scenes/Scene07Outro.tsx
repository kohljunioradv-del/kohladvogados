import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, FONTS } from '../constants';

const INFO_LINES = [
  { text: 'Campo Grande · São Paulo · Brasília · Fortaleza · China', delay: 80, size: 22, color: COLORS.white, font: FONTS.body },
  { text: 'www.encontrenachina.com.br', delay: 130, size: 26, color: COLORS.gold, font: FONTS.body },
  { text: 'Kohl律师事务所 | 中国业务部', delay: 170, size: 20, color: `${COLORS.gold}bb`, font: FONTS.chinese },
];

export const Scene07Outro: React.FC = () => {
  const frame = useCurrentFrame();

  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const logoOpacity = interpolate(frame, [20, 80], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const logoScale = interpolate(frame, [20, 80], [0.9, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const dividerWidth = interpolate(frame, [60, 120], [0, 600], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const flagsOpacity = interpolate(frame, [200, 250], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Final fade out
  const finalFade = interpolate(frame, [540, 600], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: COLORS.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: bgOpacity * finalFade,
      }}
    >
      {/* Subtle glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${COLORS.gold}08 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        <div style={{ fontFamily: FONTS.title, fontSize: 80, color: COLORS.white, fontWeight: 900, letterSpacing: 6, lineHeight: 1 }}>
          KOHL
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 30, color: COLORS.gold, letterSpacing: 14, marginTop: 8 }}>
          ADVOGADOS
        </div>
        <div style={{ fontFamily: FONTS.chinese, fontSize: 20, color: `${COLORS.gold}99`, letterSpacing: 8, marginTop: 4 }}>
          科尔律师事务所
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: interpolate(frame, [50, 100], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
          fontFamily: FONTS.body,
          fontSize: 18,
          color: `${COLORS.white}88`,
          letterSpacing: 6,
          marginBottom: 32,
          marginTop: 4,
        }}
      >
        FULL SERVICE · CHINA DESK
      </div>

      {/* Divider */}
      <div
        style={{
          width: dividerWidth,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          boxShadow: `0 0 8px ${COLORS.gold}66`,
          marginBottom: 32,
        }}
      />

      {/* Info lines */}
      {INFO_LINES.map((line, i) => {
        const lineOpacity = interpolate(frame, [line.delay, line.delay + 25], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
        const lineY = interpolate(frame, [line.delay, line.delay + 25], [12, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

        return (
          <div
            key={i}
            style={{
              opacity: lineOpacity,
              transform: `translateY(${lineY}px)`,
              fontFamily: line.font,
              fontSize: line.size,
              color: line.color,
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {line.text}
          </div>
        );
      })}

      {/* Flags */}
      <div
        style={{
          opacity: flagsOpacity,
          fontSize: 52,
          marginTop: 32,
          letterSpacing: 16,
        }}
      >
        🇧🇷 🤝 🇨🇳
      </div>
    </div>
  );
};
