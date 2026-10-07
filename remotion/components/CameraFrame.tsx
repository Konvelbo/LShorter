import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface CameraFrameProps {
  children: React.ReactNode;
  durationInFrames: number;
  zoomStart?: number;
  zoomEnd?: number;
  panXStart?: number;
  panXEnd?: number;
  panYStart?: number;
  panYEnd?: number;
  style?: React.CSSProperties;
}

export const CameraFrame: React.FC<CameraFrameProps> = ({
  children,
  durationInFrames,
  zoomStart = 1.0,
  zoomEnd = 1.06,
  panXStart = 0,
  panXEnd = 0,
  panYStart = 0,
  panYEnd = 0,
  style,
}) => {
  const frame = useCurrentFrame();

  // Smooth fadeIn on entry (first 15 frames) and fadeOut on exit (last 15 frames)
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Smooth continuous camera zoom and pan throughout the scene
  const scale = interpolate(frame, [0, durationInFrames], [zoomStart, zoomEnd], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateX = interpolate(frame, [0, durationInFrames], [panXStart, panXEnd], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, durationInFrames], [panYStart, panYEnd], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        transformOrigin: '50% 50%',
        willChange: 'transform, opacity',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
