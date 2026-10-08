<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { api, restoreSession } from '$lib/api';
  import { auth, type AuthUser } from '$lib/stores/auth';
  import { safeNext } from '$lib/staff/nav';
  import { cafe } from '$lib/stores/cafe';
  import { LogIn } from 'lucide-svelte';
  import DemoAccounts from '$lib/components/DemoAccounts.svelte';

  let email = '';
  let password = '';
  let busy = false;
  let error = '';

  // Back to the page that sent you here, if you may open it. Otherwise your
  // usual starting page: the dashboard for admins, the queue for repairers.
  function destinationFor(user: AuthUser): string {
    return safeNext($page.url.searchParams.get('next'), user);
  }

  onMount(async () => {
    // If the user still has a valid session, skip the form.
    await restoreSession();
    if ($auth) goto(destinationFor($auth.user), { replaceState: true });
  });

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (busy) return;
    busy = true;
    error = '';
    try {
      const body = await api<{ accessToken: string; user: any }>('/api/auth/login', {
        method: 'POST',
        json: { email: email.trim(), password },
        autoRefresh: false,
      });
      auth.set({ accessToken: body.accessToken, user: body.user });
      goto(destinationFor(body.user), { replaceState: true });
    } catch (err: any) {
      error = err?.message || 'Could not sign in';
    } finally {
      busy = false;
    }
  }
</script>

<main class="min-h-screen grid place-items-center bg-canvas px-4 py-12">
  <div class="login-card card w-full max-w-md p-8 md:p-10">
    <form on:submit={submit}>
      <h1 class="text-3xl">Sign in</h1>
      <p class="eyebrow mt-3 !text-slate-500">{$cafe?.name || 'RepairVision'}</p>
      {#if $page.url.searchParams.get('next')}
        <p class="mt-4 text-sm rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2 text-slate-700">Sign in to carry on where you were.</p>
      {/if}
      <div class="mt-7 space-y-5">
        <div>
          <label class="label eyebrow !text-slate-500 !mb-2" for="email">Email</label>
          <input id="email" class="input" type="email" autocomplete="email" required bind:value={email} />
        </div>
        <div>
          <label class="label eyebrow !text-slate-500 !mb-2" for="password">Password</label>
          <input id="password" class="input" type="password" autocomplete="current-password" required bind:value={password} />
        </div>
        {#if error}<p class="text-sm text-rose-600" role="alert">{error}</p>{/if}
        <button class="btn-primary btn-lg w-full" disabled={busy} type="submit">
          <LogIn size={18} /> Sign in
        </button>
      </div>
    </form>
    <DemoAccounts />
    <p class="mt-8 text-center text-sm text-slate-600">New to RepairVision? <a href={'/register?next=' + encodeURIComponent($page.url.searchParams.get('next') || '/diagnosis')} class="text-brand-600 hover:underline">Create an account</a></p>
    <a href="/" class="block text-center mt-4 text-sm text-slate-500 hover:underline">Back to home</a>
  </div>
</main>
