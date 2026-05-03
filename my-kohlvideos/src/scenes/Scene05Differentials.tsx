import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONTS, SERVICES, CITIES } from '../constants';
import { BilingualSubtitle } from '../components/BilingualSubtitle';

export const Scene05Differentials: React.FC = () => {
  const frame = useCurrentFrame();

  const mapOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: COLORS.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {/* Left: Brazil map area with cities */}
      <div style={{ flex: 1, opacity: mapOpacity, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 340, height: 420 }}>
          {/* Brazil outline simplified */}
          <svg width="340" height="420" viewBox="0 0 340 420" style={{ position: 'absolute' }}>
            <path
              d="M170,20 L280,60 L310,120 L300,200 L260,280 L220,360 L170,400 L120,360 L80,280 L60,180 L80,100 L120,50 Z"
              fill="none"
              stroke={`${COLORS.green}44`}
              strokeWidth="2"
            />
          </svg>

          {/* City pins */}
          {CITIES.map((city, i) => {
            const localFrame = Math.max(0, frame - i * 30);
            const scale = spring({ frame: localFrame, fps: 30, config: { damping: 10, stiffness: 200 } });
            const pulseOpacity = 0.3 + Math.sin(frame * 0.1 + i) * 0.2;

            const cx = city.x * 340;
            const cy = city.y * 420;

            return (
              <div key={i} style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${scale})` }}>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: COLORS.green,
                      border: `2px solid ${COLORS.white}`,
                      boxShadow: `0 0 12px ${COLORS.green}`,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: '50%',
                      border: `2px solid ${COLORS.green}`,
                      opacity: pulseOpacity,
                    }}
                  />
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.white, marginTop: 4, whiteSpace: 'nowrap', textAlign: 'center', fontWeight: 600 }}>
                  {city.name}
                </div>
              </div>
            );
          })}

          {/* China connection arrow */}
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: '50%',
              opacity: interpolate(frame, [120, 160], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
            }}
          >
            <div style={{ fontFamily: FONTS.body, fontSize: 28, color: COLORS.gold }}>→ 🇨🇳</div>
          </div>
        </div>
      </div>

      {/* Right: Service cards */}
      <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 60px 60px 20px', gap: 16 }}>
        <div
          style={{
            fontFamily: FONTS.title,
            fontSize: 36,
            color: COLORS.white,
            marginBottom: 8,
            opacity: interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
          }}
        >
          China Desk <span style={{ color: COLORS.gold }}>Especializado</span>
        </div>

        {SERVICES.map((service, i) => {
          const localFrame = Math.max(0, frame - (i * 40 + 40));
          const slideX = interpolate(localFrame, [0, 20], [60, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const cardOpacity = interpolate(localFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '14px 20px',
                background: `${COLORS.gold}0f`,
                border: `1px solid ${COLORS.gold}33`,
                borderRadius: 10,
                opacity: cardOpacity,
                transform: `translateX(${slideX}px)`,
              }}
            >
              <span style={{ fontSize: 32 }}>{service.icon}</span>
              <div>
                <div style={{ fontFamily: FONTS.body, fontSize: 20, color: COLORS.white, fontWeight: 600 }}>{service.pt}</div>
                <div style={{ fontFamily: FONTS.chinese, fontSize: 16, color: COLORS.gold, marginTop: 2 }}>{service.zh}</div>
              </div>
            </div>
          );
        })}
      </div>

      <BilingualSubtitle
        pt="A Kohl Advogados está presente em Campo Grande, São Paulo, Brasília, Fortaleza — e na China."
        zh="Kohl律师事务所在大坎普、圣保罗、巴西利亚、福塔莱萨以及中国设有办事处。"
        startFrame={280}
        endFrame={1020}
      />
    </div>
  );
};
