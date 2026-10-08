/** @type {import('tailwindcss').Config} */

// The UI is a light, Apple-style gallery: white canvas, #f5f5f7 bands, ink text
// and one blue for controls. The colour scales the markup already uses are
// driven by CSS variables (see app.css), so `slate-50` is the palest surface
// and `slate-900` the darkest text, `bg-rose-50 text-rose-700` is an error
// banner, and so on. Cafes can still override the brand and accent colours.

import plugin from 'tailwindcss/plugin';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

const STATUS = {
  amber: '#ff9f0a',
  yellow: '#ffcc00',
  orange: '#ff9500',
  emerald: '#28a745',
  green: '#28a745',
  rose: '#ff3b30',
  red: '#ff3b30',
  blue: '#0071e3',
  sky: '#32ade6',
  violet: '#af52de',
};
const STATUS_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * A status colour as a scale of channel triples. Light: 50–300 are tints over
 * white (banners and pills), 400–500 the colour itself, 600–950 darker (text
 * that sits on those tints). Dark is the mirror: tints over black, text lifted
 * toward white. Written into CSS variables by the plugin below so the same
 * `bg-rose-50 text-rose-700` works in both themes.
 */
function statusScale(base, dark) {
  const c = hex(base);
  const black = dark ? [4, 5, 6] : [255, 255, 255];
  const text = dark ? [255, 255, 255] : [0, 0, 0];
  const t = dark ? [0.1, 0.16, 0.3, 0.55, 0.8, 1, 0.12, 0.28, 0.45, 0.62, 0.78] : [0.07, 0.13, 0.26, 0.5, 0.8, 1, 0.18, 0.36, 0.52, 0.66, 0.8];
  return STATUS_STEPS.map((step, i) =>
    [step, (i < 5 ? mix(black, c, t[i]) : i === 5 ? c : mix(c, text, t[i])).map(Math.round).join(' ')],
  );
}

const statusColor = (name) =>
  Object.fromEntries(STATUS_STEPS.map((s) => [s, `rgb(var(--st-${name}-${s}) / <alpha-value>)`]));

function statusVars(dark) {
  const out = {};
  for (const [name, base] of Object.entries(STATUS)) {
    for (const [step, v] of statusScale(base, dark)) out[`--st-${name}-${step}`] = v;
  }
  return out;
}

const chan = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix, steps) => Object.fromEntries(steps.map((s) => [s, chan(`${prefix}-${s}`)]));
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Per-cafe colours (src/lib/brand.ts). Defaults are Apple's blue.
        brand: scale('brand', STEPS),
        accent: scale('accent', STEPS),

        // Neutrals, driven by variables (see app.css).
        slate: { ...scale('s', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]), 950: chan('s-950') },

        canvas: chan('canvas'), // page background
        'on-accent': chan('on-accent'), // text on a solid accent fill
        surface: chan('surface'), // cards, inputs, panels (what bg-white used to be)
        raised: chan('raised'), // one step off a card: menus, hovered rows
        paper: chan('canvas'),
        ink: chan('fg'),
        pine: chan('fg-strong'), // headings
        clay: chan('accent-600'), // small accent text: eyebrows, meta icons
        sun: chan('accent-500'),
        sage: chan('brand-100'),

        // Status colours.
        ...Object.fromEntries(Object.keys(STATUS).map((n) => [n, statusColor(n)])),
        // Black in light, white in dark: for hairlines and hover tints.
        tint: chan('tint'),
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        // Apple: cards and media 28px, controls are pills, small chips 10px.
        lg: '10px',
        xl: '14px',
        '2xl': '28px',
        '3xl': '32px',
      },
      boxShadow: {
        // Nothing floats: separation comes from 1px hairlines, never blur.
        sm: '0 0 0 1px rgb(0 0 0 / 0.05)',
        DEFAULT: '0 0 0 1px rgb(0 0 0 / 0.06)',
        md: '0 0 0 1px rgb(0 0 0 / 0.07)',
        lg: '0 0 0 1px rgb(0 0 0 / 0.08)',
        xl: '0 0 0 1px rgb(0 0 0 / 0.1)',
        '2xl': '0 0 0 1px rgb(0 0 0 / 0.1)',
        glow: '0 0 0 4px rgb(var(--accent-500) / 0.25)',
      },
      transitionTimingFunction: {
        // Apple-style ease: quick start, long soft landing.
        apple: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'none', filter: 'blur(0)' },
        },
      },
      animation: { 'fade-up': 'fade-up .9s cubic-bezier(.22,1,.36,1) both' },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': statusVars(false),
        ":root[data-theme='dark']": statusVars(true),
      });
      addBase({
        '@media (prefers-color-scheme: dark)': {
          ":root:not([data-theme='light'])": statusVars(true),
        },
      });
    }),
  ],
};
