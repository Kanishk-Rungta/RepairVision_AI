<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Clock } from 'lucide-svelte';

  export let value: string = '10:00';
  export let placeholder: string = 'Select time';
  export let id: string = '';
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{ change: string }>();

  let open = false;
  let container: HTMLDivElement;

  $: currentHour = value ? value.split(':')[0] || '10' : '10';
  $: currentMinute = value ? value.split(':')[1] || '00' : '00';

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = ['00', '15', '30', '45'];

  function formatTimeDisplay(val: string): string {
    if (!val || !val.includes(':')) return '';
    const [hStr, mStr] = val.split(':');
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${mStr} ${ampm}`;
  }

  function setHour(h: string) {
    value = `${h}:${currentMinute}`;
    dispatch('change', value);
  }

  function setMinute(m: string) {
    value = `${currentHour}:${m}`;
    dispatch('change', value);
  }

  function handleClickOutside(event: MouseEvent) {
    if (open && container && !container.contains(event.target as Node)) {
      open = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      open = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="relative w-full" bind:this={container}>
  <button
    {id}
    type="button"
    {disabled}
    class="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-surface text-ink transition-colors text-left hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
    class:border-accent-500={open}
    on:click={() => { if (!disabled) open = !open; }}
    aria-haspopup="dialog"
    aria-expanded={open}
  >
    <div class="flex items-center gap-2.5 truncate">
      <Clock size={16} class="text-slate-400 shrink-0" />
      {#if value}
        <span class="font-medium text-pine">{formatTimeDisplay(value)}</span>
        <span class="text-xs text-slate-500 font-mono">({value})</span>
      {:else}
        <span class="text-slate-500">{placeholder}</span>
      {/if}
    </div>
  </button>

  {#if open}
    <div
      class="absolute z-50 mt-1.5 w-64 p-3 rounded-xl border border-slate-300 bg-surface shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95"
      role="dialog"
      aria-label="Time Picker"
    >
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
        <span class="text-xs font-semibold text-pine">Select Time</span>
        <span class="text-xs font-mono font-medium text-accent-400">{formatTimeDisplay(value)}</span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-center">
        <!-- Hours column -->
        <div>
          <div class="text-[11px] font-medium text-slate-500 mb-1">Hour</div>
          <div class="h-44 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {#each HOURS as h}
              {@const hNum = parseInt(h, 10)}
              {@const ampm = hNum >= 12 ? 'PM' : 'AM'}
              {@const h12 = hNum % 12 === 0 ? 12 : hNum % 12}
              <button
                type="button"
                class="w-full py-1 px-2 text-xs rounded-md transition-colors flex items-center justify-between
                  {h === currentHour
                    ? 'bg-accent-500 text-on-accent font-bold'
                    : 'text-ink hover:bg-raised hover:text-white'}"
                on:click|stopPropagation={() => setHour(h)}
              >
                <span>{h}</span>
                <span class="text-[10px] opacity-75">{h12} {ampm}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Minutes column -->
        <div>
          <div class="text-[11px] font-medium text-slate-500 mb-1">Minute</div>
          <div class="h-44 overflow-y-auto space-y-1 pl-1">
            {#each MINUTES as m}
              <button
                type="button"
                class="w-full py-1.5 px-2 text-xs rounded-md transition-colors text-center
                  {m === currentMinute
                    ? 'bg-accent-500 text-on-accent font-bold'
                    : 'text-ink hover:bg-raised hover:text-white'}"
                on:click|stopPropagation={() => setMinute(m)}
              >
                :{m}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="mt-2.5 pt-2 border-t border-slate-200/80 flex justify-end">
        <button
          type="button"
          class="text-xs px-2.5 py-1 rounded-md bg-raised text-pine hover:text-white hover:bg-slate-300 transition-colors"
          on:click|stopPropagation={() => (open = false)}
        >
          Done
        </button>
      </div>
    </div>
  {/if}
</div>
