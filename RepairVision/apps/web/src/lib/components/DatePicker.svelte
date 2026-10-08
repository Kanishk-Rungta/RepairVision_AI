<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-svelte';

  export let value: string = '';
  export let placeholder: string = 'Select date';
  export let id: string = '';
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{ change: string }>();

  let open = false;
  let container: HTMLDivElement;

  // View state for the calendar grid
  let viewYear: number;
  let viewMonth: number; // 0-indexed (0 = Jan)

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  function initView() {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-').map(Number);
      viewYear = parts[0];
      viewMonth = parts[1] - 1;
    } else {
      const today = new Date();
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
    }
  }

  $: if (!open) {
    initView();
  }

  function formatDisplay(val: string): string {
    if (!val || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return '';
    const parts = val.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  interface CalendarDay {
    year: number;
    month: number;
    day: number;
    isCurrentMonth: boolean;
    dateString: string;
    isToday: boolean;
    isSelected: boolean;
  }

  function pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function getDaysGrid(year: number, month: number, selectedVal: string): CalendarDay[] {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Leading days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateString = `${prevYear}-${pad(prevMonth + 1)}-${pad(d)}`;
      days.push({
        year: prevYear,
        month: prevMonth,
        day: d,
        isCurrentMonth: false,
        dateString,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedVal,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateString = `${year}-${pad(month + 1)}-${pad(d)}`;
      days.push({
        year,
        month,
        day: d,
        isCurrentMonth: true,
        dateString,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedVal,
      });
    }

    // Trailing days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    const totalNeeded = days.length + remaining < 35 ? 35 - days.length : remaining;
    for (let d = 1; d <= totalNeeded; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateString = `${nextYear}-${pad(nextMonth + 1)}-${pad(d)}`;
      days.push({
        year: nextYear,
        month: nextMonth,
        day: d,
        isCurrentMonth: false,
        dateString,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedVal,
      });
    }

    return days;
  }

  $: days = getDaysGrid(viewYear, viewMonth, value);

  function prevMonth() {
    if (viewMonth === 0) {
      viewMonth = 11;
      viewYear -= 1;
    } else {
      viewMonth -= 1;
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      viewMonth = 0;
      viewYear += 1;
    } else {
      viewMonth += 1;
    }
  }

  function selectDate(day: CalendarDay) {
    value = day.dateString;
    dispatch('change', value);
    open = false;
  }

  function pickToday() {
    const today = new Date();
    value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    initView();
    dispatch('change', value);
    open = false;
  }

  function clearDate() {
    value = '';
    dispatch('change', value);
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
    initView();
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
      <CalendarIcon size={16} class="text-slate-400 shrink-0" />
      {#if value}
        <span class="font-medium text-pine truncate">{formatDisplay(value)}</span>
      {:else}
        <span class="text-slate-500">{placeholder}</span>
      {/if}
    </div>
    {#if value && !disabled}
      <button
        type="button"
        class="text-slate-500 hover:text-white p-0.5 rounded transition-colors"
        on:click|stopPropagation={clearDate}
        title="Clear date"
      >
        <X size={14} />
      </button>
    {/if}
  </button>

  {#if open}
    <div
      class="absolute z-50 mt-1.5 w-[280px] p-3 rounded-xl border border-slate-300 bg-surface shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95"
      role="dialog"
      aria-label="Calendar"
    >
      <!-- Month & Year Header Navigation -->
      <div class="flex items-center justify-between mb-3 px-1">
        <span class="text-sm font-semibold text-pine font-sans">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-raised transition-colors"
            on:click|stopPropagation={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-raised transition-colors"
            on:click|stopPropagation={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <!-- Weekday column labels -->
      <div class="grid grid-cols-7 gap-1 text-center mb-1">
        {#each WEEKDAYS as day}
          <div class="text-[11px] font-medium text-slate-500 py-1">
            {day}
          </div>
        {/each}
      </div>

      <!-- Days Grid -->
      <div class="grid grid-cols-7 gap-1">
        {#each days as item}
          <button
            type="button"
            class="h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-all font-sans relative
              {item.isSelected
                ? 'bg-accent-500 text-on-accent font-bold shadow-sm'
                : item.isCurrentMonth
                  ? 'text-ink hover:bg-raised hover:text-white'
                  : 'text-slate-600 hover:bg-raised/50 hover:text-slate-400'}
              {item.isToday && !item.isSelected ? 'ring-1 ring-accent-500/60 font-semibold' : ''}
            "
            on:click|stopPropagation={() => selectDate(item)}
          >
            {item.day}
          </button>
        {/each}
      </div>

      <!-- Footer Quick Actions -->
      <div class="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
        <button
          type="button"
          class="text-slate-400 hover:text-white transition-colors py-1 px-1.5 rounded hover:bg-raised"
          on:click|stopPropagation={clearDate}
        >
          Clear
        </button>
        <button
          type="button"
          class="font-medium text-accent-400 hover:text-accent-300 transition-colors py-1 px-1.5 rounded hover:bg-raised"
          on:click|stopPropagation={pickToday}
        >
          Today
        </button>
      </div>
    </div>
  {/if}
</div>
