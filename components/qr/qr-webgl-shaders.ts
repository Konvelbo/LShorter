import { Mesh, Program, Renderer, Triangle } from "ogl";
import type { AnimatedThemeConfig, ShaderArchetype } from "./qr-animated-themes";

const TAU = Math.PI * 2;

export type RgbTuple = [number, number, number];
export type NormRgbTuple = [number, number, number];

/**
 * Parses a #RGB or #RRGGBB hex string into 0..255 RGB integers.
 */
export function hexToRgbTuple(hex: string, fallback: RgbTuple = [15, 23, 42]): RgbTuple {
  if (typeof hex !== "string") return fallback;
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3 && /^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length >= 6 && /^[0-9a-fA-F]{6}/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  }
  return fallback;
}

export function hexToNormRgb(hex: string, fallback: RgbTuple = [15, 23, 42]): NormRgbTuple {
  const [r, g, b] = hexToRgbTuple(hex, fallback);
  return [r / 255, g / 255, b / 255];
}

export function mixHex(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgbTuple(hexA);
  const [r2, g2, b2] = hexToRgbTuple(hexB);
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r1 + (r2 - r1) * clamped)}${toHex(g1 + (g2 - g1) * clamped)}${toHex(b1 + (b2 - b1) * clamped)}`;
}

export interface ResolvedPalette {
  baseBg: string;
  primary: string;
  secondary: string;
  accent: string;
}

export function resolveThemePalette(
  theme: AnimatedThemeConfig,
  customTintColor?: string
): ResolvedPalette {
  if (!customTintColor) {
    return {
      baseBg: theme.baseBg,
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
    };
  }
  return {
    baseBg: mixHex(theme.baseBg, customTintColor, 0.16),
    primary: mixHex(theme.primary, customTintColor, 0.85),
    secondary: mixHex(theme.secondary, customTintColor, 0.45),
    accent: mixHex(theme.accent, customTintColor, 0.25),
  };
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgbTuple(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToNormRgb(hex, [255, 255, 255]);
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

const VERTEX_SHADER = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_PRELUDE = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uPhase;
uniform vec2 uResolution;
uniform float uVariant;
uniform float uIntensity;
uniform vec3 uBase;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

vec2 aspectUv(vec2 uv) {
  vec2 p = uv - 0.5;
  p.x *= uResolution.x / max(uResolution.y, 1.0);
  return p;
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float edgeGlowFactor(vec2 uv) {
  vec2 d = abs(uv - 0.5) * 2.0;
  float box = max(d.x, d.y);
  return smoothstep(0.42, 1.02, box);
}
`;

const SHADER_SOURCES: Record<ShaderArchetype, string> = {
  aurora: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  float c1 = cos(uPhase);
  float s1 = sin(uPhase);
  float c2 = cos(uPhase * 2.0);
  float s2 = sin(uPhase * 2.0);

  float freq = 3.2 + uVariant * 0.75;
  float ribbonA = sin(p.x * freq + c1 * 1.4 + sin(p.y * 2.8 + s1 * 1.1));
  float ribbonB = cos(p.y * (freq * 0.9) - s2 * 1.3 + cos(p.x * 2.4 + c2 * 1.2));
  float curtain = smoothstep(-0.35, 0.95, 0.52 * ribbonA + 0.48 * ribbonB);

  float sweep = 0.5 + 0.5 * sin((vUv.x - vUv.y) * 4.0 + uPhase);
  vec3 col = mix(uBase, uPrimary * 0.65, 0.25 + 0.45 * curtain);
  col = mix(col, uSecondary * 0.8, 0.35 * sweep * curtain);

  float fiber = smoothstep(0.76, 0.98, 0.5 + 0.5 * sin(p.x * 18.0 + uPhase * 2.0 + ribbonA * 3.0));
  col += uAccent * fiber * (uVariant > 1.5 ? 0.36 : 0.16) * uIntensity;

  float rim = edgeGlowFactor(vUv);
  col += mix(uPrimary, uSecondary, sweep) * rim * 0.28 * uIntensity;
  col *= 0.88 + 0.16 * (1.0 - length(p) * 0.55);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,

  liquid_metal: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  float orbitX = cos(uPhase);
  float orbitY = sin(uPhase);

  vec2 q = p * 2.4 + vec2(orbitX, orbitY) * 0.35;
  float f = sin(q.x * 2.2 + sin(q.y * 1.9 + uPhase));
  f += 0.5 * cos(q.y * 3.1 - sin(q.x * 2.6 - uPhase));
  f += 0.25 * sin((q.x + q.y) * 4.5 + uPhase * 2.0);
  float fold = 0.5 + 0.5 * sin(f * 1.65);

  float specAngle = dot(normalize(vec2(orbitX + 1.2, orbitY + 0.8)), p);
  float sheen = pow(max(0.0, 0.5 + 0.5 * cos(specAngle * 5.0 - uPhase)), 3.0);
  float bevel = smoothstep(0.62, 1.0, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0);

  vec3 col = mix(uBase, uPrimary * 0.72, fold * 0.7);
  col = mix(col, uSecondary * 0.88, smoothstep(0.35, 0.9, fold) * 0.55);
  col += uAccent * sheen * 0.38 * uIntensity;
  col += uSecondary * bevel * 0.24 * uIntensity;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,

  cyber_grid: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  float uNorm = uPhase / TAU;

  float perspective = mix(1.0, 1.35 + abs(p.y) * 1.2, step(0.5, mod(uVariant, 2.0)));
  vec2 gUv = p * (5.5 + uVariant * 0.6) * vec2(1.0, perspective);
  gUv.y += uNorm * 2.0;

  vec2 grid = abs(fract(gUv - 0.5) - 0.5) / max(vec2(0.025), 1.0 / uResolution * 14.0);
  float line = 1.0 - min(min(grid.x, grid.y), 1.0);
  line = smoothstep(0.15, 0.9, line);

  float pulse = 0.5 + 0.5 * sin(length(p) * 8.0 - uPhase * 2.0);
  float scanline = 0.92 + 0.08 * sin(vUv.y * uResolution.y * 0.45 + uPhase * 2.0);

  vec2 d = abs(vUv - 0.5) * 2.0;
  float trace = smoothstep(0.84, 0.99, max(d.x, d.y));
  float race = 0.5 + 0.5 * sin(atan(p.y, p.x) * 2.0 + uPhase * 2.0);

  vec3 col = mix(uBase, uPrimary * 0.32, 0.25 + 0.3 * (1.0 - length(p)));
  col += mix(uPrimary, uSecondary, 0.5 + 0.5 * sin(vUv.x * PI + uPhase)) * line * 0.42 * uIntensity;
  col += uSecondary * pulse * edgeGlowFactor(vUv) * 0.3 * uIntensity;
  col += uAccent * trace * race * 0.55 * uIntensity;
  col *= scanline;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,

  matrix_digital: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  float uNorm = uPhase / TAU;

  float cols = 28.0;
  float colIdx = floor(vUv.x * cols);
  float colSeed = hash21(vec2(colIdx, 7.13));
  float speed = 1.0 + floor(colSeed * 3.0);

  float stream = fract(vUv.y * 2.0 + uNorm * speed + colSeed * 4.0);
  float trail = pow(1.0 - stream, 3.2);
  float head = smoothstep(0.07, 0.0, stream);

  float cellY = floor(vUv.y * 34.0 + uNorm * speed * 17.0);
  float glyph = step(0.32, hash21(vec2(colIdx, cellY)));

  vec3 col = uBase;
  col += uSecondary * trail * glyph * 0.48 * uIntensity;
  col += uPrimary * trail * 0.32 * uIntensity;
  col += uAccent * head * glyph * 0.65 * uIntensity;

  // Radar polar sweep when variant targets sonar/radar theme
  if (uVariant > 1.5) {
    float r = length(p);
    float ang = atan(p.y, p.x);
    float sweepDiff = fract((ang + uPhase) / TAU);
    float sector = pow(max(0.0, 1.0 - sweepDiff), 4.5);
    float rings = smoothstep(0.015, 0.0, abs(fract(r * 5.0) - 0.5) - 0.47);
    col += uPrimary * sector * 0.42;
    col += uAccent * rings * 0.25;
  }

  col += uPrimary * edgeGlowFactor(vUv) * 0.2;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,

  plasma_nebula: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  vec2 drift = vec2(cos(uPhase), sin(uPhase)) * 0.28;

  vec2 nUv = p * 2.6 + drift;
  float n1 = sin(nUv.x * 2.1 + cos(nUv.y * 2.4 + uPhase));
  float n2 = cos(nUv.y * 2.9 - sin(nUv.x * 2.2 - uPhase));
  float neb = smoothstep(-0.4, 0.95, 0.55 * n1 + 0.45 * n2);

  vec3 col = mix(uBase, uPrimary * 0.58, neb * 0.68);
  col = mix(col, uSecondary * 0.68, smoothstep(0.2, 0.9, 0.5 + 0.5 * n2) * 0.58);

  // Seamless twinkling multi-star grid
  vec2 starGrid = fract(vUv * vec2(18.0, 22.0)) - 0.5;
  vec2 starCell = floor(vUv * vec2(18.0, 22.0));
  float starRand = hash21(starCell);
  if (starRand > 0.72) {
    float d = length(starGrid);
    float twinkle = 0.45 + 0.55 * sin(uPhase + starRand * TAU);
    float spark = smoothstep(0.16, 0.01, d) * twinkle;
    col += uAccent * spark * 0.9 * uIntensity;
  }

  float halo = edgeGlowFactor(vUv);
  col += mix(uPrimary, uSecondary, 0.5 + 0.5 * cos(uPhase)) * halo * 0.28;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,

  ocean_caustics: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  float c = 0.0;
  vec2 w = p * 3.8;

  // Seamless periodic trigonometric caustic web
  float w1 = sin(w.x * 2.0 + cos(w.y * 1.8 + uPhase));
  float w2 = cos(w.y * 2.3 + sin(w.x * 2.1 - uPhase));
  float w3 = sin((w.x - w.y) * 2.6 + sin(uPhase + w.x));
  float net = abs(w1 + w2 + w3) * 0.333;
  c = pow(clamp(1.0 - net, 0.0, 1.0), 3.2);

  float depthGrad = smoothstep(0.0, 1.0, 1.0 - vUv.y * 0.65);
  vec3 col = mix(uBase, uSecondary * 0.65, depthGrad * 0.55);
  col += mix(uPrimary, uAccent, c) * c * 0.62 * uIntensity;

  float mist = smoothstep(0.75, 0.98, 0.5 + 0.5 * sin(p.y * 5.0 - uPhase + cos(p.x * 3.0)));
  col += uAccent * mist * 0.14;
  col += uPrimary * edgeGlowFactor(vUv) * 0.22;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,

  festive_bokeh: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  float grad = 0.5 + 0.5 * sin(vUv.y * 3.14 + 0.5 * cos(uPhase));
  vec3 col = mix(uBase, uSecondary * 0.45, grad * 0.45);
  col = mix(col, uPrimary * 0.38, smoothstep(0.3, 1.0, length(p)) * 0.45);

  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float sA = hash21(vec2(fi, 3.1));
    float sB = hash21(vec2(fi, 9.7));

    vec2 center = vec2(sA - 0.5, sB - 0.5) * vec2(0.95, 1.15);
    center.x += 0.08 * cos(uPhase + fi * 1.1);
    center.y += 0.08 * sin(uPhase * (1.0 + floor(mod(fi, 2.0))) + fi * 0.9);

    float dist = length(p - center);
    float radius = 0.065 + 0.055 * sA;
    float orb = smoothstep(radius, radius * 0.35, dist);
    float shimmer = 0.45 + 0.55 * sin(uPhase + fi * 1.4);

    vec3 orbCol = mix(uPrimary, uAccent, mod(fi, 3.0) * 0.45);
    if (mod(fi, 3.0) > 1.5) orbCol = uSecondary;
    col += orbCol * orb * shimmer * 0.38 * uIntensity;
  }

  col += mix(uPrimary, uAccent, 0.5) * edgeGlowFactor(vUv) * 0.24;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,

  arena_energy: /* glsl */ `
${FRAGMENT_PRELUDE}
void main() {
  vec2 p = aspectUv(vUv);
  float uNorm = uPhase / TAU;

  // Rotating stadium spotlight cones
  float spotA = pow(max(0.0, 0.5 + 0.5 * cos(atan(p.y - 0.65, p.x + 0.45) * 2.0 + uPhase)), 5.0);
  float spotB = pow(max(0.0, 0.5 + 0.5 * cos(atan(p.y - 0.65, p.x - 0.45) * 2.0 - uPhase)), 5.0);

  // Diagonal velocity chevrons moving in exact integer cycles
  float diag = fract((abs(p.x) * 3.5 + p.y * 2.5) - uNorm * 2.0);
  float stripe = smoothstep(0.18, 0.0, abs(diag - 0.5));

  float ring = smoothstep(0.04, 0.0, abs(length(p) - (0.44 + 0.04 * sin(uPhase * 2.0))));

  vec3 col = mix(uBase, uPrimary * 0.36, 0.35 * (spotA + spotB));
  col += uPrimary * stripe * 0.24 * edgeGlowFactor(vUv) * uIntensity;
  col += uSecondary * (spotA + spotB) * 0.32 * uIntensity;
  col += uAccent * ring * 0.28 * uIntensity;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,
};

interface CachedShaderEngine {
  renderer: Renderer;
  geometry: Triangle;
  programs: Map<ShaderArchetype, Program>;
  meshes: Map<ShaderArchetype, Mesh>;
  width: number;
  height: number;
}

let cachedEngine: CachedShaderEngine | null = null;

function canUseWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    return Boolean(
      probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function getOrCreateEngine(width: number, height: number): CachedShaderEngine | null {
  if (cachedEngine) {
    if (cachedEngine.renderer.gl.isContextLost()) {
      cachedEngine = null;
    } else {
      if (cachedEngine.width !== width || cachedEngine.height !== height) {
        cachedEngine.renderer.setSize(width, height);
        cachedEngine.width = width;
        cachedEngine.height = height;
      }
      return cachedEngine;
    }
  }

  if (!canUseWebGL()) return null;

  try {
    const renderer = new Renderer({
      width,
      height,
      dpr: 1,
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
      webgl: 2,
    });

    const gl = renderer.gl;
    if (!gl) return null;

    const geometry = new Triangle(gl);

    cachedEngine = {
      renderer,
      geometry,
      programs: new Map(),
      meshes: new Map(),
      width,
      height,
    };
    return cachedEngine;
  } catch {
    return null;
  }
}

function getOrCreateMesh(
  engine: CachedShaderEngine,
  archetype: ShaderArchetype
): Mesh | null {
  const existingMesh = engine.meshes.get(archetype);
  if (existingMesh) return existingMesh;

  try {
    const gl = engine.renderer.gl;
    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: SHADER_SOURCES[archetype],
      uniforms: {
        uPhase: { value: 0 },
        uResolution: { value: [engine.width, engine.height] },
        uVariant: { value: 0 },
        uIntensity: { value: 1 },
        uBase: { value: [0.04, 0.06, 0.1] },
        uPrimary: { value: [0.2, 0.8, 0.9] },
        uSecondary: { value: [0.5, 0.3, 0.95] },
        uAccent: { value: [1, 1, 1] },
      },
      depthTest: false,
      depthWrite: false,
      transparent: false,
    });

    const mesh = new Mesh(gl, { geometry: engine.geometry, program });
    engine.programs.set(archetype, program);
    engine.meshes.set(archetype, mesh);
    return mesh;
  } catch {
    return null;
  }
}

function drawCanvasFallbackBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  primaryHex: string,
  secondaryHex: string,
  baseHex: string,
  accentHex: string,
  phase: number
): void {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, baseHex);
  grad.addColorStop(0.55, mixHex(baseHex, primaryHex, 0.28));
  grad.addColorStop(1, mixHex(baseHex, secondaryHex, 0.36));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const cx = width * (0.5 + 0.22 * Math.cos(phase));
  const cy = height * (0.45 + 0.18 * Math.sin(phase));
  const radial = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(width, height) * 0.72);
  radial.addColorStop(0, hexWithAlpha(accentHex, 0.28));
  radial.addColorStop(0.45, hexWithAlpha(primaryHex, 0.22));
  radial.addColorStop(1, hexWithAlpha(baseHex, 0));
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Renders an animated seamless 2.4s shader backdrop onto `ctx` using the singleton OGL renderer.
 * Falls back transparently to an animated Canvas 2D gradient if WebGL is unavailable.
 */
export function renderShaderBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: AnimatedThemeConfig,
  timeSec: number,
  customTintColor?: string
): boolean {
  const loopSec = 2.4;
  const norm = (((timeSec % loopSec) + loopSec) % loopSec) / loopSec;
  const phase = norm * TAU;

  const palette = resolveThemePalette(theme, customTintColor);

  // Match canvas backing transform (2x in preview, 1.5x in GIF export, 1x in default)
  const transformScale = typeof ctx.getTransform === "function" ? Math.max(1, ctx.getTransform().a) : 1;
  const renderW = Math.min(1280, Math.max(1, Math.round(width * transformScale)));
  const renderH = Math.min(1280, Math.max(1, Math.round(height * transformScale)));

  const engine = getOrCreateEngine(renderW, renderH);
  if (engine) {
    const mesh = getOrCreateMesh(engine, theme.shader);
    if (mesh) {
      const uniforms = mesh.program.uniforms;
      uniforms.uPhase.value = phase;
      uniforms.uResolution.value[0] = renderW;
      uniforms.uResolution.value[1] = renderH;
      uniforms.uVariant.value = theme.shaderVariant;
      uniforms.uIntensity.value = theme.shaderIntensity;
      uniforms.uBase.value = hexToNormRgb(palette.baseBg);
      uniforms.uPrimary.value = hexToNormRgb(palette.primary);
      uniforms.uSecondary.value = hexToNormRgb(palette.secondary);
      uniforms.uAccent.value = hexToNormRgb(palette.accent);

      engine.renderer.render({ scene: mesh });
      ctx.drawImage(engine.renderer.gl.canvas, 0, 0, width, height);
      return true;
    }
  }

  drawCanvasFallbackBackdrop(
    ctx,
    width,
    height,
    palette.primary,
    palette.secondary,
    palette.baseBg,
    palette.accent,
    phase
  );
  return false;
}
