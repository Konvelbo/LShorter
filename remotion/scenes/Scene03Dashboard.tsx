import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraFrame } from '../components/CameraFrame';
import { Cursor } from '../components/Cursor';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene03Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Camera focuses in towards the dashboard
  const imgScale = interpolate(frame, [0, 120], [1.02, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateY = interpolate(frame, [0, 120], [0, -40], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Cursor moving towards the "+ Create Short Link" button on the left sidebar
  const cursorX = interpolate(frame, [25, 75], [900, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [25, 75], [600, 780], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isClicking = frame >= 75 && frame <= 83;
  const clickProgress = interpolate(frame, [75, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <CameraFrame durationInFrames={120} zoomStart={0.96} zoomEnd={1.03}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 24,
            transform: `translateY(${(1 - enterSpring) * 30}px)`,
            opacity: enterSpring,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#38BDF8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Plateforme Complète
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Un tableau de bord central.{' '}
            <span style={{ color: '#38BDF8' }}>Un contrôle total sur vos liens.</span>
          </h2>
        </div>

        {/* Real Dashboard Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring }}>
          <ScreenshotWindow
            src="/screenshots/dashboard/dashboardwithsidbare.png"
            title="LShorter — Dashboard Overview"
            width={1420}
            height={740}
            imgScale={imgScale}
            imgTranslateY={imgTranslateY}
            badge="184 300 Clics en direct"
          />
        </div>

        {/* Animated Cursor */}
        <Cursor
          x={cursorX}
          y={cursorY}
          isClicking={isClicking}
          clickProgress={clickProgress}
          label={frame < 75 ? '+ Créer un lien' : undefined}
        />
      </div>
    </CameraFrame>
  );
};
