import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CalloutBadge } from '../components/CalloutBadge';
import { CameraFrame } from '../components/CameraFrame';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene08Stream: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Camera zooms into the 2.4 ms speed metric and live stream rows
  const imgScale = interpolate(frame, [0, 120], [1.02, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateY = interpolate(frame, [0, 120], [0, -40], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const calloutSpring = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 12 } });

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
            Télémétrie Edge en Direct
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Vitesse médiane de{' '}
            <span style={{ color: '#38BDF8' }}>2.4 ms.</span> Analyse instantanée de chaque requête.
          </h2>
        </div>

        {/* Real Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring, position: 'relative' }}>
          <ScreenshotWindow
            src="/screenshots/stream/page1.png"
            title="LShorter — Real-Time Edge Click Stream"
            width={1420}
            height={740}
            imgScale={imgScale}
            imgTranslateY={imgTranslateY}
            badge="HTTP 302 Edge Redirects"
          />

          {/* Callout on 2.4 ms speed */}
          <CalloutBadge
            text="2.4 ms V8 Isolate Lookup"
            subtext="Redirection ultra-rapide avant même le chargement du navigateur"
            x={750}
            y={120}
            targetX={980}
            targetY={260}
            opacity={calloutSpring}
          />
        </div>
      </div>
    </CameraFrame>
  );
};
