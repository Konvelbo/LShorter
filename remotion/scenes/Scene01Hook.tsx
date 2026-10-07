import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraFrame } from '../components/CameraFrame';

export const Scene01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const card1Spring = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 12 } });
  const card2Spring = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 12 } });
  const card3Spring = spring({ frame: Math.max(0, frame - 45), fps, config: { damping: 12 } });

  return (
    <CameraFrame durationInFrames={135} zoomStart={0.98} zoomEnd={1.04}>
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
        {/* Main Text Header */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: 1200,
            transform: `translateY(${(1 - titleSpring) * 35}px)`,
            opacity: titleSpring,
            zIndex: 30,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              padding: '6px 18px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 20,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span>Le problème des liens classiques</span>
          </div>

          <h1
            style={{
              fontSize: 60,
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}
          >
            Vos liens méritent mieux qu'une{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              simple redirection muette.
            </span>
          </h1>

          <p style={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.75)', fontWeight: 500 }}>
            Des clics perdus. Zéro ciblage. Zéro attribution.
          </p>
        </div>

        {/* Floating Chaos Cards */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Card 1: Raw URL */}
          <div
            style={{
              position: 'absolute',
              left: 140,
              top: 180,
              width: 500,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 14,
              padding: '18px 24px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
              transform: `translateY(${(1 - card1Spring) * 60}px) rotate(-4deg)`,
              opacity: card1Spring,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 700 }}>⚠️ LIEN BRUT & ILLISIBLE</span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              https://my-store.com/checkout?utm_source=meta&utm_medium=cpc&campaign=launch&ref=92384723
            </div>
          </div>

          {/* Card 2: No Attribution */}
          <div
            style={{
              position: 'absolute',
              right: 140,
              top: 220,
              width: 440,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: 14,
              padding: '18px 24px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
              transform: `translateY(${(1 - card2Spring) * 60}px) rotate(3deg)`,
              opacity: card2Spring,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>❓ AUCUNE ATTRIBUTION</span>
            </div>
            <div style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 600 }}>
              D'où viennent ces 184 000 clics ? Zéro data.
            </div>
          </div>

          {/* Card 3: Mobile 404 */}
          <div
            style={{
              position: 'absolute',
              left: 220,
              bottom: 160,
              width: 480,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 14,
              padding: '18px 24px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
              transform: `translateY(${(1 - card3Spring) * 60}px) rotate(2deg)`,
              opacity: card3Spring,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 700 }}>🚫 ERREUR EN PLEINE CAMPAGNE</span>
            </div>
            <div style={{ fontSize: 15, color: '#FFFFFF' }}>
              Utilisateurs iPhone redirigés vers une erreur 404. Budget publicitaire gaspillé.
            </div>
          </div>
        </div>
      </div>
    </CameraFrame>
  );
};
