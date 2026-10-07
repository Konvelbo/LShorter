import React from 'react';
import { interpolate } from 'remotion';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  progress: number; // 0 to 1
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  progress,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const currentValue = interpolate(clampedProgress, [0, 1], [from, to]);

  const formattedNumber =
    decimals > 0
      ? currentValue.toFixed(decimals)
      : Math.floor(currentValue).toLocaleString('fr-FR');

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
