import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONTS } from '../constants';
import { FloatingHanzi } from '../components/FloatingHanzi';
import { GoldenParticles } from '../components/GoldenParticles';
import { FlagBadge } from '../components/FlagBadge';

export const Scene01Cover: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [30, 90], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const logoScale = spring({ frame: frame - 30, fps: 30, config: { damping: 14, stiffness: 120 } });

  const dividerWidth = interpolate(frame, [80, 160], [0, 400], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const urlOpacity = interpolate(frame, [150, 210], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const urlY = interpolate(frame, [150, 210], [20, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at 80% 50%, ${COLORS.red}22 0%, transparent 50%), radial-gradient(ellipse at 20% 50%, ${COLORS.green}22 0%, transparent 50%), ${COLORS.bg}`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FloatingHanzi totalFrames={240} />
      <GoldenParticles intensity={0.6} />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ fontFamily: FONTS.title, fontSize: 72, color: COLORS.white, fontWeight: 900, letterSpacing: 4, lineHeight: 1 }}>
          KOHL
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 28, color: COLORS.gold, letterSpacing: 12, marginTop: 8 }}>
          ADVOGADOS
        </div>
        <div style={{ fontFamily: FONTS.chinese, fontSize: 20, color: `${COLORS.gold}aa`, letterSpacing: 6, marginTop: 4 }}>
          科尔律师事务所
        </div>
      </div>

      {/* Gold divider */}
      <div
        style={{
          width: dividerWidth,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          margin: '24px 0',
          boxShadow: `0 0 12px ${COLORS.gold}88`,
          zIndex: 10,
        }}
      />

      {/* Flags */}
      <FlagBadge flag="🇧🇷" label="Brasil" startFrame={60} x={38} y={72} />
      <FlagBadge flag="🇨🇳" label="China" startFrame={90} x={62} y={72} />

      {/* URL */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          zIndex: 10,
        }}
      >
        <span style={{ fontFamily: FONTS.body, fontSize: 26, color: COLORS.gold, letterSpacing: 3, fontWeight: 600 }}>
          www.encontrenachina.com.br
        </span>
      </div>
    </div>
  );
};
