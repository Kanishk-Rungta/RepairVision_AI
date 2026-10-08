<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { ChevronDown, Check } from 'lucide-svelte';

  export let value: any = '';
  export let options: Array<{ value: any; label: string }> = [];
  export let placeholder: string = 'Select...';
  export let id: string = '';
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{ change: any }>();

  let open = false;
  let container: HTMLDivElement;

  $: selectedOption = options.find((o) => o.value === value);

  function select(opt: { value: any; label: string }) {
    value = opt.value;
    dispatch('change', opt.value);
    open = false;
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
    aria-haspopup="listbox"
    aria-expanded={open}
  >
    <span class="truncate {selectedOption ? 'font-medium text-pine' : 'text-slate-500'}">
      {selectedOption ? selectedOption.label : placeholder}
    </span>
    <ChevronDown
      size={16}
      class="text-slate-400 shrink-0 transition-transform duration-200 {open ? 'rotate-180' : ''}"
    />
  </button>

  {#if open}
    <div
      class="absolute z-50 mt-1.5 w-full min-w-[180px] p-1 rounded-xl border border-slate-300 bg-surface shadow-2xl backdrop-blur-md max-h-60 overflow-y-auto animate-in fade-in zoom-in-95"
      role="listbox"
    >
      {#each options as opt}
        {@const isSelected = opt.value === value}
        <button
          type="button"
          class="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors
            {isSelected
              ? 'bg-raised font-semibold text-pine'
              : 'text-ink hover:bg-raised/70 hover:text-white'}"
          on:click|stopPropagation={() => select(opt)}
          role="option"
          aria-selected={isSelected}
        >
          <span class="truncate">{opt.label}</span>
          {#if isSelected}
            <Check size={14} class="text-accent-400 shrink-0 ml-2" />
          {/if}
        </button>
      {/each}
      {#if options.length === 0}
        <div class="px-3 py-2 text-xs text-slate-500 text-center">No options available</div>
      {/if}
    </div>
  {/if}
</div>
