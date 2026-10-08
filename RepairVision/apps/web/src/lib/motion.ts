// Motion for the whole site, in one place.
//
//  • initReveal()   fades content in as it scrolls into view, staggered.
//  • tilt           an action that leans a card toward the pointer.
//  • countUp        an action that counts a figure up the first time it shows.
//  • viewTransition wraps SvelteKit navigation in the View Transitions API.
//
//  • smoothScroll   eased, inertial page scrolling (Lenis) on the public pages.
//
// Everything is progressive. Content is only hidden once this script has run
// and only if it is below the fold, so a slow script or a crawler never sees
// an empty page, and every effect stands down for `prefers-reduced-motion`.

const reduced = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// What fades in. Direct children of a section are the natural "beats" of a
// page; cards are picked out wherever they sit.
const REVEAL = [
  'main .section > *',
  'main .card',
  'main .card-link',
  'main [data-reveal]',
].join(',');

let observer: IntersectionObserver | null = null;

/** Scan the page and arm a reveal on everything that is still below the fold. */
export function initReveal(): void {
  if (typeof document === 'undefined' || reduced()) return;
  observer?.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      const arriving = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      arriving.forEach((entry, i) => {
        const el = entry.target as HTMLElement;
        observer?.unobserve(el);
        el.dataset.rv = 'done';
        el.style.setProperty('--rv-delay', `${Math.min(i, 6) * 80}ms`);
        el.classList.add('rv-in');
        // After the animation, drop the delay and let hover transforms work.
        window.setTimeout(() => {
          el.classList.remove('rv', 'rv-in');
          el.style.removeProperty('--rv-delay');
        }, 1300 + Math.min(i, 6) * 80);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  const fold = window.innerHeight * 0.92;
  const seen = new Set<Element>();
  document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
    if (seen.has(el) || el.dataset.rv === 'done') return;
    // Don't nest reveals: if an ancestor is already being revealed, skip.
    if (el.parentElement?.closest('.rv')) return;
    // Armed by an earlier scan: just watch it again.
    if (el.classList.contains('rv')) {
      seen.add(el);
      observer!.observe(el);
      return;
    }
    // The hero has its own entrance, and print/screens-only chrome stays put.
    if (el.closest('.hero-bg') || el.closest('.no-print') || el.closest('[data-no-reveal]')) return;
    if (el.getBoundingClientRect().top < fold) return;
    seen.add(el);
    el.classList.add('rv');
    observer!.observe(el);
  });
}

/** Mark the page as scrolled, so the header can draw its hairline. */
export function watchScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  const root = document.documentElement;
  const update = () => {
    if (window.scrollY > 8) root.setAttribute('data-scrolled', '');
    else root.removeAttribute('data-scrolled');
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  return () => window.removeEventListener('scroll', update);
}

/** Cross-fade between pages. Pass to SvelteKit's `onNavigate`. */
export function viewTransition(navigation: { complete: Promise<void> }): Promise<void> | void {
  const start = (document as Document & { startViewTransition?: (cb: () => Promise<void>) => unknown }).startViewTransition;
  if (!start || reduced()) return;
  return new Promise((resolve) => {
    start.call(document, async () => {
      resolve();
      await navigation.complete;
    });
  });
}

/** Lean a card toward the pointer, a few degrees at most. `use:tilt` or `use:tilt={4}`. */
export function tilt(node: HTMLElement, max = 5) {
  if (reduced() || !matchMedia('(hover: hover)').matches) return {};
  node.setAttribute('data-tilt', '');
  const move = (e: PointerEvent) => {
    const r = node.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    node.classList.add('tilting');
    node.style.setProperty('--ry', `${(x * max * 2).toFixed(2)}deg`);
    node.style.setProperty('--rx', `${(-y * max * 2).toFixed(2)}deg`);
  };
  const leave = () => {
    node.classList.remove('tilting');
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
  };
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', leave);
  return {
    destroy() {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    },
  };
}

/**
 * Count the leading number in the element's text up from zero when it first
 * scrolls into view. It only touches a lone text node, and edits that node in
 * place, so Svelte keeps updating the same text afterwards. If the value
 * changes while counting, the count stops and the new value simply shows.
 */
export function countUp(node: HTMLElement, _watch?: unknown) {
  if (reduced()) return {};
  const text = node.firstChild;
  if (node.childNodes.length !== 1 || !text || text.nodeType !== Node.TEXT_NODE) return {};
  const tn = text as Text;
  const original = tn.data.trim();
  const m = /^(\D*)([\d,]+(?:\.\d+)?)(.*)$/.exec(original);
  if (!m) return {};
  const [, pre, num, post] = m;
  const target = parseFloat(num!.replace(/,/g, ''));
  if (!isFinite(target) || target === 0) return {};
  const decimals = num!.includes('.') ? num!.split('.')[1]!.length : 0;
  const fmt = (v: number) => v.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  let raf = 0;
  let cancelled = false;
  tn.data = `${pre}${fmt(0)}${post}`;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        tn.data = `${pre}${fmt(target * eased)}${post}`;
        if (p < 1) raf = requestAnimationFrame(tick);
        else tn.data = original;
      };
      raf = requestAnimationFrame(tick);
    },
    { threshold: 0.6 },
  );
  io.observe(node);
  return {
    update() {
      // The figure changed under us (a live page): drop the animation.
      cancelled = true;
      cancelAnimationFrame(raf);
    },
    destroy() {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
    },
  };
}

// ── Smooth scrolling ────────────────────────────────────────────────────────
// Lenis wraps the browser's own scroll, so sticky headers, in-page links and
// screen readers keep working, and the scroll-driven CSS (progress line, hero
// drift) still follows the real scroll position. It switches itself off for
// people who ask for reduced motion.

type LenisInstance = import('lenis').default;
let lenis: LenisInstance | null = null;
let starting = false;

// Places that scroll on their own or take over the wheel: maps, dialogs, the
// phone menu, the photo lightbox (all `.fixed` overlays) and form fields.
const OWN_SCROLL = '.leaflet-container, [data-lenis-prevent], [role="dialog"], [role="listbox"], [role="menu"], .fixed, textarea, select';

/** Turn smooth scrolling on or off. Safe to call on every navigation. */
export async function smoothScroll(enabled: boolean): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!enabled) {
    lenis?.destroy();
    lenis = null;
    return;
  }
  if (lenis || starting || reduced()) return;
  starting = true;
  try {
    const { default: Lenis } = await import('lenis');
    // The page may have moved on to somewhere that does not want it.
    lenis = new Lenis({
      autoRaf: true,
      // Anchor links glide there too, stopping below the sticky header.
      anchors: { offset: -80 },
      stopInertiaOnNavigate: true,
      prevent: (node: HTMLElement) => !!node.closest?.(OWN_SCROLL),
    });
  } finally {
    starting = false;
  }
}

/** After moving to a new page: start at the top, unless the link pointed at a section. */
export function resetScroll(hash: string): void {
  if (hash || !lenis) return;
  lenis.scrollTo(0, { immediate: true, force: true });
}
