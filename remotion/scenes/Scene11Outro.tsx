import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraFrame } from '../components/CameraFrame';
import { Cursor } from '../components/Cursor';

export const Scene11Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Cursor moving to CTA button
  const cursorX = interpolate(frame, [15, 55], [1300, 960], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [15, 55], [750, 580], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isClicking = frame >= 55 && frame <= 63;
  const clickProgress = interpolate(frame, [55, 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Transition to final brand mark after click
  const showFinalLogo = frame >= 75;
  const logoSpring = spring({ frame: Math.max(0, frame - 75), fps, config: { damping: 12 } });

  return (
    <CameraFrame durationInFrames={150} zoomStart={0.96} zoomEnd={1.04}>
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
        {!showFinalLogo ? (
          /* Pre-click Call to Action */
          <div
            style={{
              textAlign: 'center',
              transform: `scale(${enterSpring})`,
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
                marginBottom: 16,
              }}
            >
              Passez au niveau supérieur
            </span>

            <h2
              style={{
                fontSize: 60,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                marginBottom: 16,
              }}
            >
              Reprenez le contrôle de votre trafic.
            </h2>

            <p style={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.75)', marginBottom: 44 }}>
              Redirection Edge instantanée, QR codes sur-mesure & attribution des revenus.
            </p>

            {/* Big Action Button */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 14,
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 800,
                padding: '22px 52px',
                borderRadius: 16,
                boxShadow: '0 0 60px rgba(37, 99, 235, 0.75)',
                transform: isClicking ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.08s ease',
              }}
            >
              <span>Démarrer gratuitement</span>
              <span>→</span>
            </div>

            <div style={{ marginTop: 22, fontSize: 14, color: 'rgba(255, 255, 255, 0.55)' }}>
              Aucune carte bancaire requise • Déploiement en 2 minutes
            </div>
          </div>
        ) : (
          /* Final Hero Brand Screen */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${logoSpring})`,
              opacity: logoSpring,
            }}
          >
            <div
              style={{
                width: 150,
                height: 150,
                marginBottom: 28,
                borderRadius: 38,
                boxShadow: '0 0 90px rgba(82, 113, 255, 0.8)',
              }}
            >
              <Img src="/logo.png" style={{ width: 150, height: 150, borderRadius: 38 }} />
            </div>

            <h1
              style={{
                fontSize: 76,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                marginBottom: 12,
              }}
            >
              LShorter
            </h1>

            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 26,
              }}
            >
              lshorter.io
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 999,
                padding: '10px 28px',
                fontSize: 16,
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
              }}
            >
              Smart Links • Edge Routing • Deep Analytics
            </div>
          </div>
        )}

        {/* Cursor */}
        {!showFinalLogo && (
          <Cursor
            x={cursorX}
            y={cursorY}
            isClicking={isClicking}
            clickProgress={clickProgress}
          />
        )}
      </div>
    </CameraFrame>
  );
};
