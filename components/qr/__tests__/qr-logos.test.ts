import { BRAND_LOGOS, type BrandLogoId } from "../qr-brand-logos";
import { BrandIcons } from "../qr-icons";
import { drawCenterLogo } from "../qr-render-engine";

function createLogoTestMock2dContext(): CanvasRenderingContext2D {
  const noop = () => undefined;
  const gradientStub = { addColorStop: noop };
  const ctx: Record<string, unknown> = {
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    globalAlpha: 1,
    font: "12px Inter",
    textAlign: "left",
    textBaseline: "alphabetic",
    shadowColor: "transparent",
    shadowBlur: 0,
    save: noop,
    restore: noop,
    scale: noop,
    translate: noop,
    rotate: noop,
    clip: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    bezierCurveTo: noop,
    arc: noop,
    roundRect: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    fillText: noop,
    drawImage: noop,
    createLinearGradient: () => gradientStub,
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

describe("QR Unified Brand Logos System", () => {
  const brandIds = Object.keys(BRAND_LOGOS) as BrandLogoId[];

  test("registers all 114 brand/icon logos symmetrically across vector specs and UI icons", () => {
    expect(brandIds).toHaveLength(114);
    expect(Object.keys(BrandIcons).sort()).toEqual([...brandIds].sort());

    for (const id of brandIds) {
      const spec = BRAND_LOGOS[id];
      expect(spec.layers.length).toBeGreaterThan(0);
      expect(BrandIcons[id]).toBeTruthy();
    }
  });

  test("renders every brand logo via drawCenterLogo cleanly without throwing in Node/Canvas mocks", () => {
    const ctx = createLogoTestMock2dContext();
    for (const id of brandIds) {
      expect(() =>
        drawCenterLogo(ctx, 100, 100, 64, id, null, "LS", "#000000", "#ffffff")
      ).not.toThrow();
      expect(() =>
        drawCenterLogo(ctx, 100, 100, 64, id, null, "LS", "#ffffff", "#09090b")
      ).not.toThrow();
    }

    expect(() =>
      drawCenterLogo(ctx, 100, 100, 64, "none", null, "LS", "#000000", "#ffffff")
    ).not.toThrow();
    expect(() =>
      drawCenterLogo(ctx, 100, 100, 64, "text", null, "SCAN", "#000000", "#ffffff")
    ).not.toThrow();
    expect(() =>
      drawCenterLogo(ctx, 100, 100, 64, "custom", null, "LS", "#000000", "#ffffff")
    ).not.toThrow();
    expect(() =>
      drawCenterLogo(
        ctx,
        100,
        100,
        64,
        "custom",
        "data:image/png;base64,iVBORw0KGgo=",
        "LS",
        "#000000",
        "#ffffff"
      )
    ).not.toThrow();
  });
});
