<script lang="ts">
  /**
   * The demonstration accounts, listed like a directory: who they are, their
   * address and their role. Pressing a row signs straight in. Shows nothing
   * unless the hub has demo accounts switched on (DEMO_MODE or DEMO_ACCOUNTS)
   * and demo/seed.py has made them. The browser never sees a password: the
   * server signs into the fixed demo account itself.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import { auth, type AuthState } from '$lib/stores/auth';
  import { safeNext } from '$lib/staff/nav';
  import { ChevronRight, Loader2 } from 'lucide-svelte';

  interface DemoAccount {
    id: 'admin' | 'repairer' | 'owner';
    label: string;
    email: string;
    description: string;
    role?: string;
  }

  const ROLE_LABEL: Record<string, string> = {
    super_admin: 'admin',
    admin: 'admin',
    repairer: 'repairer',
    user: 'device owner',
  };

  let accounts: DemoAccount[] = [];
  let busy: string | null = null;
  let error = '';

  onMount(async () => {
    try {
      const res = await api<{ enabled: boolean; accounts: DemoAccount[] }>('/api/auth/demo-accounts', { autoRefresh: false });
      accounts = res.enabled ? res.accounts : [];
    } catch {
      accounts = [];
    }
  });

  async function signIn(account: DemoAccount) {
    if (busy) return;
    busy = account.id;
    error = '';
    try {
      const session = await api<AuthState>('/api/auth/demo-login', {
        method: 'POST',
        json: { account: account.id },
        autoRefresh: false,
      });
      auth.set(session);
      goto(safeNext($page.url.searchParams.get('next'), session.user), { replaceState: true });
    } catch (err: any) {
      error = err?.message || 'Could not sign in to the demo account.';
    } finally {
      busy = null;
    }
  }
</script>

{#if accounts.length}
  <section class="mt-8 pt-6 border-t border-slate-200" aria-labelledby="demo-accounts">
    <h2 id="demo-accounts" class="eyebrow !text-slate-500">Demonstration accounts</h2>
    <ul class="mt-2">
      {#each accounts as account (account.id)}
        <li class="demo-row border-b border-dotted border-slate-300 last:border-b-0">
          <button
            type="button"
            class="group flex w-full items-center gap-3 py-3 text-left disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-lg"
            disabled={busy !== null}
            on:click={() => signIn(account)}
          >
            <span class="min-w-0 flex-1">
              <span class="block text-[15px] font-medium text-slate-900">{account.label}</span>
              <span class="block font-mono text-xs text-slate-500 truncate">{account.email}{#if account.role} · {ROLE_LABEL[account.role] ?? account.role}{/if}</span>
            </span>
            <span class="shrink-0 text-slate-400 transition-[transform,color] duration-300 ease-apple group-hover:translate-x-0.5 group-hover:text-accent-600">
              {#if busy === account.id}<Loader2 size={16} class="animate-spin" />{:else}<ChevronRight size={16} />{/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
    {#if error}<p role="alert" class="mt-2 text-sm text-rose-600">{error}</p>{/if}
    <p class="mt-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-sm leading-relaxed text-amber-900">
      All data in this build is sample data. Nothing here is a real repair, a real person or a real device.
    </p>
  </section>
{/if}
