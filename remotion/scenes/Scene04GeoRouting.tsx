import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CalloutBadge } from '../components/CalloutBadge';
import { Cursor } from '../components/Cursor';
import { MacWindow } from '../components/MacWindow';

export const Scene04GeoRouting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 95 },
  });

  // Callouts entrance
  const callout1Spring = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 12 },
  });
  const callout2Spring = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 12 },
  });

  // Cursor movement to the Add Condition button
  const cursorX = interpolate(frame, [80, 130], [1400, 1260], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [80, 130], [700, 520], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isClicking = frame >= 135 && frame <= 143;
  const clickProgress = interpolate(frame, [135, 155], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
            color: '#38BDF8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Routage Intelligent à l'Edge
        </span>
        <h2 style={{ fontSize: 46, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Une seule URL.{' '}
          <span style={{ color: '#38BDF8' }}>Une infinité de destinations adaptées.</span>
        </h2>
      </div>

      {/* MacWindow Routing Rule Builder */}
      <div
        style={{
          transform: `scale(${enterSpring})`,
          opacity: enterSpring,
          position: 'relative',
        }}
      >
        <MacWindow title="Règles de routage dynamique" width={960} badge="Multi-conditions">
          <div style={{ padding: '28px 36px' }}>
            {/* Rule 1 Container */}
            <div
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 14,
                padding: '22px 26px',
                marginBottom: 20,
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      padding: '3px 10px',
                      borderRadius: 6,
                    }}
                  >
                    RÈGLE 1
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>
                    Trafic Mobile Français
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>● Active</span>
              </div>

              {/* Conditions Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>SI</span>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>Pays est</span>
                  <strong style={{ color: '#38BDF8' }}>🇫🇷 France (FR)</strong>
                </div>

                <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>ET</span>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>Appareil est</span>
                  <strong style={{ color: '#38BDF8' }}>📱 Mobile (Smartphones)</strong>
                </div>

                <div
                  style={{
                    border: '1px dashed rgba(56, 189, 248, 0.4)',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#38BDF8',
                    cursor: 'pointer',
                    transform: isClicking ? 'scale(0.95)' : 'scale(1)',
                  }}
                >
                  + Ajouter condition
                </div>
              </div>

              {/* Redirect Action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '12px 18px',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>ALORS REDIRIGE VERS →</span>
                <span style={{ fontSize: 14, color: '#FFFFFF', fontFamily: 'monospace' }}>
                  https://shop.example.com/special-deal-france
                </span>
              </div>
            </div>

            {/* Rule 2 Preview */}
            <div
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '16px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: 6,
                  }}
                >
                  RÈGLE 2
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                  SI 🇺🇸 USA & 🍎 iOS ➔ Ouvre App Store
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Priorité #2</span>
            </div>
          </div>
        </MacWindow>

        {/* Feature Callouts (Left & Right) */}
        <CalloutBadge
          text="Détection IP Edge instantanée"
          subtext="Moins de 2 ms sans perte de vitesse"
          x={-180}
          y={100}
          targetX={140}
          targetY={160}
          opacity={callout1Spring}
        />

        <CalloutBadge
          text="Ciblage par OS & Langue"
          subtext="Envoyez iOS sur l'App Store, Android sur Google Play"
          x={720}
          y={360}
          targetX={540}
          targetY={260}
          opacity={callout2Spring}
        />
      </div>

      {/* Animated Cursor */}
      <Cursor
        x={cursorX}
        y={cursorY}
        isClicking={isClicking}
        clickProgress={clickProgress}
      />
    </div>
  );
};
