import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, FONTS } from '../constants';

interface Props {
  pt: string;
  zh: string;
  startFrame?: number;
  endFrame?: number;
}

export const BilingualSubtitle: React.FC<Props> = ({ pt, zh, startFrame = 0, endFrame = 300 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 15, endFrame - 15, endFrame], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideY = interpolate(frame, [startFrame, startFrame + 15], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 64,
        left: 0,
        right: 0,
        opacity,
        transform: `translateY(${slideY}px)`,
        padding: '0 80px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(26,26,46,0.92) 10%, rgba(26,26,46,0.92) 90%, transparent)',
          borderLeft: `3px solid ${COLORS.gold}`,
          padding: '12px 32px',
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <p style={{ fontFamily: FONTS.body, fontSize: 28, color: COLORS.white, margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
          {pt}
        </p>
        <p style={{ fontFamily: FONTS.chinese, fontSize: 22, color: COLORS.gold, margin: '6px 0 0', lineHeight: 1.5, opacity: 0.85 }}>
          {zh}
        </p>
      </div>
    </div>
  );
};
