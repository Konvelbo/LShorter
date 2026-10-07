import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraFrame } from '../components/CameraFrame';

export const Scene02Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const pulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.9, 1.2]);

  return (
    <CameraFrame durationInFrames={90} zoomStart={0.94} zoomEnd={1.05}>
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
        {/* Glowing Rings */}
        <div
          style={{
            position: 'absolute',
            width: 550,
            height: 550,
            borderRadius: '50%',
            border: '2px solid rgba(56, 189, 248, 0.35)',
            transform: `scale(${scaleSpring * pulse})`,
            boxShadow: '0 0 50px rgba(56, 189, 248, 0.25)',
          }}
        />

        {/* Brand Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `scale(${scaleSpring})`,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 140,
              marginBottom: 26,
              borderRadius: 36,
              boxShadow: '0 0 80px rgba(82, 113, 255, 0.75)',
            }}
          >
            <Img src="/logo.png" style={{ width: 140, height: 140, borderRadius: 36 }} />
          </div>

          <h1
            style={{
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              marginBottom: 14,
              textShadow: '0 0 35px rgba(255, 255, 255, 0.35)',
            }}
          >
            LShorter
          </h1>

          <p
            style={{
              fontSize: 26,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.02em',
              marginBottom: 20,
            }}
          >
            Smart Links. Edge Routing. Maximum Conversions.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              fontSize: 13,
              fontWeight: 700,
              padding: '6px 18px',
              borderRadius: 999,
            }}
          >
            <span>⚡ POWERED BY CLOUDFLARE EDGE V8</span>
          </div>
        </div>
      </div>
    </CameraFrame>
  );
};
