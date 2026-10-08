<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import Logo from './Logo.svelte';
  // The frame round every page staff see after signing in: the admin area and
  // the repairer area alike. See $lib/staff/nav.ts for why it is one frame.
  //
  // It also looks after being signed in:
  //   - nobody signed in: off to the sign-in page, which brings them straight
  //     back here afterwards
  //   - the session ends while a page is open: the same, instead of the blank
  //     page people used to sign out and in again to escape
  //   - a repairer opens an admin page: a short note and a way back to the
  //     queue, rather than being bounced to the sign-in page
  import { goto, afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import { api, restoreSession } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import { cafe } from '$lib/stores/cafe';
  import { homeFor, isAdminRole, isCurrent, navFor, tabsFor } from '$lib/staff/nav';
  import { Globe, LogOut, Menu, ShieldAlert, X } from 'lucide-svelte';

  /** Only admins may see this part of the site. */
  export let requireAdmin = false;
  export let requireStaff = false;

  let ready = false;
  let drawerOpen = false;
  let signingOut = false;

  // ── Collapsing the sidebar ────────────────────────────────────────────────
  // Laptop and tablet only. Collapsed, it becomes a rail of icons with their
  // names in a tooltip. The choice is remembered on this device, and "[" (or
  // Ctrl/Cmd+B) toggles it from anywhere that is not a text field.
  const COLLAPSE_KEY = 'rv.sidebar.collapsed';
  let collapsed = false;

  function setCollapsed(value: boolean) {
    collapsed = value;
    try {
      localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
    } catch {
      /* private mode: just do not remember */
    }
  }

  function typingInField(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  function onKey(e: KeyboardEvent) {
    if (typingInField(e.target)) return;
    const bracket = e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey;
    const modB = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'b';
    if (bracket || modB) {
      e.preventDefault();
      setCollapsed(!collapsed);
    }
  }

  // Anything fixed to the page (the install banner) lines up with the sidebar.
  $: if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--staff-sidebar', collapsed ? '4.5rem' : '16rem');
  }

  // The highlight behind the current menu item glides to the next one when
  // you move between pages, instead of jumping.
  let navEl: HTMLElement | null = null;
  let gliderX = 0;
  let gliderY = 0;
  let gliderW = 0;
  let gliderH = 0;
  let gliderOn = false;
  let gliderReady = false;
  async function placeGlider() {
    await tick();
    const cur = navEl?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!navEl || !cur) {
      gliderOn = false;
      return;
    }
    gliderX = cur.offsetLeft;
    gliderY = cur.offsetTop;
    gliderW = cur.offsetWidth;
    gliderH = cur.offsetHeight;
    gliderOn = true;
    // Don't animate the first placement, only the moves after it.
    requestAnimationFrame(() => (gliderReady = true));
  }
  $: if (navEl) {
    pathname;
    groups;
    placeGlider();
  }
  // The sidebar's width eases over 200ms when it collapses; place the
  // highlight again once it has settled.
  $: if (navEl) {
    collapsed;
    setTimeout(placeGlider, 260);
  }

  $: user = $auth?.user ?? null;
  $: admin = isAdminRole(user);
  $: groups = navFor(user, { linuxEnabled: $cafe?.linuxEnabled === true });
  $: tabs = tabsFor(user);
  $: pathname = $page.url.pathname;
  $: allowed = (!requireAdmin || admin) && (!requireStaff || user?.role !== 'user');

  function toSignIn() {
    const here = `${$page.url.pathname}${$page.url.search}`;
    goto(`/login?next=${encodeURIComponent(here)}`, { replaceState: true });
  }

  onMount(async () => {
    try {
      collapsed = localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      /* no storage: start expanded */
    }
    // Wait for the session to be restored from the cookie before deciding
    // anyone is signed out, or every refresh would send people to sign in.
    await restoreSession();
    ready = true;
  });

  // Covers both the first visit and a session that ends later on.
  $: if (ready && !$auth && !signingOut) toSignIn();

  afterNavigate(() => {
    drawerOpen = false;
  });

  // One floating tooltip for the whole sidebar. It is fixed to the window,
  // so the scrolling nav cannot clip it.
  let tip: { text: string; kbd: string | null; x: number; y: number } | null = null;

  function showTip(e: Event) {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tip]');
    if (!el || !el.dataset.tip) return;
    const r = el.getBoundingClientRect();
    tip = { text: el.dataset.tip, kbd: el.dataset.kbd ?? null, x: r.right + 12, y: r.top + r.height / 2 };
  }

  function hideTip(e: Event) {
    const next = (e as MouseEvent | FocusEvent).relatedTarget as HTMLElement | null;
    if (next?.closest?.('[data-tip]') === (e.target as HTMLElement | null)?.closest?.('[data-tip]')) return;
    tip = null;
  }

  $: collapsed, pathname, (tip = null);

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase() || '?';
  }

  async function signOut() {
    signingOut = true;
    await api('/api/auth/logout', { method: 'POST', autoRefresh: false }).catch(() => {});
    auth.set(null);
    goto('/login', { replaceState: true });
  }
</script>

<svelte:window on:keydown={onKey} />

{#if $auth && user}
  <div class="min-h-screen bg-canvas md:flex">
    <!-- ── Sidebar, on a laptop or tablet ─────────────────────────────── -->
    <aside
      class="group/side hidden md:flex md:flex-col shrink-0 bg-surface border-r border-slate-200 sticky top-0 h-screen no-print z-20 transition-[width] duration-200 ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none {collapsed ? 'w-[4.5rem]' : 'w-64'}"
      aria-label="Sidebar"
      on:mouseover={showTip}
      on:focusin={showTip}
      on:mouseout={hideTip}
      on:focusout={hideTip}
    >
      <!-- The trigger: a knob on the sidebar's edge. It shows when the
           sidebar is hovered or the knob has focus, and always while the
           sidebar is collapsed so the way back is never hidden. -->
      <button
        type="button"
        class="side-knob absolute top-[1.35rem] -right-3 z-30 grid h-6 w-6 place-items-center rounded-full bg-raised text-slate-600 ring-1 ring-slate-300 shadow-md transition-[opacity,color,transform] duration-150 hover:text-slate-950 hover:scale-110 focus-visible:opacity-100 {collapsed ? 'opacity-100' : 'opacity-0 group-hover/side:opacity-100'}"
        aria-label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
        aria-expanded={!collapsed}
        data-tip={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        data-kbd="["
        on:click={() => setCollapsed(!collapsed)}
      >
        <!-- A short rail with a nudge: the rail is the sidebar, the nudge
             says which way it will move. -->
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" class="transition-transform duration-200 {collapsed ? 'rotate-180' : ''}">
          <path d="M2.25 2.5v7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".55" />
          <path d="M8.75 3.25 6 6l2.75 2.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <a
        href={homeFor(user)}
        class="flex items-center gap-3 h-[4.25rem] border-b border-slate-200 min-w-0 {collapsed ? 'justify-center px-0' : 'px-5'}"
        aria-label={collapsed ? $cafe?.name || 'Repair Cafe' : undefined}
      >
        {#if $cafe?.logoUrl}
          <img src={$cafe.logoUrl} alt="" class="h-8 w-auto rounded-md object-contain shrink-0 {collapsed ? 'max-w-[2.25rem]' : 'max-w-[7rem]'}" />
        {:else}
          <Logo size={30} />
        {/if}
        {#if !collapsed}
          <span class="font-semibold text-slate-900 leading-tight truncate">{$cafe?.name || 'Repair Cafe'}</span>
        {/if}
      </a>

      <nav bind:this={navEl} class="relative flex-1 overflow-y-auto overflow-x-hidden py-4 text-sm {collapsed ? 'px-3 space-y-3' : 'px-3 space-y-5'}" aria-label="Main">
        <span
          aria-hidden="true"
          class="nav-glider pointer-events-none absolute left-0 top-0 rounded-lg bg-tint/[0.07]"
          class:nav-glider-on={gliderOn}
          class:nav-glider-ready={gliderReady}
          style="width:{gliderW}px;height:{gliderH}px;transform:translate3d({gliderX}px,{gliderY}px,0)"
        ></span>
        {#each groups as group, gi}
          <div>
            {#if collapsed}
              {#if gi > 0}<div class="mx-2 mb-3 h-px bg-slate-200" aria-hidden="true"></div>{/if}
              <p class="sr-only">{group.title}</p>
            {:else}
              <p class="px-3 mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">{group.title}</p>
            {/if}
            {#each group.items as item}
              {@const current = isCurrent(item, pathname)}
              <a
                href={item.href}
                class="side-item relative flex items-center rounded-lg transition-colors duration-300 {collapsed ? 'justify-center h-10 w-10 mx-auto mb-1' : 'gap-3 px-3 py-2'} {current ? 'text-slate-950 font-medium' : 'text-slate-500 hover:text-slate-900 hover:bg-tint/[0.05]'}"
                aria-current={current ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                data-tip={collapsed ? item.label : undefined}
              >
                {#if current && collapsed}<span class="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-500" aria-hidden="true"></span>{/if}
                <svelte:component this={item.icon} size={18} class="shrink-0 {current ? 'text-brand-400' : 'text-slate-400'}" />
                {#if !collapsed}<span class="truncate">{item.label}</span>{/if}
              </a>
            {/each}
          </div>
        {/each}
      </nav>

      <div class="border-t border-slate-200 p-3 text-sm space-y-1">
        {#if collapsed}
          <div class="side-item relative mx-auto mb-1 grid h-9 w-9 place-items-center rounded-full bg-brand-500/15 text-[12px] font-semibold text-brand-400 ring-1 ring-brand-500/25" tabindex="0" role="img" aria-label={user.displayName} data-tip={`${user.displayName} · ${admin ? (user.role === 'super_admin' ? 'Super admin' : 'Admin') : user.role === 'user' ? 'Device owner' : 'Repairer'}`}>
            {initials(user.displayName)}
          </div>
          <a href="/" class="side-item relative mx-auto grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-tint/[0.05]" aria-label="View the website" data-tip="View the website">
            <Globe size={18} class="text-slate-400" />
          </a>
          <button type="button" on:click={signOut} class="side-item relative mx-auto grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-tint/[0.05]" aria-label="Sign out" data-tip="Sign out">
            <LogOut size={18} class="text-slate-400" />
          </button>
          <div class="mx-auto grid h-10 w-10 place-items-center"><ThemeToggle /></div>
        {:else}
          <div class="flex items-center gap-3 px-3 py-2 min-w-0">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-400 ring-1 ring-brand-500/25">{initials(user.displayName)}</span>
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate">{user.displayName}</p>
              <p class="text-xs text-slate-500">{admin ? (user.role === 'super_admin' ? 'Super admin' : 'Admin') : user.role === 'user' ? 'Device owner' : 'Repairer'}</p>
            </div>
          </div>
          <a href="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-tint/[0.05]"><Globe size={18} class="text-slate-400" /> View the website</a>
          <button type="button" on:click={signOut} class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-tint/[0.05]"><LogOut size={18} class="text-slate-400" /> Sign out</button>
          <div class="flex items-center justify-between px-3 pt-1 text-xs text-slate-500">Theme <ThemeToggle /></div>
          {#if admin}
            <a href="/admin/settings?tab=about" class="block px-3 pt-2 text-xs text-slate-400 hover:text-slate-600" title="Version">
              RepairVision {$cafe?.appVersion ?? ''}
            </a>
          {/if}
        {/if}
      </div>
    </aside>

    {#if tip}
      <div class="side-tip hidden md:inline-flex" style="left: {tip.x}px; top: {tip.y}px" role="tooltip">
        {tip.text}
        {#if tip.kbd}<kbd class="kbd !text-[10px] !px-1 !py-0">{tip.kbd}</kbd>{/if}
      </div>
    {/if}

    <!-- ── Top bar, on a phone ───────────────────────────────────────── -->
    <div class="md:hidden sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 no-print">
      <a href={homeFor(user)} class="flex items-center gap-2 min-w-0">
        {#if $cafe?.logoUrl}
          <img src={$cafe.logoUrl} alt="" class="h-8 w-auto max-w-[6rem] rounded-md object-contain" />
        {:else}
          <Logo size={28} />
        {/if}
        <span class="font-semibold text-slate-900 truncate">{$cafe?.name || 'Repair Cafe'}</span>
      </a>
      <div class="flex items-center gap-1">
      <ThemeToggle />
      <button
        type="button"
        class="inline-flex items-center justify-center h-10 w-10 rounded-lg text-slate-700 hover:bg-slate-100"
        aria-label="Open the menu"
        aria-expanded={drawerOpen}
        on:click={() => (drawerOpen = true)}
      >
        <Menu size={22} />
      </button>
      </div>
    </div>

    {#if drawerOpen}
      <div class="md:hidden fixed inset-0 z-50 flex no-print" role="dialog" aria-modal="true" aria-label="Menu">
        <button type="button" class="scrim-in absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close the menu" on:click={() => (drawerOpen = false)}></button>
        <div class="drawer-in relative ml-auto w-80 max-w-[85vw] h-full bg-surface flex flex-col shadow-xl">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div class="min-w-0">
              <p class="font-semibold text-slate-900 truncate">{user.displayName}</p>
              <p class="text-xs text-slate-500">{admin ? 'Admin' : user.role === 'user' ? 'Device owner' : 'Repairer'}</p>
            </div>
            <button type="button" class="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Close the menu" on:click={() => (drawerOpen = false)}><X size={22} /></button>
          </div>
          <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Main">
            {#each groups as group}
              <div>
                <p class="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
                {#each group.items as item}
                  {@const current = isCurrent(item, pathname)}
                  <a href={item.href} class="flex items-center gap-3 px-3 py-3 rounded-lg {current ? 'bg-tint/[0.04] text-slate-950 font-medium' : 'text-slate-700 hover:bg-tint/[0.04]'}" aria-current={current ? 'page' : undefined}>
                    <svelte:component this={item.icon} size={20} class={current ? 'text-brand-400' : 'text-slate-400'} />
                    {item.label}
                  </a>
                {/each}
              </div>
            {/each}
          </nav>
          <div class="border-t border-slate-200 p-3 space-y-1">
            <a href="/" class="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-800 hover:bg-slate-100"><Globe size={20} class="text-slate-400" /> View the website</a>
            <button type="button" on:click={signOut} class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-800 hover:bg-slate-100"><LogOut size={20} class="text-slate-400" /> Sign out</button>
          </div>
        </div>
      </div>
    {/if}

    <!-- ── The page ─────────────────────────────────────────────────── -->
    <div class="flex-1 min-w-0 pb-20 md:pb-0">
      <main class="staff px-4 py-5 md:px-8 md:py-8 max-w-6xl mx-auto">
        {#if allowed}
          <slot />
        {:else}
          <div class="card p-8 max-w-lg mx-auto text-center mt-8">
            <span class="h-12 w-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center"><ShieldAlert size={24} /></span>
            <h1 class="text-xl font-semibold mt-4">{requireAdmin ? 'This page is for admins' : 'This page is for staff'}</h1>
            <p class="mt-2 text-slate-600">Your account does not have access to this workspace. Return to your dashboard to continue.</p>
            <a href={homeFor(user)} class="btn-primary mt-6">Go to my dashboard</a>
          </div>
        {/if}
      </main>
    </div>

    <!-- ── Bottom tabs, on a phone ──────────────────────────────────── -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-slate-200 grid no-print" style="grid-template-columns: repeat({tabs.length}, minmax(0, 1fr)); padding-bottom: env(safe-area-inset-bottom);" aria-label="Quick links">
      {#each tabs as tab}
        {@const current = isCurrent(tab, pathname)}
        <a href={tab.href} class="tab-link flex flex-col items-center gap-0.5 py-2 text-xs transition-colors duration-300 {current ? 'text-brand-400 font-semibold' : 'text-slate-500'}" aria-current={current ? 'page' : undefined}>
          <span class="tab-icon block transition-transform duration-500 ease-spring {current ? '-translate-y-0.5 scale-110' : ''}"><svelte:component this={tab.icon} size={22} /></span>
          {tab.label}
        </a>
      {/each}
    </nav>
  </div>
{:else}
  <div class="min-h-screen grid place-items-center bg-canvas text-slate-500">Loading…</div>
{/if}

<style>
  /* The sidebar tooltip: fixed to the window, beside the hovered or focused
     item. It never takes the pointer. */
  .side-tip {
    position: fixed;
    z-index: 60;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
    padding: 0.3rem 0.55rem;
    border-radius: 0.45rem;
    background: rgb(var(--raised));
    color: rgb(var(--s-900));
    font-size: 0.75rem;
    font-weight: 500;
    box-shadow: 0 0 0 1px rgb(var(--s-300)), 0 8px 20px -6px rgb(0 0 0 / 0.7);
    pointer-events: none;
    transform: translateY(-50%);
    animation: side-tip-in 0.12s ease both;
  }
  @keyframes side-tip-in {
    from { opacity: 0; transform: translate(-4px, -50%); }
    to { opacity: 1; transform: translate(0, -50%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .side-tip { animation: none; }
  }
</style>
