import React from 'react';
import { Composition } from 'remotion';
import { LShorterPromo, TOTAL_VIDEO_FRAMES } from './Video';
import './styles.css';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Format Paysage 16:9 (Twitter Feed, LinkedIn & YouTube) */}
      <Composition
        id="LShorterPromo"
        component={LShorterPromo}
        durationInFrames={TOTAL_VIDEO_FRAMES} // 46 secondes à 30 fps (1380 frames)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
