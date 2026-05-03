import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONTS } from '../constants';

interface Props {
  flag: '🇧🇷' | '🇨🇳';
  label: string;
  startFrame: number;
  x: number;
  y: number;
}

export const FlagBadge: React.FC<Props> = ({ flag, label, startFrame, x, y }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  const scale = spring({ frame: localFrame, fps: 30, config: { damping: 12, stiffness: 180 } });
  const opacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          border: `3px solid ${COLORS.gold}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 52,
          background: `${COLORS.bg}cc`,
          boxShadow: `0 0 20px ${COLORS.gold}44`,
        }}
      >
        {flag}
      </div>
      <span style={{ fontFamily: FONTS.body, fontSize: 18, color: COLORS.white, fontWeight: 600, textAlign: 'center', textShadow: '0 2px 8px #000' }}>
        {label}
      </span>
    </div>
  );
};
