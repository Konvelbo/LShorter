import React, { useId } from "react";
import {
  BRAND_LOGOS,
  type BrandGradientSpec,
  type BrandLogoId,
  type BrandLogoSpec,
  type BrandPrimitive,
} from "./qr-brand-logos";

// ─── AUTHENTIC BRAND SVG ICONS FOR UI PREVIEWS (UNIFIED VECTOR ENGINE) ──────

function getGradientCoords(grad: BrandGradientSpec) {
  if (
    grad.x1 !== undefined &&
    grad.y1 !== undefined &&
    grad.x2 !== undefined &&
    grad.y2 !== undefined
  ) {
    return { x1: grad.x1, y1: grad.y1, x2: grad.x2, y2: grad.y2 };
  }
  switch (grad.direction) {
    case "diagonal-bl-tr":
      return { x1: 0, y1: 24, x2: 24, y2: 0 };
    case "vertical":
      return { x1: 0, y1: 0, x2: 0, y2: 24 };
    case "horizontal":
      return { x1: 0, y1: 0, x2: 24, y2: 0 };
    case "diagonal-tl-br":
    default:
      return { x1: 0, y1: 0, x2: 24, y2: 24 };
  }
}

function buildSvgTransform(layer: Extract<BrandPrimitive, { kind: "path" }>): string | undefined {
  const t = layer.transform;
  if (!t) return undefined;
  const parts: string[] = [];
  if (t.translateX || t.translateY) {
    parts.push(`translate(${t.translateX ?? 0} ${t.translateY ?? 0})`);
  }
  if (t.rotateDeg) {
    parts.push(`rotate(${t.rotateDeg} ${t.pivotX ?? 12} ${t.pivotY ?? 12})`);
  }
  if (t.scale !== undefined || t.scaleX !== undefined || t.scaleY !== undefined) {
    const sx = t.scaleX ?? t.scale ?? 1;
    const sy = t.scaleY ?? t.scale ?? 1;
    parts.push(`scale(${sx} ${sy})`);
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function getFontFamilyCss(family?: "sans" | "serif" | "mono"): string {
  switch (family) {
    case "serif":
      return "Georgia, 'Times New Roman', serif";
    case "mono":
      return "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
    case "sans":
    default:
      return "Inter, system-ui, -apple-system, sans-serif";
  }
}

function BrandLogoSvg({ spec }: { spec: BrandLogoSpec }) {
  const rawUid = useId();
  const uid = rawUid.replace(/:/g, "");

  const gradients = new Map<string, BrandGradientSpec>();
  if (spec.container?.gradient) {
    gradients.set(spec.container.gradient.id, spec.container.gradient);
  }
  for (const layer of spec.layers) {
    if ("fillGradient" in layer && layer.fillGradient) {
      gradients.set(layer.fillGradient.id, layer.fillGradient);
    }
  }

  const clipCircles = new Map<number, { cx: number; cy: number; r: number }>();
  spec.layers.forEach((layer, idx) => {
    if ("clipToCircle" in layer && layer.clipToCircle) {
      clipCircles.set(idx, layer.clipToCircle);
    }
  });

  const containerFill = spec.container?.gradient
    ? `url(#${uid}-${spec.container.gradient.id})`
    : spec.container?.fill ?? "none";

  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7 shrink-0"
      fill="none"
      aria-hidden="true"
    >
      {(gradients.size > 0 || clipCircles.size > 0) && (
        <defs>
          {Array.from(gradients.values()).map((grad) => {
            const coords = getGradientCoords(grad);
            return (
              <linearGradient
                key={grad.id}
                id={`${uid}-${grad.id}`}
                gradientUnits="userSpaceOnUse"
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
              >
                <stop offset="0%" stopColor={grad.from} />
                {grad.via && <stop offset="50%" stopColor={grad.via} />}
                <stop offset="100%" stopColor={grad.to} />
              </linearGradient>
            );
          })}
          {Array.from(clipCircles.entries()).map(([idx, c]) => (
            <clipPath key={idx} id={`${uid}-clip-${idx}`}>
              <circle cx={c.cx} cy={c.cy} r={c.r} />
            </clipPath>
          ))}
        </defs>
      )}

      {spec.container &&
        (spec.container.shape === "circle" ? (
          <circle
            cx={12}
            cy={12}
            r={10.4}
            fill={containerFill}
            stroke={spec.container.stroke}
            strokeWidth={spec.container.stroke || spec.container.darkRim ? 0.65 : undefined}
            className={
              spec.container.darkRim && !spec.container.stroke
                ? "stroke-transparent dark:stroke-white/25"
                : undefined
            }
          />
        ) : (
          <rect
            x={1.6}
            y={1.6}
            width={20.8}
            height={20.8}
            rx={5.2}
            fill={containerFill}
            stroke={spec.container.stroke}
            strokeWidth={spec.container.stroke || spec.container.darkRim ? 0.65 : undefined}
            className={
              spec.container.darkRim && !spec.container.stroke
                ? "stroke-transparent dark:stroke-white/25"
                : undefined
            }
          />
        ))}

      {spec.layers.map((layer, idx) => {
        const clipAttr = clipCircles.has(idx) ? `url(#${uid}-clip-${idx})` : undefined;

        if (layer.kind === "path") {
          const fill = layer.fillGradient
            ? `url(#${uid}-${layer.fillGradient.id})`
            : layer.fill ?? "none";
          return (
            <path
              key={idx}
              d={layer.d}
              fill={fill}
              fillRule={layer.fillRule}
              stroke={layer.stroke}
              strokeWidth={layer.strokeWidth}
              strokeLinecap={layer.strokeLinecap}
              strokeLinejoin={layer.strokeLinejoin}
              opacity={layer.opacity}
              transform={buildSvgTransform(layer)}
              clipPath={clipAttr}
            />
          );
        }

        if (layer.kind === "circle") {
          const fill = layer.fillGradient
            ? `url(#${uid}-${layer.fillGradient.id})`
            : layer.fill ?? "none";
          return (
            <circle
              key={idx}
              cx={layer.cx}
              cy={layer.cy}
              r={layer.r}
              fill={fill}
              stroke={layer.stroke}
              strokeWidth={layer.strokeWidth}
              opacity={layer.opacity}
              clipPath={clipAttr}
            />
          );
        }

        if (layer.kind === "ellipse") {
          return (
            <ellipse
              key={idx}
              cx={layer.cx}
              cy={layer.cy}
              rx={layer.rx}
              ry={layer.ry}
              fill={layer.fill ?? "none"}
              stroke={layer.stroke}
              strokeWidth={layer.strokeWidth}
              opacity={layer.opacity}
              transform={
                layer.rotateDeg
                  ? `rotate(${layer.rotateDeg} ${layer.cx} ${layer.cy})`
                  : undefined
              }
              clipPath={clipAttr}
            />
          );
        }

        if (layer.kind === "rect") {
          const fill = layer.fillGradient
            ? `url(#${uid}-${layer.fillGradient.id})`
            : layer.fill ?? "none";
          return (
            <rect
              key={idx}
              x={layer.x}
              y={layer.y}
              width={layer.width}
              height={layer.height}
              rx={layer.rx}
              fill={fill}
              stroke={layer.stroke}
              strokeWidth={layer.strokeWidth}
              opacity={layer.opacity}
              transform={
                layer.rotateDeg
                  ? `rotate(${layer.rotateDeg} ${layer.pivotX ?? layer.x + layer.width / 2} ${layer.pivotY ?? layer.y + layer.height / 2})`
                  : undefined
              }
              clipPath={clipAttr}
            />
          );
        }

        if (layer.kind === "text") {
          return (
            <text
              key={idx}
              x={layer.x}
              y={layer.y}
              fill={layer.fill}
              fontSize={layer.fontSize}
              fontWeight={layer.fontWeight ?? 800}
              fontStyle={layer.fontStyle ?? "normal"}
              fontFamily={getFontFamilyCss(layer.fontFamily)}
              textAnchor="middle"
              dominantBaseline="central"
              transform={
                layer.rotateDeg
                  ? `rotate(${layer.rotateDeg} ${layer.pivotX ?? layer.x} ${layer.pivotY ?? layer.y})`
                  : undefined
              }
            >
              {layer.text}
            </text>
          );
        }

        return null;
      })}
    </svg>
  );
}

const ALL_LOGO_IDS = Object.keys(BRAND_LOGOS) as BrandLogoId[];

export const BrandIcons: Record<BrandLogoId, React.ReactNode> = ALL_LOGO_IDS.reduce(
  (acc, id) => {
    acc[id] = <BrandLogoSvg key={id} spec={BRAND_LOGOS[id]} />;
    return acc;
  },
  {} as Record<BrandLogoId, React.ReactNode>
);
