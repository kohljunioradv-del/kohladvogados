import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONTS } from '../constants';
import { GoldenParticles } from '../components/GoldenParticles';
import { BilingualSubtitle } from '../components/BilingualSubtitle';

export const Scene04Solution: React.FC = () => {
  const frame = useCurrentFrame();

  // Barriers dissolve out
  const barrierOpacity = interpolate(frame, [0, 40], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const logoScale = spring({ frame: frame - 30, fps: 30, config: { damping: 14, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [30, 80], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const handshakeScale = spring({ frame: frame - 120, fps: 30, config: { damping: 12, stiffness: 120 } });
  const handshakeOpacity = interpolate(frame, [120, 160], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const taglineOpacity = interpolate(frame, [200, 260], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const mockupOpacity = interpolate(frame, [280, 360], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const mockupY = interpolate(frame, [280, 360], [40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at center, #1e1e3a 0%, ${COLORS.bg} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GoldenParticles intensity={1.2} />

      {/* Dissolving barriers */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: barrierOpacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          filter: 'blur(4px)',
        }}
      >
        {['🚫', '🚫', '🚫', '🚫'].map((b, i) => (
          <div key={i} style={{ fontSize: 64, opacity: 0.4 }}>{b}</div>
        ))}
      </div>

      {/* Platform logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          textAlign: 'center',
          zIndex: 10,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '16px 48px',
            border: `2px solid ${COLORS.gold}`,
            borderRadius: 8,
            background: `${COLORS.gold}15`,
            boxShadow: `0 0 40px ${COLORS.gold}44`,
          }}
        >
          <div style={{ fontFamily: FONTS.title, fontSize: 42, color: COLORS.gold, fontWeight: 700, letterSpacing: 2 }}>
            Encontre na China
          </div>
          <div style={{ fontFamily: FONTS.chinese, fontSize: 22, color: `${COLORS.gold}cc`, marginTop: 6 }}>
            在中国找到
          </div>
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 22, color: COLORS.white, marginTop: 12, letterSpacing: 4 }}>
          www.encontrenachina.com.br
        </div>
      </div>

      {/* Handshake */}
      <div
        style={{
          opacity: handshakeOpacity,
          transform: `scale(${handshakeScale})`,
          fontSize: 90,
          zIndex: 10,
          textShadow: `0 0 40px ${COLORS.gold}`,
          marginBottom: 20,
        }}
      >
        🇧🇷 🤝 🇨🇳
      </div>

      {/* Tagline box */}
      <div
        style={{
          opacity: taglineOpacity,
          textAlign: 'center',
          padding: '16px 48px',
          background: `linear-gradient(135deg, ${COLORS.green}22, ${COLORS.red}22)`,
          border: `1px solid ${COLORS.gold}44`,
          borderRadius: 8,
          maxWidth: 800,
          zIndex: 10,
        }}
      >
        <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLORS.white, lineHeight: 1.6 }}>
          A ponte empresarial entre Brasil e China
        </div>
        <div style={{ fontFamily: FONTS.chinese, fontSize: 20, color: COLORS.gold, marginTop: 8 }}>
          连接巴西与中国的商业桥梁
        </div>
      </div>

      {/* Site mockup */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          bottom: 120,
          opacity: mockupOpacity,
          transform: `translateY(${mockupY}px)`,
          width: 360,
          background: `${COLORS.bg}ee`,
          border: `1px solid ${COLORS.gold}44`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: `0 20px 60px #000a`,
        }}
      >
        <div style={{ background: COLORS.red, padding: '8px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
          {['#ff5f57', '#ffbd2e', '#28c940'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${COLORS.white}aa`, marginLeft: 8 }}>
            encontrenachina.com.br
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: FONTS.title, fontSize: 18, color: COLORS.gold, marginBottom: 8 }}>Encontre na China</div>
          <div style={{ height: 8, background: `${COLORS.white}22`, borderRadius: 4, marginBottom: 6 }} />
          <div style={{ height: 8, background: `${COLORS.white}15`, borderRadius: 4, width: '70%', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[COLORS.green, COLORS.red, COLORS.gold].map((c, i) => (
              <div key={i} style={{ flex: 1, height: 40, background: `${c}33`, borderRadius: 6, border: `1px solid ${c}44` }} />
            ))}
          </div>
        </div>
      </div>

      <BilingualSubtitle
        pt="A Kohl Advogados criou o Encontre na China — uma plataforma de conexão dedicada ao relacionamento empresarial entre Brasil e China."
        zh={'Kohl律师事务所创建了“在中国找到”——一个专注于巴中商业关系的连接平台。'}
        startFrame={400}
        endFrame={1320}
      />
    </div>
  );
};
