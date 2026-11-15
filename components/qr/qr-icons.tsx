import React from "react";
import {
  BRAND_LOGOS,
  type BrandLogoId,
  type OfficialBrandLogoSpec,
} from "./qr-brand-logos";

// =============================================================================
// LShorter QR Studio — Authentic Official Brand SVG Icons (UI Previews)
// Sourced strictly from Simple Icons, SVG Logos (@iconify-json/logos) & Devicon
// =============================================================================

export function BrandLogoSvg({
  spec,
  className = "w-7 h-7 shrink-0",
}: {
  spec: OfficialBrandLogoSpec;
  className?: string;
}) {
  const hasCurrentColor = spec.body.includes('fill="currentColor"');
  return (
    <svg
      viewBox={spec.viewBox}
      className={`${className} ${
        hasCurrentColor ? "text-neutral-900 dark:text-white" : ""
      }`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: spec.body }}
    />
  );
}

export const BrandIcons: Record<BrandLogoId, React.ReactNode> = {} as Record<
  BrandLogoId,
  React.ReactNode
>;

for (const id of Object.keys(BRAND_LOGOS) as BrandLogoId[]) {
  BrandIcons[id] = <BrandLogoSvg key={id} spec={BRAND_LOGOS[id]} />;
}
