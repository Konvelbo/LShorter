import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CalloutBadge } from '../components/CalloutBadge';
import { CameraFrame } from '../components/CameraFrame';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene05GeoRouting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Camera pan across the routing rule drawer
  const imgScale = interpolate(frame, [0, 135], [1.08, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateX = interpolate(frame, [0, 135], [-70, -130], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateY = interpolate(frame, [0, 135], [-20, -50], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Callouts animation
  const callout1Spring = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 12 } });
  const callout2Spring = spring({ frame: Math.max(0, frame - 45), fps, config: { damping: 12 } });

  return (
    <CameraFrame durationInFrames={135} zoomStart={0.96} zoomEnd={1.03}>
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
            Routage Conditionnel Avancé
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Smart Edge Routing.{' '}
            <span style={{ color: '#38BDF8' }}>Une seule URL, toutes vos cibles.</span>
          </h2>
        </div>

        {/* Real Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring, position: 'relative' }}>
          <ScreenshotWindow
            src="/screenshots/drawer/niveau3.png"
            title="LShorter — Smart Multi-Condition Routing"
            width={1420}
            height={740}
            imgScale={imgScale}
            imgTranslateX={imgTranslateX}
            imgTranslateY={imgTranslateY}
            badge="Règles dynamiques"
          />

          {/* Callout Badges with Dotted Lines */}
          <CalloutBadge
            text="Règle 1 : France 🇫🇷 + Mobile 📱"
            subtext="Redirection instantanée vers l'offre mobile dédiée"
            x={100}
            y={240}
            targetX={550}
            targetY={340}
            opacity={callout1Spring}
          />

          <CalloutBadge
            text="Détection IP Edge à zéro latence"
            subtext="Traitement sous 2 ms sur le réseau Cloudflare"
            x={100}
            y={460}
            targetX={580}
            targetY={420}
            opacity={callout2Spring}
          />
        </div>
      </div>
    </CameraFrame>
  );
};
