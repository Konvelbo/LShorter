import React from 'react';
import { Img } from 'remotion';

interface ScreenshotWindowProps {
  src: string;
  title: string;
  width?: number;
  height?: number;
  imgScale?: number;
  imgTranslateX?: number;
  imgTranslateY?: number;
  badge?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const ScreenshotWindow: React.FC<ScreenshotWindowProps> = ({
  src,
  title,
  width = 1380,
  height = 760,
  imgScale = 1,
  imgTranslateX = 0,
  imgTranslateY = 0,
  badge,
  style,
  children,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 18,
        backgroundColor: '#0F172A',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow:
          '0 35px 80px -15px rgba(0, 0, 0, 0.85), 0 0 50px -10px rgba(56, 189, 248, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...style,
      }}
    >
      {/* macOS Title Bar */}
      <div
        style={{
          height: 48,
          padding: '0 20px',
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', backgroundColor: '#EF4444' }} />
          <div style={{ width: 13, height: 13, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
          <div style={{ width: 13, height: 13, borderRadius: '50%', backgroundColor: '#10B981' }} />
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.75)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#38BDF8' }}>✦</span>
          <span>{title}</span>
        </div>

        <div>
          {badge ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 10px',
                borderRadius: 999,
              }}
            >
              {badge}
            </span>
          ) : (
            <div style={{ width: 44 }} />
          )}
        </div>
      </div>

      {/* Screenshot Container with focal zoom/pan */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#020617',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `translate(${imgTranslateX}px, ${imgTranslateY}px) scale(${imgScale})`,
            transformOrigin: '0% 0%',
            transition: 'transform 0.1s ease-out',
          }}
        >
          <Img
            src={src}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>

        {/* Overlay children (like cursor, tooltips, highlights) */}
        {children}
      </div>
    </div>
  );
};
