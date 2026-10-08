<script lang="ts">
  // The RepairVision mark: a loop that almost closes, ending in an arrow (a
  // thing coming back into use), around a lens (seeing what is wrong with it).
  // One drawing at every size; the wordmark is optional.
  export let size = 32;
  export let wordmark = false;
  let className = '';
  export { className as class };
  const id = `rv-${Math.random().toString(36).slice(2, 8)}`;
</script>

<span class="inline-flex items-center gap-2.5 {className}">
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role={wordmark ? undefined : 'img'}
    aria-hidden={wordmark ? 'true' : undefined}
    aria-label={wordmark ? undefined : 'RepairVision'}
    class="shrink-0"
  >
    <defs>
      <linearGradient id="{id}-bg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FF8080" />
        <stop offset="1" stop-color="#E5484D" />
      </linearGradient>
      <linearGradient id="{id}-hl" x1="16" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
        <stop stop-color="#fff" stop-opacity=".35" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#{id}-bg)" />
    <rect x=".5" y=".5" width="31" height="31" rx="7.5" stroke="url(#{id}-hl)" />
    <!-- The loop: 310° of a circle, open at the top right. -->
    <path d="M22.9 12A8 8 0 1 1 17.4 8.1" stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
    <!-- Its arrowhead. -->
    <path d="M15.2 5.4 18.2 8.2 15.4 11.1" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <!-- The lens. -->
    <circle cx="16" cy="16" r="2.6" fill="#fff" />
  </svg>
  {#if wordmark}
    <span class="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">Repair<span class="text-slate-500">Vision</span></span>
  {/if}
</span>
