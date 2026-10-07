import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { CameraFrame } from '../components/CameraFrame';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene09Revenue: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Camera focuses in on the revenue graph and buyers list
  const imgScale = interpolate(frame, [0, 135], [1.02, 1.14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateY = interpolate(frame, [0, 135], [0, -50], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const counterProgress = interpolate(frame, [15, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
              color: '#10B981',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Attribution du Chiffre d'Affaires
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Ne mesurez pas seulement des clics.{' '}
            <span style={{ color: '#10B981' }}>Mesurez du revenu réel.</span>
          </h2>
        </div>

        {/* Real Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring, position: 'relative' }}>
          <ScreenshotWindow
            src="/screenshots/revenue/page2.png"
            title="LShorter — Customers & Chronological Revenue Trend"
            width={1420}
            height={740}
            imgScale={imgScale}
            imgTranslateY={imgTranslateY}
            badge="Cloudflare D1 Attribution"
          />

          {/* Floating Revenue Total Card */}
          <div
            style={{
              position: 'absolute',
              right: 80,
              top: 100,
              backgroundColor: 'rgba(2, 6, 23, 0.95)',
              border: '2px solid #10B981',
              boxShadow: '0 0 50px rgba(16, 185, 129, 0.5)',
              borderRadius: 16,
              padding: '18px 28px',
              textAlign: 'center',
              zIndex: 50,
            }}
          >
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              REVENU TOTAL ATTRIBUÉ
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#10B981' }}>
              <AnimatedCounter from={3000} to={12480} progress={counterProgress} prefix="€" />
            </div>
            <div style={{ fontSize: 12, color: '#38BDF8', fontWeight: 600, marginTop: 4 }}>
              ↗ +34.8% de croissance
            </div>
          </div>
        </div>
      </div>
    </CameraFrame>
  );
};
