import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { MacWindow } from '../components/MacWindow';

export const Scene07Revenue: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Revenue count up progress
  const revenueProgress = interpolate(frame, [15, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Target meter progress: from 75% to 100%
  const meterWidth = interpolate(frame, [30, 110], [75, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Buyer cards sliding in
  const buyer1Spring = spring({ frame: Math.max(0, frame - 35), fps, config: { damping: 12 } });
  const buyer2Spring = spring({ frame: Math.max(0, frame - 65), fps, config: { damping: 12 } });
  const buyer3Spring = spring({ frame: Math.max(0, frame - 95), fps, config: { damping: 12 } });

  const goalReached = frame >= 110;

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
          marginBottom: 28,
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
            marginBottom: 8,
          }}
        >
          Attribution du Chiffre d'Affaires
        </span>
        <h2 style={{ fontSize: 46, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Ne mesurez pas seulement des clics.{' '}
          <span style={{ color: '#10B981' }}>Mesurez du revenu réel.</span>
        </h2>
      </div>

      {/* MacWindow Container */}
      <div
        style={{
          transform: `scale(${enterSpring})`,
          opacity: enterSpring,
        }}
      >
        <MacWindow title="Revenus & Conversions attribuées" width={1040} badge="Edge Telemetry">
          <div style={{ padding: '28px 36px' }}>
            {/* Top Stat Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* Total Revenue Box */}
              <div
                style={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 14,
                  padding: '20px 24px',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)',
                }}
              >
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                  Revenu total attribué (30 jours)
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#10B981' }}>
                  <AnimatedCounter from={3200} to={12480} progress={revenueProgress} prefix="€" />
                </div>
                <div style={{ fontSize: 12, color: '#38BDF8', marginTop: 4 }}>
                  ↗ +34.8% vs mois précédent
                </div>
              </div>

              {/* Median Edge Speed Box */}
              <div
                style={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 14,
                  padding: '20px 24px',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.15)',
                }}
              >
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                  Vitesse médiane de redirection
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#38BDF8' }}>
                  2.4 <span style={{ fontSize: 20 }}>ms</span>
                </div>
                <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>
                  ⚡ SLA Sub-5ms garanti
                </div>
              </div>

              {/* Monthly Goal Meter */}
              <div
                style={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: goalReached ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Objectif mensuel</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: goalReached ? '#F59E0B' : '#FFFFFF' }}>
                    {Math.floor(meterWidth)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${meterWidth}%`,
                      backgroundColor: goalReached ? '#F59E0B' : '#10B981',
                      borderRadius: 999,
                      boxShadow: goalReached ? '0 0 15px #F59E0B' : '0 0 15px #10B981',
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  {goalReached ? '🎉 OBJECTIF ATTEINT !' : '184 300 / 200 000 clics'}
                </div>
              </div>
            </div>

            {/* Live Buyers Feed (Sliding Cards) */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
                Dernières conversions attribuées en direct :
              </div>

              {/* Buyer 1 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 10,
                  marginBottom: 10,
                  transform: `translateX(${(1 - buyer1Spring) * 60}px)`,
                  opacity: buyer1Spring,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    SC
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Sarah Connor</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>🇺🇸 United States • /pricing-sheet-pdf</div>
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 6,
                  }}
                >
                  +499 €
                </div>
              </div>

              {/* Buyer 2 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 10,
                  marginBottom: 10,
                  transform: `translateX(${(1 - buyer2Spring) * 60}px)`,
                  opacity: buyer2Spring,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#8B5CF6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    MB
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Marc Benioff</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>🇫🇷 France • /summer-promo-2026</div>
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 6,
                  }}
                >
                  +249 €
                </div>
              </div>

              {/* Buyer 3 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 10,
                  transform: `translateX(${(1 - buyer3Spring) * 60}px)`,
                  opacity: buyer3Spring,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#EC4899',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    SM
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Sophie Martin</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>🇫🇷 France • iOS iPhone 15 Pro • /launch-deck-v2</div>
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 6,
                  }}
                >
                  +189 €
                </div>
              </div>
            </div>
          </div>
        </MacWindow>
      </div>
    </div>
  );
};
