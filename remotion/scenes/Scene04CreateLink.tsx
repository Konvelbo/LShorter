import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraFrame } from '../components/CameraFrame';
import { Cursor } from '../components/Cursor';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene04CreateLink: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Camera zooms slightly in towards the drawer on the right
  const imgScale = interpolate(frame, [0, 120], [1.05, 1.14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateX = interpolate(frame, [0, 120], [-60, -110], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Cursor moving to Continue button (bottom right of the drawer)
  const cursorX = interpolate(frame, [20, 65], [1100, 1420], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [20, 65], [600, 800], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isClicking = frame >= 65 && frame <= 73;
  const clickProgress = interpolate(frame, [65, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Success pill appears after click
  const showSuccess = frame >= 80;
  const successSpring = spring({ frame: Math.max(0, frame - 80), fps, config: { damping: 12 } });

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
            Création Instantanée
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Raccourcissez. Personnalisez.{' '}
            <span style={{ color: '#38BDF8' }}>En un clic.</span>
          </h2>
        </div>

        {/* Real Drawer Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring, position: 'relative' }}>
          <ScreenshotWindow
            src="/screenshots/drawer/niveau1.png"
            title="LShorter — Create Link Studio"
            width={1420}
            height={740}
            imgScale={imgScale}
            imgTranslateX={imgTranslateX}
            badge="Domaine lsho.cc"
          />

          {/* Floating Success Pill */}
          {showSuccess && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '45%',
                transform: `translate(-50%, -50%) scale(${successSpring})`,
                backgroundColor: 'rgba(2, 6, 23, 0.95)',
                border: '2px solid #10B981',
                boxShadow: '0 0 50px rgba(16, 185, 129, 0.5)',
                borderRadius: 16,
                padding: '20px 36px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                zIndex: 50,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  LIEN PRÊT & ACTIF
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                  https://lsho.cc/summer-deal
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 8,
                }}
              >
                Copié !
              </span>
            </div>
          )}
        </div>

        {/* Cursor */}
        <Cursor
          x={cursorX}
          y={cursorY}
          isClicking={isClicking}
          clickProgress={clickProgress}
        />
      </div>
    </CameraFrame>
  );
};
