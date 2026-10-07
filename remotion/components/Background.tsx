import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const Background: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();

  // Subtle pulsing glow
  const glowPulse = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.15, 0.28]);
  // Moving grid
  const gridOffset = (frame * 1.5) % 80;

  return (
    <div
      style={{
        position: 'absolute',
        width: 1920,
        height: 1080,
        backgroundColor: '#030712',
        overflow: 'hidden',
        color: '#ffffff',
      }}
    >
      {/* Deep gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 20%, #0f172a 0%, #030712 70%, #020408 100%)',
        }}
      />

      {/* Top ambient glow light */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1200,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: glowPulse + 0.7,
        }}
      />

      {/* Center spotlight */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)',
          filter: 'blur(60px)',
        }}
      />

      {/* 3D Perspective Grid at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: -200,
          right: -200,
          height: 480,
          perspective: '500px',
          perspectiveOrigin: '50% 0%',
          overflow: 'hidden',
          opacity: 0.35,
          maskImage: 'linear-gradient(to top, black 20%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 95%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateX(75deg)',
            transformOrigin: '50% 0%',
            backgroundImage: `
              linear-gradient(to right, rgba(56, 189, 248, 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: `80px 80px`,
            backgroundPosition: `0px ${gridOffset}px`,
          }}
        />
      </div>

      {/* Floating subtle ambient particles */}
      {[...Array(18)].map((_, i) => {
        const x = (i * 107 + (frame * (0.2 + (i % 3) * 0.1))) % 1920;
        const y = (i * 61 + Math.sin(frame * 0.02 + i) * 30) % 980 + 50;
        const size = (i % 3) + 2;
        const opacity = interpolate(Math.sin(frame * 0.03 + i), [-1, 1], [0.15, 0.6]);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? '#38bdf8' : '#818cf8',
              opacity,
              boxShadow: `0 0 10px ${i % 2 === 0 ? '#38bdf8' : '#818cf8'}`,
            }}
          />
        );
      })}

      {/* Content Layer */}
      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};
