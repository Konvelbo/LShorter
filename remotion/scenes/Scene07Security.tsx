import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CalloutBadge } from '../components/CalloutBadge';
import { CameraFrame } from '../components/CameraFrame';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene07Security: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Camera focuses on the PathLock and security toggles in the drawer
  const imgScale = interpolate(frame, [0, 120], [1.06, 1.16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateX = interpolate(frame, [0, 120], [-80, -140], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateY = interpolate(frame, [0, 120], [-40, -100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const callout1Spring = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 12 } });
  const callout2Spring = spring({ frame: Math.max(0, frame - 45), fps, config: { damping: 12 } });

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
              color: '#10B981',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Sécurité & Contrôle Avancé
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Protection de niveau entreprise.{' '}
            <span style={{ color: '#34D399' }}>PathLock™ inclus.</span>
          </h2>
        </div>

        {/* Real Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring, position: 'relative' }}>
          <ScreenshotWindow
            src="/screenshots/drawer/niveau4-1.png"
            title="LShorter — Protection & Expiry Settings"
            width={1420}
            height={740}
            imgScale={imgScale}
            imgTranslateX={imgTranslateX}
            imgTranslateY={imgTranslateY}
            badge="Chiffrement AES-256"
          />

          {/* Callouts */}
          <CalloutBadge
            text="PathLock™ Strict"
            subtext="Verrouille les visiteurs sur la page de paiement sans fuite"
            x={100}
            y={320}
            targetX={540}
            targetY={380}
            opacity={callout1Spring}
          />

          <CalloutBadge
            text="Masquage d'URL (Cloaking)"
            subtext="Conserve votre domaine court propre dans la barre d'adresse"
            x={100}
            y={500}
            targetX={580}
            targetY={540}
            opacity={callout2Spring}
          />
        </div>
      </div>
    </CameraFrame>
  );
};
