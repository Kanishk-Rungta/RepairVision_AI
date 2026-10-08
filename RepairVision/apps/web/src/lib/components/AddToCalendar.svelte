<script lang="ts">
  import { CalendarPlus } from 'lucide-svelte';
  import { downloadICS, type CalEvent } from '$lib/calendar';

  export let event: CalEvent;
  // link    — inline text action (sits next to e.g. "Get directions")
  // button  — full secondary button (e.g. the home "Next event" spotlight)
  // compact — icon-only, for overlaying on small date tiles
  export let variant: 'link' | 'button' | 'compact' = 'link';
  // Optional extra classes (e.g. "flex-1" to fill a button row).
  let className = '';
  export { className as class };

  $: label = `Add ${event.name} to your calendar`;

  function add() {
    downloadICS(event);
  }
</script>

{#if variant === 'compact'}
  <button
    type="button"
    on:click|stopPropagation={add}
    aria-label={label}
    title="Add to calendar"
    class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-tint/[0.04] text-slate-600 ring-1 ring-tint/[0.08] transition hover:bg-tint/[0.06] hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 {className}"
  >
    <CalendarPlus size={15} />
  </button>
{:else if variant === 'button'}
  <button type="button" on:click={add} aria-label={label} class="btn-secondary {className}">
    <CalendarPlus size={16} /> Add to calendar
  </button>
{:else}
  <button
    type="button"
    on:click={add}
    aria-label={label}
    class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-700 focus:outline-none focus-visible:underline {className}"
  >
    <CalendarPlus size={16} class="shrink-0" /> Add to calendar
  </button>
{/if}
