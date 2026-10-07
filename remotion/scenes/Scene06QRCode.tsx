import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraFrame } from '../components/CameraFrame';
import { Cursor } from '../components/Cursor';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene06QRCode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Camera zooms into the QR preview and controls
  const imgScale = interpolate(frame, [0, 135], [1.02, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const imgTranslateX = interpolate(frame, [0, 135], [0, -30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Cursor moving to SVG download button
  const cursorX = interpolate(frame, [25, 75], [700, 1080], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [25, 75], [450, 720], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isClicking = frame >= 75 && frame <= 83;
  const clickProgress = interpolate(frame, [75, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const downloaded = frame >= 85;
  const downloadSpring = spring({ frame: Math.max(0, frame - 85), fps, config: { damping: 12 } });

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
              color: '#F97316',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Studio de Personnalisation
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Des QR Codes uniques.{' '}
            <span style={{ color: '#FB923C' }}>Prêts pour l'impression & le packaging.</span>
          </h2>
        </div>

        {/* Real Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring, position: 'relative' }}>
          <ScreenshotWindow
            src="/screenshots/qr-code/page1.png"
            title="LShorter — QR Code Customization Studio"
            width={1420}
            height={740}
            imgScale={imgScale}
            imgTranslateX={imgTranslateX}
            badge="Exports SVG & PNG 4K"
          />

          {/* Floating Download Success Badge */}
          {downloaded && (
            <div
              style={{
                position: 'absolute',
                right: 180,
                bottom: 120,
                backgroundColor: 'rgba(2, 6, 23, 0.95)',
                border: '2px solid #F97316',
                boxShadow: '0 0 40px rgba(249, 115, 22, 0.45)',
                borderRadius: 12,
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transform: `scale(${downloadSpring})`,
                zIndex: 50,
              }}
            >
              <span style={{ color: '#F97316', fontSize: 18, fontWeight: 900 }}>✓</span>
              <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>
                Fichier SVG Vectoriel téléchargé en HD
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
          label={frame < 75 ? 'Télécharger' : undefined}
        />
      </div>
    </CameraFrame>
  );
};
