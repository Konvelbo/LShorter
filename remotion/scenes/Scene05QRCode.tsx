import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Cursor } from '../components/Cursor';
import { MacWindow } from '../components/MacWindow';

export const Scene05QRCode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Switch to dots style at frame 80
  const isDotsActive = frame >= 85;

  // Cursor moving to Dots button at frame 70-85
  const cursorX = interpolate(frame, [40, 80, 110, 150], [900, 720, 720, 1260], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [40, 80, 110, 150], [600, 480, 480, 680], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isClicking = (frame >= 80 && frame <= 88) || (frame >= 150 && frame <= 158);
  const clickProgress = interpolate(
    frame,
    frame < 120 ? [80, 100] : [150, 170],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const downloaded = frame >= 160;
  const downloadSpring = spring({
    frame: Math.max(0, frame - 160),
    fps,
    config: { damping: 12 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 32,
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
            marginBottom: 8,
          }}
        >
          Studio de Personnalisation
        </span>
        <h2 style={{ fontSize: 46, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Des QR Codes prêts pour l'impression,{' '}
          <span style={{ color: '#FB923C' }}>conçus pour convertir.</span>
        </h2>
      </div>

      {/* Main MacWindow Frame */}
      <div
        style={{
          transform: `scale(${enterSpring})`,
          opacity: enterSpring,
        }}
      >
        <MacWindow title="QR Code Customization Studio" width={1020} badge="Haute Résolution">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '32px 40px', gap: 40, alignItems: 'center' }}>
            {/* Left Controls */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 14 }}>
                  Motifs de pixels (Pixel Patterns)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: !isDotsActive ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: !isDotsActive ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255,255,255,0.04)',
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    Carrés
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: isDotsActive ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: isDotsActive ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.04)',
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: 600,
                      color: isDotsActive ? '#FB923C' : '#FFFFFF',
                      boxShadow: isDotsActive ? '0 0 15px rgba(249, 115, 22, 0.3)' : 'none',
                    }}
                  >
                    ● Dots (Arrondis)
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    Diamants
                  </div>
                </div>
              </div>

              {/* Eye Corner Styles */}
              <div style={{ marginBottom: 28 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', marginBottom: 12 }}>
                  Coins des yeux (Corner Eyes)
                </h4>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Carré', 'Arrondi', 'Cercle', 'Cyber'].map((eye, i) => (
                    <div
                      key={eye}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: i === 1 ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: i === 1 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255,255,255,0.03)',
                        fontSize: 12,
                        color: i === 1 ? '#FB923C' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {eye}
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#F97316',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)',
                  }}
                >
                  Télécharger SVG (Vectoriel)
                </button>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: 13,
                    color: '#FFFFFF',
                  }}
                >
                  PNG 4K
                </div>
              </div>
            </div>

            {/* Right Live Preview Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                padding: '24px',
                borderRadius: 16,
                border: '1px solid rgba(249, 115, 22, 0.3)',
                boxShadow: '0 0 30px rgba(249, 115, 22, 0.15)',
              }}
            >
              {/* QR Code Container with Frame */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px 20px 14px 20px',
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                }}
              >
                {/* Simulated Stylized QR Code SVG */}
                <div
                  style={{
                    width: 220,
                    height: 220,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Outer corner blocks */}
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    {/* Top Left Eye */}
                    <rect x="10" y="10" width="55" height="55" rx={isDotsActive ? 16 : 4} fill="none" stroke="#EA580C" strokeWidth="8" />
                    <rect x="25" y="25" width="25" height="25" rx={isDotsActive ? 12 : 2} fill="#EA580C" />

                    {/* Top Right Eye */}
                    <rect x="155" y="10" width="55" height="55" rx={isDotsActive ? 16 : 4} fill="none" stroke="#EA580C" strokeWidth="8" />
                    <rect x="170" y="25" width="25" height="25" rx={isDotsActive ? 12 : 2} fill="#EA580C" />

                    {/* Bottom Left Eye */}
                    <rect x="10" y="155" width="55" height="55" rx={isDotsActive ? 16 : 4} fill="none" stroke="#EA580C" strokeWidth="8" />
                    <rect x="25" y="170" width="25" height="25" rx={isDotsActive ? 12 : 2} fill="#EA580C" />

                    {/* Internal dots or squares matrix */}
                    {[...Array(64)].map((_, i) => {
                      const col = i % 8;
                      const row = Math.floor(i / 8);
                      const x = 75 + col * 9;
                      const y = 20 + row * 22;
                      const r = isDotsActive ? 3.5 : 0;
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={y}
                          width={isDotsActive ? 7 : 8}
                          height={isDotsActive ? 7 : 8}
                          rx={r}
                          fill={i % 3 === 0 ? '#EA580C' : '#C2410C'}
                          opacity={i % 5 === 0 ? 0.3 : 1}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Brand Logo Icon */}
                  <div
                    style={{
                      position: 'absolute',
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: '#5271FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: 900,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    LS
                  </div>
                </div>

                {/* Bottom Frame Badge */}
                <div
                  style={{
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    width: '100%',
                    padding: '8px 0',
                    borderRadius: 8,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    marginTop: 12,
                  }}
                >
                  SCAN ME
                </div>
              </div>

              {/* Download success toast */}
              {downloaded && (
                <div
                  style={{
                    marginTop: 16,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#10B981',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: 999,
                    transform: `scale(${downloadSpring})`,
                  }}
                >
                  ✓ Fichier SVG exporté en HD
                </div>
              )}
            </div>
          </div>
        </MacWindow>
      </div>

      {/* Cursor */}
      <Cursor
        x={cursorX}
        y={cursorY}
        isClicking={isClicking}
        clickProgress={clickProgress}
      />
    </div>
  );
};
