import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Cursor } from '../components/Cursor';
import { MacWindow } from '../components/MacWindow';

export const Scene03CreateLink: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Window entry spring
  const windowSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Typing animation for the long destination URL
  const targetUrl = 'https://mybrand.com/summer-launch-2026-vip';
  const charsCount = Math.floor(interpolate(frame, [10, 60], [0, targetUrl.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const typedUrl = targetUrl.slice(0, charsCount);

  // Cursor movement
  const cursorX = interpolate(frame, [50, 85], [1300, 1140], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [50, 85], [750, 660], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Click timing: frame 90
  const isClicking = frame >= 88 && frame <= 96;
  const clickProgress = interpolate(frame, [88, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Result success state appears after click
  const showSuccess = frame >= 98;
  const successSpring = spring({
    frame: Math.max(0, frame - 98),
    fps,
    config: { damping: 12, stiffness: 110 },
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
      {/* Header text */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 36,
          transform: `translateY(${(1 - windowSpring) * 30}px)`,
          opacity: windowSpring,
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
            marginBottom: 8,
          }}
        >
          Création Instantanée
        </span>
        <h2 style={{ fontSize: 48, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Raccourcissez. Personnalisez.{' '}
          <span style={{ color: '#38BDF8' }}>En un clic.</span>
        </h2>
      </div>

      {/* Main MacWindow Frame */}
      <div
        style={{
          transform: `scale(${windowSpring})`,
          opacity: windowSpring,
        }}
      >
        <MacWindow title="lshorter.io/dashboard/create-link" width={920} badge="Production Ready">
          <div style={{ padding: '36px 44px' }}>
            {!showSuccess ? (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.85)',
                      marginBottom: 10,
                    }}
                  >
                    URL de destination <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div
                    style={{
                      backgroundColor: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      fontSize: 16,
                      color: '#FFFFFF',
                      fontFamily: 'monospace',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span>{typedUrl}</span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 2,
                        height: 20,
                        backgroundColor: '#38BDF8',
                        marginLeft: 4,
                        opacity: frame % 15 < 8 ? 1 : 0,
                      }}
                    />
                  </div>
                </div>

                {/* Short link row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 32 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                      Domaine Court
                    </label>
                    <div
                      style={{
                        backgroundColor: 'rgba(2, 6, 23, 0.7)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10,
                        padding: '14px 18px',
                        fontSize: 15,
                        color: '#38BDF8',
                        fontWeight: 600,
                      }}
                    >
                      lsho.cc
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                      Slug Personnalisé
                    </label>
                    <div
                      style={{
                        backgroundColor: 'rgba(2, 6, 23, 0.7)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10,
                        padding: '14px 18px',
                        fontSize: 15,
                        color: '#FFFFFF',
                      }}
                    >
                      summer-deal
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    Redirection mondiale Edge sous 2.4 ms
                  </span>
                  <div
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: 600,
                      padding: '14px 32px',
                      borderRadius: 10,
                      boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)',
                      transform: isClicking ? 'scale(0.95)' : 'scale(1)',
                    }}
                  >
                    Raccourcir le lien →
                  </div>
                </div>
              </div>
            ) : (
              /* Success Result Card */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px 0',
                  transform: `scale(${successSpring})`,
                  opacity: successSpring,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '2px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    color: '#10B981',
                    marginBottom: 18,
                    boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  ✓
                </div>

                <h3 style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
                  Lien créé avec succès !
                </h3>

                <div
                  style={{
                    backgroundColor: 'rgba(2, 6, 23, 0.9)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    borderRadius: 12,
                    padding: '14px 28px',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#38BDF8',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <span>https://lsho.cc/summer-deal</span>
                  <span
                    style={{
                      fontSize: 12,
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: 6,
                    }}
                  >
                    Copié !
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.7)',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      padding: '8px 16px',
                      borderRadius: 8,
                    }}
                  >
                    ⚡ Routage intelligent activé
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.7)',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      padding: '8px 16px',
                      borderRadius: 8,
                    }}
                  >
                    📊 Télémétrie en temps réel
                  </div>
                </div>
              </div>
            )}
          </div>
        </MacWindow>
      </div>

      {/* Realistic Animated Cursor */}
      <Cursor
        x={cursorX}
        y={cursorY}
        isClicking={isClicking}
        clickProgress={clickProgress}
        label={frame < 90 ? 'Cliquez' : undefined}
      />
    </div>
  );
};
