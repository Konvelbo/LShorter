import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Cursor } from '../components/Cursor';

export const Scene09Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Cursor moving to CTA button
  const cursorX = interpolate(frame, [20, 60], [1300, 960], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [20, 60], [750, 580], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isClicking = frame >= 65 && frame <= 73;
  const clickProgress = interpolate(frame, [65, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Final logo transition after click
  const showFinalLogo = frame >= 85;
  const logoSpring = spring({
    frame: Math.max(0, frame - 85),
    fps,
    config: { damping: 12, stiffness: 100 },
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
      {!showFinalLogo ? (
        /* Pre-click CTA Screen */
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
            Prêt à passer au niveau supérieur ?
          </span>

          <h2
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}
          >
            Reprenez le contrôle de votre trafic.
          </h2>

          <p
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 44,
            }}
          >
            Optimisez chaque clic avec le Smart Edge Routing dès aujourd'hui.
          </p>

          {/* Big CTA Button */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: 22,
              fontWeight: 700,
              padding: '20px 48px',
              borderRadius: 14,
              boxShadow: '0 0 50px rgba(37, 99, 235, 0.65)',
              transform: isClicking ? 'scale(0.95)' : 'scale(1)',
              transition: 'transform 0.08s ease',
            }}
          >
            <span>Démarrer gratuitement</span>
            <span>→</span>
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            Aucune carte de crédit requise • Déploiement en 2 minutes
          </div>
        </div>
      ) : (
        /* Post-click Final Logo & Domain Card */
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
              width: 140,
              height: 140,
              marginBottom: 28,
              borderRadius: 36,
              boxShadow: '0 0 80px rgba(82, 113, 255, 0.75)',
            }}
          >
            <Img
              src="/logo.png"
              style={{
                width: 140,
                height: 140,
                borderRadius: 36,
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 72,
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
              fontSize: 32,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 24,
            }}
          >
            lshorter.io
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 999,
              padding: '8px 24px',
              fontSize: 16,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 500,
            }}
          >
            Smart Links • Edge Routing • Deep Analytics
          </div>
        </div>
      )}

      {/* Animated Cursor */}
      {!showFinalLogo && (
        <Cursor
          x={cursorX}
          y={cursorY}
          isClicking={isClicking}
          clickProgress={clickProgress}
        />
      )}
    </div>
  );
};
