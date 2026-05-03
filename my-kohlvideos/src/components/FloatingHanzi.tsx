import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, FONTS, HANZI_CHARS } from '../constants';

interface HanziItem {
  char: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  speed: number;
}

const ITEMS: HanziItem[] = HANZI_CHARS.map((char, i) => ({
  char,
  x: 8 + (i % 4) * 24 + Math.sin(i * 1.7) * 8,
  y: 10 + Math.floor(i / 4) * 45 + Math.cos(i * 2.3) * 10,
  size: 48 + (i % 3) * 18,
  delay: i * 18,
  speed: 0.3 + (i % 3) * 0.15,
}));

export const FloatingHanzi: React.FC<{ totalFrames?: number }> = ({ totalFrames = 240 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {ITEMS.map((item, i) => {
        const localFrame = Math.max(0, frame - item.delay);
        const opacity = interpolate(localFrame, [0, 20, totalFrames - item.delay - 20, totalFrames - item.delay], [0, 0.35, 0.35, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
        const floatY = Math.sin((frame + i * 40) * item.speed * 0.05) * 12;
        const floatX = Math.cos((frame + i * 60) * item.speed * 0.03) * 6;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y + floatY * 0.1}%`,
              transform: `translate(${floatX}px, ${floatY}px) rotate(${Math.sin(frame * 0.01 + i) * 3}deg)`,
              opacity,
              fontSize: item.size,
              fontFamily: FONTS.chinese,
              color: COLORS.gold,
              textShadow: `0 0 30px ${COLORS.gold}66`,
              userSelect: 'none',
              transition: 'none',
            }}
          >
            {item.char}
          </div>
        );
      })}
    </div>
  );
};
