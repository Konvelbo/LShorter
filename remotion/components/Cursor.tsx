import React from 'react';
import { interpolate } from 'remotion';

interface CursorProps {
  x: number;
  y: number;
  isClicking?: boolean;
  clickProgress?: number; // 0 to 1
  label?: string;
}

export const Cursor: React.FC<CursorProps> = ({
  x,
  y,
  isClicking = false,
  clickProgress = 0,
  label,
}) => {
  const scale = isClicking ? 0.88 : 1;

  // Ripple effect calculations
  const rippleScale = interpolate(clickProgress, [0, 1], [0.8, 2.6]);
  const rippleOpacity = interpolate(clickProgress, [0, 0.4, 1], [0.8, 0.5, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-3px, -2px)',
      }}
    >
      {/* Ripple ring on click */}
      {clickProgress > 0 && clickProgress < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: 2,
            width: 44,
            height: 44,
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${rippleScale})`,
            border: '2px solid rgba(56, 189, 248, 0.9)',
            backgroundColor: 'rgba(56, 189, 248, 0.25)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
            opacity: rippleOpacity,
          }}
        />
      )}

      {/* SVG Mouse Pointer */}
      <div
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.08s ease',
          filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7))',
        }}
      >
        <svg
          width="28"
          height="32"
          viewBox="0 0 28 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2L10.5 27.5L15.5 17L26 14L2 2Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Optional Label Tag */}
      {label && (
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: 18,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38BDF8',
            fontSize: 12,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
