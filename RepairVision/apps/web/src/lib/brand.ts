// Per-cafe brand theming.
//
// The Tailwind `brand` palette reads its channels from CSS custom properties
// (`--brand-50` … `--brand-900`) declared in app.css. Those defaults are the
// Circularity teal scale. When a cafe sets a custom `primaryColor`, we derive a
// full tint/shade scale from that single hex and override the variables at
// runtime so the whole UI re-themes — while every cafe that leaves it untouched
// inherits the Circularity brand.
//
// Two colours + two fonts are themeable per cafe:
//   • primaryColor → `--brand-*`   (links, headings, focus, text accents)
//   • accentColor  → `--accent-*`  (call-to-action buttons; falls back to the
//                                   brand colour when unset)
//   • headingFont  → `--font-display`   • bodyFont → `--font-sans`

import { FONT_STACKS, type FontChoice } from '@circularity/shared';

type RGB = [number, number, number];

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

// The interface has a light and a dark theme, so every cafe colour becomes two
// scales, written to `--brand-l-*` (light) and `--brand-d-*` (dark). app.css
// picks whichever matches the active theme.
//
// Light: 50–300 are the base mixed into white (soft tinted surfaces and
// rings), 400 a slight lift, 500 the chosen colour, 600 a touch deeper (hover
// on solid fills, small accent text) and 700–900 deep shades for text.
// Dark: 50–300 are the base mixed into black, 400 lifts for hover and small
// text, 600 is a touch deeper and 700–900 are pale tints for text.
const TINTS: ReadonlyArray<readonly [number, number]> = [
  [50, 0.06],
  [100, 0.11],
  [200, 0.2],
  [300, 0.38],
];
const DARKS: ReadonlyArray<readonly [number, number]> = [
  [700, 0.3],
  [800, 0.5],
  [900, 0.68],
];
const DARK_TINTS: ReadonlyArray<readonly [number, number]> = [
  [50, 0.08],
  [100, 0.14],
  [200, 0.26],
  [300, 0.45],
];
const LIGHTS: ReadonlyArray<readonly [number, number]> = [
  [700, 0.38],
  [800, 0.6],
  [900, 0.8],
];
const DARK_CANVAS: RGB = [4, 5, 6];

function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Text colour (as space-separated channels) that reads on a solid fill of `hex`. */
export function onColor(hex: string): string | null {
  const base = parseHex(hex);
  if (!base) return null;
  return luminance(base) > 0.5 ? '29 29 31' : '255 255 255';
}

function parseHex(hex: string): RGB | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Build a 50–900 scale from a single base hex, or null if the hex is invalid. */
export function brandScale(hex: string, dark = false): Record<number, RGB> | null {
  const base = parseHex(hex);
  if (!base) return null;
  const scale: Record<number, RGB> = { 500: base };
  if (dark) {
    for (const [step, t] of DARK_TINTS) scale[step] = mix(DARK_CANVAS, base, t);
    // A dark brand colour would vanish as text on black, so lift it further.
    scale[400] = mix(base, WHITE, luminance(base) < 0.25 ? 0.45 : 0.15);
    scale[600] = mix(base, BLACK, 0.12);
    for (const [step, t] of LIGHTS) scale[step] = mix(base, WHITE, t);
    return scale;
  }
  for (const [step, t] of TINTS) scale[step] = mix(WHITE, base, t);
  scale[400] = mix(base, WHITE, 0.18);
  scale[600] = mix(base, BLACK, 0.14);
  for (const [step, t] of DARKS) scale[step] = mix(base, BLACK, t);
  return scale;
}

/** The CSS custom properties that carry a scale, for both themes. */
function scaleDecls(prefix: 'brand' | 'accent', hex: string): string[] {
  const light = brandScale(hex);
  const dark = brandScale(hex, true);
  if (!light || !dark) return [];
  const out: string[] = [];
  for (const s of STEPS) {
    out.push(`--${prefix}-l-${s}:${light[s].join(' ')}`);
    out.push(`--${prefix}-d-${s}:${dark[s].join(' ')}`);
  }
  return out;
}

/**
 * Apply a cafe's primary colour to the document, or clear the override so the
 * app.css Circularity-teal defaults take over when no/invalid colour is given.
 */
export function applyBrandColor(hex: string | null | undefined): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const decls = hex ? scaleDecls('brand', hex) : [];
  if (decls.length === 0) {
    for (const step of STEPS) {
      root.style.removeProperty(`--brand-l-${step}`);
      root.style.removeProperty(`--brand-d-${step}`);
    }
    return;
  }
  for (const d of decls) {
    const [name, value] = d.split(':') as [string, string];
    root.style.setProperty(name, value);
  }
}

/**
 * Apply the accent (call-to-action) colour to `--accent-*`. When no accent is
 * set the buttons follow the brand colour, so we fall back to the primary hex;
 * if neither is valid we clear the override and app.css defaults apply.
 */
export function applyAccentColor(
  hex: string | null | undefined,
  fallback?: string | null,
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const source = hex && brandScale(hex) ? hex : fallback && brandScale(fallback) ? fallback : null;
  if (!source) {
    for (const step of STEPS) {
      root.style.removeProperty(`--accent-l-${step}`);
      root.style.removeProperty(`--accent-d-${step}`);
    }
    root.style.removeProperty('--on-accent-l');
    root.style.removeProperty('--on-accent-d');
    return;
  }
  for (const d of scaleDecls('accent', source)) {
    const [name, value] = d.split(':') as [string, string];
    root.style.setProperty(name, value);
  }
  const on = onColor(source);
  if (on) {
    root.style.setProperty('--on-accent-l', on);
    root.style.setProperty('--on-accent-d', on);
  }
}

function fontStack(choice: string | null | undefined): string | null {
  return choice && choice in FONT_STACKS ? FONT_STACKS[choice as FontChoice] : null;
}

/** Point the display/body font CSS variables at the chosen typefaces. */
export function applyFonts(
  headingFont: string | null | undefined,
  bodyFont: string | null | undefined,
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const display = fontStack(headingFont);
  const body = fontStack(bodyFont);
  if (display) root.style.setProperty('--font-display', display);
  else root.style.removeProperty('--font-display');
  if (body) root.style.setProperty('--font-sans', body);
  else root.style.removeProperty('--font-sans');
}

export interface BrandingSource {
  primaryColor?: string | null;
  accentColor?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
}

/** Apply every per-cafe branding override (colours + fonts) at once. */
/**
 * Colours older versions of the setup wizard saved for every cafe whether the
 * admin chose them or not (Circularity teal and orange). They mean "not
 * customised", so they fall through to the default coral theme.
 */
const LEGACY_DEFAULTS = new Set(['#1b6b5a', '#ed6a42']);

function chosen(hex: string | null | undefined): string | null {
  const v = (hex ?? '').trim();
  return v && !LEGACY_DEFAULTS.has(v.toLowerCase()) ? v : null;
}

export function applyBranding(cafe: BrandingSource | null | undefined): void {
  applyBrandColor(chosen(cafe?.primaryColor));
  applyAccentColor(chosen(cafe?.accentColor), chosen(cafe?.primaryColor));
  applyFonts(cafe?.headingFont ?? null, cafe?.bodyFont ?? null);
}

/**
 * Build a `:root { … }` CSS string of only the per-cafe overrides, for
 * inlining during SSR so the first paint is already themed (no flash of the
 * default Circularity palette before hydration). Returns '' when nothing is
 * customised.
 */
export function brandingCss(source: BrandingSource | null | undefined): string {
  const cafe = source
    ? { ...source, primaryColor: chosen(source.primaryColor), accentColor: chosen(source.accentColor) }
    : source;
  const decls: string[] = [];
  if (cafe?.primaryColor) decls.push(...scaleDecls('brand', cafe.primaryColor));
  const accentSource =
    cafe?.accentColor && brandScale(cafe.accentColor) ? cafe.accentColor : cafe?.primaryColor;
  if (accentSource) {
    const accent = scaleDecls('accent', accentSource);
    if (accent.length) {
      decls.push(...accent);
      const on = onColor(accentSource);
      if (on) decls.push(`--on-accent-l:${on}`, `--on-accent-d:${on}`);
    }
  }
  const display = fontStack(cafe?.headingFont);
  if (display) decls.push(`--font-display:${display}`);
  const body = fontStack(cafe?.bodyFont);
  if (body) decls.push(`--font-sans:${body}`);
  // NB: `:root:root:root` (not a single `:root`). Tailwind v3 compiles the
  // app.css `@layer base { :root { … } }` defaults down to a PLAIN, unlayered
  // `:root{}` rule, and the app stylesheet <link> is emitted AFTER this inline
  // <style> in the head — so a single `:root` here would tie on specificity and
  // LOSE to the later stylesheet, showing the default teal/Fraunces for one
  // paint before hydration swapped it (the flash). Repeating the selector lifts
  // specificity above the stylesheet so the cafe's colours/fonts win from the
  // very first paint. Runtime element styles set by applyBranding still override
  // this (inline element styles beat any selector), so live re-theming works.
  return decls.length ? `:root:root:root{${decls.join(';')}}` : '';
}
