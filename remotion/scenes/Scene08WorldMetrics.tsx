import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const Scene08WorldMetrics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Metric cards springs
  const card1Spring = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 12 } });
  const card2Spring = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 12 } });
  const card3Spring = spring({ frame: Math.max(0, frame - 60), fps, config: { damping: 12 } });

  const counterProgress = interpolate(frame, [25, 90], [0, 1], {
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
          marginBottom: 48,
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
          Infrastructure Mondiale
        </span>
        <h2 style={{ fontSize: 50, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Performances mondiales{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            sans compromis.
          </span>
        </h2>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
          Cloudflare Anycast Network déployé dans plus de 300 villes à travers le monde.
        </p>
      </div>

      {/* 3 Massive Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, width: '100%', maxWidth: 1200 }}>
        {/* Metric 1 */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 20,
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(56, 189, 248, 0.15)',
            transform: `translateY(${(1 - card1Spring) * 60}px) scale(${card1Spring})`,
            opacity: card1Spring,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#38BDF8', marginBottom: 12 }}>
            TOTAL DES CLICS ANALYSÉS
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            <AnimatedCounter from={10000} to={184300} progress={counterProgress} suffix="+" />
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
            100% résolus à l'Edge sans latence
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 20,
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
            transform: `translateY(${(1 - card2Spring) * 60}px) scale(${card2Spring})`,
            opacity: card2Spring,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#10B981', marginBottom: 12 }}>
            TEMPS DE REDIRECTION
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            &lt; 15 <span style={{ fontSize: 32, color: '#10B981' }}>ms</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
            Plus rapide qu'un battement de cils
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(129, 140, 248, 0.35)',
            borderRadius: 20,
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(129, 140, 248, 0.15)',
            transform: `translateY(${(1 - card3Spring) * 60}px) scale(${card3Spring})`,
            opacity: card3Spring,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#818CF8', marginBottom: 12 }}>
            DISPONIBILITÉ RÉSEAU
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            99.99 <span style={{ fontSize: 32, color: '#818CF8' }}>%</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
            SLA garanti pour les entreprises
          </div>
        </div>
      </div>
    </div>
  );
};
