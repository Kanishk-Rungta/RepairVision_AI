/** @type {import('tailwindcss').Config} */

// The UI is a dark, Raycast / Linear / Vercel style interface (see DESIGN.md at
// the repo root). Rather than rewrite thousands of utility classes, the colour
// scales that the markup already uses are INVERTED here: `slate-50` is now the
// darkest surface and `slate-900` the brightest text, `emerald-50` is a faint
// green tint on black and `emerald-900` a pale green for text. So
// `bg-slate-50`, `text-slate-500`, `ring-slate-200`, `bg-rose-50 text-rose-700`
// and the rest all keep their meaning ("quiet surface", "secondary text",
// "hairline", "error banner") on the dark canvas.

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/**
 * A status colour as an inverted scale: 50–300 are tints over the black canvas
 * (for banners and pills), 400–500 are the colour itself, 600–900 get lighter
 * (for text that sits on those tints).
 */
function status(base) {
  const c = hex(base);
  const black = [4, 5, 6];
  const white = [255, 255, 255];
  return {
    50: toHex(mix(black, c, 0.1)),
    100: toHex(mix(black, c, 0.16)),
    200: toHex(mix(black, c, 0.3)),
    300: toHex(mix(black, c, 0.55)),
    400: toHex(mix(black, c, 0.8)),
    500: base,
    600: toHex(mix(c, white, 0.12)),
    700: toHex(mix(c, white, 0.28)),
    800: toHex(mix(c, white, 0.45)),
    900: toHex(mix(c, white, 0.62)),
    950: toHex(mix(c, white, 0.78)),
  };
}

const chan = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix, steps) => Object.fromEntries(steps.map((s) => [s, chan(`${prefix}-${s}`)]));
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Per-cafe colours (src/lib/brand.ts). Defaults are Raycast's coral.
        brand: scale('brand', STEPS),
        accent: scale('accent', STEPS),

        // Neutrals, inverted and driven by variables so print can flip them
        // back to paper and ink (see app.css).
        slate: { ...scale('s', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]), 950: chan('s-950') },

        canvas: chan('canvas'), // page background
        'on-accent': chan('on-accent'), // text on a solid accent fill
        surface: chan('surface'), // cards, inputs, panels (what bg-white used to be)
        raised: chan('raised'), // one step above a card: menus, hovered rows
        paper: chan('canvas'),
        ink: chan('fg'),
        pine: chan('fg-strong'), // headings
        clay: chan('accent-400'), // small accent text: eyebrows, meta icons
        sun: chan('accent-500'),
        sage: chan('brand-100'),

        // Status colours.
        amber: status('#ffbc33'),
        yellow: status('#ffd25e'),
        orange: status('#ff9a52'),
        emerald: status('#59d499'),
        green: status('#59d499'),
        rose: status('#ff6363'),
        red: status('#ff5a5f'),
        blue: status('#56c2ff'),
        sky: status('#63a1ff'),
        violet: status('#a78bfa'),
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        // DESIGN.md: buttons and inputs 8px, cards 16px, large cards 20px.
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        // Pressed, tactile surfaces: a hairline ring plus a top inner highlight.
        sm: '0 1px 0 0 rgb(255 255 255 / 0.05) inset, 0 1px 2px 0 rgb(0 0 0 / 0.4)',
        DEFAULT: '0 1px 0 0 rgb(255 255 255 / 0.06) inset, 0 2px 6px 0 rgb(0 0 0 / 0.45)',
        md: '0 1px 0 0 rgb(255 255 255 / 0.06) inset, 0 6px 16px -4px rgb(0 0 0 / 0.6)',
        lg: '0 1px 0 0 rgb(255 255 255 / 0.07) inset, 0 12px 32px -8px rgb(0 0 0 / 0.7)',
        xl: '0 1px 0 0 rgb(255 255 255 / 0.08) inset, 0 4px 40px 8px rgb(0 0 0 / 0.4), 0 24px 48px -12px rgb(0 0 0 / 0.8)',
        '2xl': '0 1px 0 0 rgb(255 255 255 / 0.08) inset, 0 4px 40px 8px rgb(0 0 0 / 0.4), 0 32px 64px -16px rgb(0 0 0 / 0.85)',
        glow: '0 0 0 1px rgb(255 99 99 / 0.35), 0 0 32px -4px rgb(255 99 99 / 0.35)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .35s cubic-bezier(.2,.7,.2,1) both' },
    },
  },
  plugins: [],
};
