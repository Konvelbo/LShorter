import React from 'react';

interface MacWindowProps {
  title?: string;
  width?: number | string;
  height?: number | string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  badge?: string;
}

export const MacWindow: React.FC<MacWindowProps> = ({
  title = 'LShorter Studio',
  width = 980,
  height,
  children,
  style,
  badge,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow:
          '0 30px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(56, 189, 248, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* macOS Title Bar */}
      <div
        style={{
          height: 44,
          padding: '0 16px',
          backgroundColor: 'rgba(2, 6, 23, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        {/* macOS Traffic Light Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
            }}
          />
        </div>

        {/* Window Title */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.65)',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#38BDF8', fontWeight: 600 }}>✦</span>
          <span>{title}</span>
        </div>

        {/* Right Badge or Status */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {badge ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
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

      {/* Content Body */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};
