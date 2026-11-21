"use client";

import React, {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";
import "./VariableProximity.css";

const GAUSSIAN_EDGE = Math.exp(-2);
const QUANTIZATION_STEPS = 8;

const parseSettings = (settings: string) =>
  new Map(
    settings
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, value] = part.split(/\s+/);
        return [name.replace(/['"]/g, ""), parseFloat(value)] as [
          string,
          number,
        ];
      })
  );

const strengthAt = (
  distance: number,
  radius: number,
  falloff: "linear" | "exponential" | "gaussian"
) => {
  if (distance >= radius) return 0;
  const norm = 1 - distance / radius;
  switch (falloff) {
    case "exponential":
      return norm * norm;
    case "gaussian":
      return (
        (Math.exp(-2 * (distance / radius) ** 2) - GAUSSIAN_EDGE) /
        (1 - GAUSSIAN_EDGE)
      );
    case "linear":
    default:
      return norm;
  }
};

export interface VariableProximityProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  containerRef?: RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: "linear" | "exponential" | "gaussian";
  smoothing?: number;
  fromColor?: string;
  toColor?: string;
  scale?: number;
  lift?: number;
  idleWave?: boolean;
  fontSize?: number | string;
  className?: string;
  style?: CSSProperties;
}

export const VariableProximity = forwardRef<
  HTMLSpanElement,
  VariableProximityProps
>((props, ref) => {
  const {
    label = "",
    fromFontVariationSettings = "'wght' 450, 'GRAD' 0",
    toFontVariationSettings = "'wght' 450, 'GRAD' 150",
    containerRef,
    radius = 85,
    falloff = "gaussian",
    smoothing = 0.16,
    fromColor,
    toColor,
    scale = 1.06,
    lift = 0.04,
    idleWave = false,
    fontSize,
    className = "",
    onClick,
    style,
    ...restProps
  } = props;

  const rootRef = useRef<HTMLSpanElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const setRoot = useCallback(
    (node: HTMLSpanElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node;
    },
    [ref]
  );

  // Precompute the 9 discrete quantized fontVariationSettings strings so Skia's glyph cache hits 100%
  const variationBuckets = useMemo(() => {
    const fromSettings = parseSettings(fromFontVariationSettings);
    const toSettings = parseSettings(toFontVariationSettings);
    const axes = Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: toSettings.get(axis) ?? fromValue,
    }));
    const buckets: string[] = [];
    for (let i = 0; i <= QUANTIZATION_STEPS; i++) {
      const t = i / QUANTIZATION_STEPS;
      buckets.push(
        axes
          .map(
            ({ axis, fromValue, toValue }) =>
              `'${axis}' ${Math.round(fromValue + (toValue - fromValue) * t)}`
          )
          .join(", ")
      );
    }
    return buckets;
  }, [fromFontVariationSettings, toFontVariationSettings]);

  useEffect(() => {
    const targetEl = containerRef?.current || rootRef.current;
    if (!targetEl) return;

    const pointer = { x: 0, y: 0, active: false };
    const levels: number[] = [];
    const targets: number[] = [];
    const writtenBucket: number[] = [];
    const moved: string[] = [];
    const anchors: Array<{ x: number; y: number }> = [];
    let cachedRect: DOMRect | null = null;
    let anchorsValid = false;

    const growth = (Number(scale) || 1) - 1;
    const rise = Number(lift) || 0;
    const transformed = growth !== 0 || rise !== 0;

    let frame = 0;
    let lastTime = 0;
    let dirty = false;

    const measureAnchors = () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;
      cachedRect = rootEl.getBoundingClientRect();
      const letters = letterRefs.current;
      anchors.length = letters.length;
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        if (!letter) continue;
        const rect = letter.getBoundingClientRect();
        anchors[i] = {
          x: rect.left - cachedRect.left + rect.width / 2,
          y: rect.top - cachedRect.top + rect.height / 2,
        };
      }
      anchorsValid = true;
    };

    const computeTargets = () => {
      const len = letterRefs.current.length;
      if (targets.length !== len) {
        targets.length = len;
        levels.length = len;
      }
      targets.fill(0);
      if (!pointer.active || !cachedRect) return;

      const localX = pointer.x - cachedRect.left;
      const localY = pointer.y - cachedRect.top;
      const rSq = radius * radius;

      for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        if (!anchor) continue;
        const dx = localX - anchor.x;
        const dy = localY - anchor.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < rSq) {
          targets[i] = strengthAt(Math.sqrt(distSq), radius, falloff);
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;
      const delta = lastTime ? Math.min(now - lastTime, 48) : 16;
      lastTime = now;

      if (dirty) {
        if (!anchorsValid) measureAnchors();
        computeTargets();
        dirty = false;
      }

      const ease =
        smoothing > 0 ? 1 - Math.exp(-delta / (smoothing * 360)) : 1;
      let settling = false;
      const letters = letterRefs.current;

      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        if (!letter) continue;
        const target = targets[i] ?? 0;
        const current = levels[i] ?? 0;
        let next = current + (target - current) * ease;
        if (Math.abs(target - next) < 0.01) {
          next = target;
        } else {
          settling = true;
        }
        levels[i] = next;

        const bucket = Math.round(next * QUANTIZATION_STEPS);
        if (writtenBucket[i] !== bucket) {
          writtenBucket[i] = bucket;
          letter.style.fontVariationSettings = variationBuckets[bucket];
        }

        if (transformed) {
          const shift =
            next < 0.01
              ? ""
              : `translate3d(0,${(-rise * next).toFixed(3)}em,0) scale(${(1 + growth * next).toFixed(3)})`;
          if (moved[i] !== shift) {
            moved[i] = shift;
            letter.style.transform = shift;
          }
        }
      }

      if (settling) {
        frame = requestAnimationFrame(tick);
      } else {
        lastTime = 0;
      }
    };

    const schedule = () => {
      dirty = true;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onPointerEnter = (e: PointerEvent) => {
      // Refresh rect once upon entering the subtitle area (zero per-move layout reads)
      if (!anchorsValid) {
        measureAnchors();
      } else if (rootRef.current) {
        cachedRect = rootRef.current.getBoundingClientRect();
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      schedule();
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      schedule();
    };

    const onPointerLeave = () => {
      pointer.active = false;
      schedule();
    };

    const onResize = () => {
      anchorsValid = false;
      cachedRect = null;
    };

    // Scoped strictly to the subtitle container so moving the mouse elsewhere on the page costs 0 CPU
    targetEl.addEventListener("pointerenter", onPointerEnter, { passive: true });
    targetEl.addEventListener("pointermove", onPointerMove, { passive: true });
    targetEl.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      targetEl.removeEventListener("pointerenter", onPointerEnter);
      targetEl.removeEventListener("pointermove", onPointerMove);
      targetEl.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [
    variationBuckets,
    containerRef,
    radius,
    falloff,
    smoothing,
    scale,
    lift,
    idleWave,
    label,
  ]);

  const words = useMemo(() => label.split(" "), [label]);
  let letterIndex = 0;

  return (
    <span
      ref={setRoot}
      className={`${className} variable-proximity`}
      onClick={onClick}
      style={{
        display: "inline",
        ...(fontSize !== undefined
          ? {
              fontSize:
                typeof fontSize === "number" ? `${fontSize}px` : fontSize,
            }
          : {}),
        ...style,
      }}
      {...restProps}
    >
      {words.map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          <span
            data-word=""
            style={{ display: "inline-block", whiteSpace: "nowrap" }}
          >
            {word.split("").map((letter) => {
              const currentLetterIndex = letterIndex++;
              return (
                <span
                  key={currentLetterIndex}
                  ref={(el) => {
                    letterRefs.current[currentLetterIndex] = el;
                  }}
                  style={{
                    display: "inline-block",
                    fontVariationSettings: variationBuckets[0],
                    color: fromColor || undefined,
                    transformOrigin: "50% 80%",
                  }}
                  aria-hidden="true"
                >
                  {letter}
                </span>
              );
            })}
          </span>
          {wordIndex < words.length - 1 ? " " : null}
        </Fragment>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
});

VariableProximity.displayName = "VariableProximity";
export default VariableProximity;
