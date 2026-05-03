import { Sequence } from 'remotion';
import { SCENES } from './constants';
import { Scene01Cover } from './scenes/Scene01Cover';
import { Scene02Theme } from './scenes/Scene02Theme';
import { Scene03Problem } from './scenes/Scene03Problem';
import { Scene04Solution } from './scenes/Scene04Solution';
import { Scene05Differentials } from './scenes/Scene05Differentials';
import { Scene06CTA } from './scenes/Scene06CTA';
import { Scene07Outro } from './scenes/Scene07Outro';

export const MainVideo: React.FC = () => {
  return (
    <>
      <Sequence from={SCENES.s1.from} durationInFrames={SCENES.s1.duration}>
        <Scene01Cover />
      </Sequence>

      <Sequence from={SCENES.s2.from} durationInFrames={SCENES.s2.duration}>
        <Scene02Theme />
      </Sequence>

      <Sequence from={SCENES.s3.from} durationInFrames={SCENES.s3.duration}>
        <Scene03Problem />
      </Sequence>

      <Sequence from={SCENES.s4.from} durationInFrames={SCENES.s4.duration}>
        <Scene04Solution />
      </Sequence>

      <Sequence from={SCENES.s5.from} durationInFrames={SCENES.s5.duration}>
        <Scene05Differentials />
      </Sequence>

      <Sequence from={SCENES.s6.from} durationInFrames={SCENES.s6.duration}>
        <Scene06CTA />
      </Sequence>

      <Sequence from={SCENES.s7.from} durationInFrames={SCENES.s7.duration}>
        <Scene07Outro />
      </Sequence>
    </>
  );
};
