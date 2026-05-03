import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONTS } from '../constants';
import { GoldenParticles } from '../components/GoldenParticles';

export const Scene06CTA: React.FC = () => {
  const frame = useCurrentFrame();

  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const titleScale = spring({ frame: frame - 20, fps: 30, config: { damping: 14, stiffness: 120 } });
  const titleOpacity = interpolate(frame, [20, 60], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const urlOpacity = interpolate(frame, [100, 150], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const urlPulse = 0.85 + Math.sin(frame * 0.12) * 0.15;

  const qrOpacity = interpolate(frame, [160, 220], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const ctaOpacity = interpolate(frame, [200, 260], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const ctaY = interpolate(frame, [200, 260], [20, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at 30% 50%, ${COLORS.green}18 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, ${COLORS.red}18 0%, transparent 50%), ${COLORS.bg}`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: bgOpacity,
      }}
    >
      <GoldenParticles intensity={0.8} />

      {/* Flags background */}
      <div style={{ position: 'absolute', display: 'flex', gap: 60, opacity: 0.08, fontSize: 240, top: '50%', transform: 'translateY(-50%)' }}>
        <span>🇧🇷</span>
        <span>🇨🇳</span>
      </div>

      {/* Main title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textAlign: 'center',
          zIndex: 10,
          marginBottom: 40,
        }}
      >
        <div style={{ fontFamily: FONTS.title, fontSize: 64, color: COLORS.white, fontWeight: 900, lineHeight: 1.1 }}>
          Expanda seus negócios
        </div>
        <div style={{ fontFamily: FONTS.title, fontSize: 64, color: COLORS.gold, fontWeight: 900, lineHeight: 1.1 }}>
          para o mundo
        </div>
        <div style={{ fontFamily: FONTS.chinese, fontSize: 30, color: `${COLORS.gold}bb`, marginTop: 12 }}>
          将您的业务拓展到世界
        </div>
      </div>

      {/* URL pulsing */}
      <div
        style={{
          opacity: urlOpacity,
          transform: `scale(${urlPulse})`,
          textAlign: 'center',
          zIndex: 10,
          marginBottom: 32,
          padding: '16px 48px',
          border: `2px solid ${COLORS.gold}`,
          borderRadius: 8,
          background: `${COLORS.gold}15`,
          boxShadow: `0 0 ${20 + urlPulse * 20}px ${COLORS.gold}44`,
        }}
      >
        <div style={{ fontFamily: FONTS.body, fontSize: 36, color: COLORS.gold, fontWeight: 700, letterSpacing: 2 }}>
          🌐 www.encontrenachina.com.br
        </div>
      </div>

      {/* CTA text */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          textAlign: 'center',
          maxWidth: 700,
          zIndex: 10,
          marginBottom: 40,
        }}
      >
        <p style={{ fontFamily: FONTS.body, fontSize: 24, color: `${COLORS.white}cc`, lineHeight: 1.7, margin: 0 }}>
          Seja você um empresário brasileiro querendo entrar na China,<br />
          ou um empresário chinês interessado no Brasil —<br />
          <strong style={{ color: COLORS.white }}>a Kohl Advogados é a sua ponte.</strong>
        </p>
        <p style={{ fontFamily: FONTS.chinese, fontSize: 18, color: `${COLORS.gold}99`, marginTop: 12 }}>
          无论是巴西企业家还是中国企业家，Kohl律师事务所都是您的桥梁。
        </p>
      </div>

      {/* QR Code placeholder */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 80,
          opacity: qrOpacity,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            background: COLORS.white,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            boxShadow: `0 0 20px ${COLORS.gold}44`,
          }}
        >
          {/* QR code pattern simulation */}
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Corner squares */}
            <rect x="5" y="5" width="28" height="28" fill="none" stroke="#000" strokeWidth="4" />
            <rect x="11" y="11" width="16" height="16" fill="#000" />
            <rect x="67" y="5" width="28" height="28" fill="none" stroke="#000" strokeWidth="4" />
            <rect x="73" y="11" width="16" height="16" fill="#000" />
            <rect x="5" y="67" width="28" height="28" fill="none" stroke="#000" strokeWidth="4" />
            <rect x="11" y="73" width="16" height="16" fill="#000" />
            {/* Data modules */}
            {[40, 46, 52, 58, 64, 70, 76, 82, 88].map((x, i) =>
              [40, 46, 52, 58, 64, 70, 76, 82, 88].map((y, j) =>
                (i + j) % 3 !== 0 ? <rect key={`${i}-${j}`} x={x} y={y} width="4" height="4" fill="#000" opacity={((i * j) % 5) > 1 ? 1 : 0} /> : null
              )
            )}
          </svg>
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${COLORS.white}88`, marginTop: 4 }}>Escaneie aqui</div>
      </div>
    </div>
  );
};
