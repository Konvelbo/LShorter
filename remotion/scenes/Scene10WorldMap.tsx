import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { CameraFrame } from '../components/CameraFrame';
import { ScreenshotWindow } from '../components/ScreenshotWindow';

export const Scene10WorldMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Metric cards springs
  const card1Spring = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 12 } });
  const card2Spring = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 12 } });
  const card3Spring = spring({ frame: Math.max(0, frame - 45), fps, config: { damping: 12 } });

  const counterProgress = interpolate(frame, [15, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
            marginBottom: 20,
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
            Infrastructure Mondiale
          </span>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Déploiement mondial{' '}
            <span style={{ color: '#38BDF8' }}>sans compromis.</span>
          </h2>
        </div>

        {/* Real Screenshot Window */}
        <div style={{ transform: `scale(${enterSpring})`, opacity: enterSpring, position: 'relative' }}>
          <ScreenshotWindow
            src="/screenshots/geo2/geo1.png"
            title="LShorter — Advanced Geographic Analytics"
            width={1420}
            height={680}
            badge="Télémétrie ISO 3166-1"
          />

          {/* 3 Metric Overlay Badges */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 24,
              zIndex: 50,
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                borderRadius: 14,
                padding: '16px 28px',
                textAlign: 'center',
                transform: `scale(${card1Spring})`,
                opacity: card1Spring,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', marginBottom: 4 }}>
                CLICS ANALYSÉS
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF' }}>
                <AnimatedCounter from={10000} to={184300} progress={counterProgress} suffix="+" />
              </div>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                borderRadius: 14,
                padding: '16px 28px',
                textAlign: 'center',
                transform: `scale(${card2Spring})`,
                opacity: card2Spring,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>
                LATENCE MONDIALE
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#10B981' }}>
                &lt; 15 ms
              </div>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(129, 140, 248, 0.5)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                borderRadius: 14,
                padding: '16px 28px',
                textAlign: 'center',
                transform: `scale(${card3Spring})`,
                opacity: card3Spring,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#818CF8', marginBottom: 4 }}>
                SLA RÉSEAU
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#818CF8' }}>
                99.99%
              </div>
            </div>
          </div>
        </div>
      </div>
    </CameraFrame>
  );
};
