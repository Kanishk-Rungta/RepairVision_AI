<script lang="ts">
  // Light / dark switch. The choice is kept in a cookie (so the server can set
  // the theme on the very first paint, with no flash) and the page cross-fades
  // between the two. With no choice made the site follows the system.
  import { onMount } from 'svelte';
  import { Sun, Moon } from 'lucide-svelte';

  let dark = false;
  let ready = false;

  function effective(): boolean {
    const set = document.documentElement.dataset.theme;
    return set ? set === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }

  onMount(() => {
    dark = effective();
    ready = true;
    // Follow the system live while the visitor has not chosen.
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (!document.documentElement.dataset.theme) dark = mq.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  });

  function toggle() {
    dark = !dark;
    const next = dark ? 'dark' : 'light';
    const root = document.documentElement;
    const apply = () => {
      root.dataset.theme = next;
      document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition;
    if (!start || reduced) {
      apply();
      return;
    }
    // A plain cross-fade, not the page-to-page slide.
    root.classList.add('theme-vt');
    start.call(document, apply).finished.finally(() => root.classList.remove('theme-vt'));
  }
</script>

<button
  type="button"
  class="theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-[background-color,color,transform] duration-300 ease-apple hover:bg-tint/[0.06] hover:text-slate-900 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
  aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
  aria-pressed={dark}
  title={dark ? 'Light theme' : 'Dark theme'}
  on:click={toggle}
>
  <span class="relative block h-[18px] w-[18px]">
    <span class="absolute inset-0 transition-[transform,opacity] duration-500 ease-apple" style:opacity={ready && dark ? 0 : 1} style:transform={ready && dark ? 'rotate(90deg) scale(0.4)' : 'none'}><Sun size={18} /></span>
    <span class="absolute inset-0 transition-[transform,opacity] duration-500 ease-apple" style:opacity={ready && dark ? 1 : 0} style:transform={ready && dark ? 'none' : 'rotate(-90deg) scale(0.4)'}><Moon size={18} /></span>
  </span>
</button>
