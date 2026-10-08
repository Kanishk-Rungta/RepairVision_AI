<script lang="ts">
  /**
   * One button per demo account, which signs straight in. Shows nothing
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
  import { Loader2, ShieldCheck, Smartphone, Wrench } from 'lucide-svelte';

  interface DemoAccount {
    id: 'admin' | 'repairer' | 'owner';
    label: string;
    email: string;
    description: string;
  }

  const ICONS = { admin: ShieldCheck, repairer: Wrench, owner: Smartphone };

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
  <section class="mt-6 pt-6 border-t border-slate-200" aria-labelledby="demo-accounts">
    <h2 id="demo-accounts" class="text-sm font-semibold text-slate-800">Try a demo account</h2>
    <p class="mt-1 text-xs text-slate-500">Made-up accounts filled with sample data. One click signs you in.</p>
    <div class="mt-3 grid gap-2">
      {#each accounts as account (account.id)}
        <button
          type="button"
          class="flex items-center gap-3 rounded-xl p-3 text-left ring-1 ring-slate-200 bg-surface hover:bg-slate-50 disabled:opacity-60 transition"
          disabled={busy !== null}
          on:click={() => signIn(account)}
        >
          <span class="h-9 w-9 shrink-0 rounded-lg bg-brand-100 text-brand-700 inline-flex items-center justify-center">
            {#if busy === account.id}<Loader2 size={18} class="animate-spin" />{:else}<svelte:component this={ICONS[account.id]} size={18} />{/if}
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-slate-900">{account.label}</span>
            <span class="block text-xs text-slate-500">{account.description}</span>
          </span>
        </button>
      {/each}
    </div>
    {#if error}<p role="alert" class="mt-2 text-sm text-rose-600">{error}</p>{/if}
  </section>
{/if}
