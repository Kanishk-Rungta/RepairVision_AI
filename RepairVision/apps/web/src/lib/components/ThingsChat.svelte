<script lang="ts">
  // The chat character in the corner of the public pages: Things by
  // Rothenhall (MIT), served from /things/ (see static/things/README.md).
  //
  // Questions go to POST /api/chat on this hub, which answers with Gemma from
  // the site's live public data (apps/cloudflare/src/routes/chat.ts). When an
  // answer names a page of the site ("where are the events?"), we open it, so
  // the visitor lands on it with the answer still showing in the chat panel.
  // AI-referral tracking is off.
  //
  // The widget lives in its own shadow root, so the page's styles cannot reach
  // it. It is started on mount and removed on destroy, so it appears and
  // disappears as people move between the public site and the staff area.
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cafe } from '$lib/stores/cafe';

  interface ThingsChatApi {
    init(options: Record<string, unknown>): unknown;
    destroy(): void;
  }
  type WithThings = Window & { ThingsChat?: ThingsChatApi };

  const SRC = '/things/things-chat.js';
  let destroyed = false;

  function options() {
    const name = $cafe?.name?.trim() || 'us';
    return {
      endpoint: window.location.origin,
      assets: '/things',
      preset: 'pebble',
      title: `Ask ${name}`,
      greeting: `Hi! Ask me about ${name}.`,
      suggestions: ['What events are on right now?', 'Where are the events?', 'What can you repair?'],
      // Buttons and the visitor's messages follow the cafe's accent colour.
      color: 'rgb(var(--accent-500))',
      position: 'right',
      track: false,
    };
  }

  function start() {
    if (destroyed) return;
    (window as WithThings).ThingsChat?.init(options());
    removeCredit();
  }

  // The panel ends with a "Powered by Things by Rothenhall" line. We take it
  // out of the interface; the MIT notice that the licence asks us to keep
  // stays with the files in static/things. The widget builds its panel
  // synchronously in init(), so it is there to remove straight away. The input
  // gets a little more room at the bottom to make up for the missing line.
  function removeCredit() {
    const root = document.querySelector('[data-things-chat]')?.shadowRoot;
    if (!root) return;
    root.querySelector('.foot')?.remove();
    const style = document.createElement('style');
    style.textContent = 'form{margin-bottom:12px}';
    root.appendChild(style);
  }

  // A short pause first, so the visitor sees the answer before the page moves.
  const NAVIGATE_AFTER_MS = 900;
  let navigateTimer: ReturnType<typeof setTimeout> | undefined;

  function onAnswer(event: Event) {
    const path = (event as CustomEvent<{ navigate?: unknown }>).detail?.navigate;
    // The server only ever sends one of the site's own paths, but check again:
    // never follow a link off the site.
    if (typeof path !== 'string' || !/^\/(?!\/)[\w\-/]*$/.test(path)) return;
    if (path === window.location.pathname) return;
    clearTimeout(navigateTimer);
    navigateTimer = setTimeout(() => goto(path), NAVIGATE_AFTER_MS);
  }

  onMount(() => {
    window.addEventListener('things:answer', onAnswer);
    if ((window as WithThings).ThingsChat) {
      start();
      return;
    }
    // data-manual: the script must not start itself from its own attributes;
    // we start it with the options above once it has loaded.
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SRC;
      script.async = true;
      script.setAttribute('data-manual', '');
      document.head.appendChild(script);
    }
    script.addEventListener('load', start, { once: true });
  });

  onDestroy(() => {
    destroyed = true;
    clearTimeout(navigateTimer);
    if (typeof window !== 'undefined') window.removeEventListener('things:answer', onAnswer);
    if (typeof window !== 'undefined') (window as WithThings).ThingsChat?.destroy();
  });
</script>
