import React from 'react';

interface CalloutBadgeProps {
  text: string;
  subtext?: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  opacity?: number;
}

export const CalloutBadge: React.FC<CalloutBadgeProps> = ({
  text,
  subtext,
  x,
  y,
  targetX,
  targetY,
  opacity = 1,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {/* Badge container */}
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: 8,
          padding: '6px 12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#38BDF8',
              boxShadow: '0 0 8px #38BDF8',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{text}</span>
        </div>
        {subtext && (
          <span
            style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 2,
              paddingLeft: 14,
            }}
          >
            {subtext}
          </span>
        )}
      </div>

      {/* SVG Connecting Line & Pin if target specified */}
      {targetX !== undefined && targetY !== undefined && (
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 800,
            height: 600,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <line
            x1={10}
            y1={16}
            x2={targetX - x}
            y2={targetY - y}
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <circle
            cx={targetX - x}
            cy={targetY - y}
            r="4"
            fill="#38BDF8"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  );
};
