<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { registrationSchema } from '@circularity/shared';
  import { api, restoreSession } from '$lib/api';
  import { auth, type AuthState } from '$lib/stores/auth';
  import { safeNext } from '$lib/staff/nav';
  import { UserPlus } from 'lucide-svelte';

  let displayName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let busy = false;
  let error = '';
  onMount(async () => {
    await restoreSession();
    if ($auth) goto(safeNext($page.url.searchParams.get('next'), $auth.user), { replaceState: true });
  });
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    error = '';
    const parsed = registrationSchema.safeParse({ displayName, email, password });
    if (!parsed.success) { error = parsed.error.issues[0]?.message || 'Check your details.'; return; }
    if (password !== confirmPassword) { error = 'Your passwords do not match.'; return; }
    busy = true;
    try {
      const session = await api<AuthState>('/api/auth/register', { method: 'POST', json: parsed.data, autoRefresh: false });
      auth.set(session);
      goto(safeNext($page.url.searchParams.get('next'), session.user), { replaceState: true });
    } catch (err: any) { error = err?.message || 'Could not create your account.'; }
    finally { busy = false; }
  }
</script>

<svelte:head><title>Create an account | RepairVision AI</title></svelte:head>
<main class="min-h-screen grid place-items-center bg-canvas px-4 py-12">
  <form on:submit={submit} class="card p-8 w-full max-w-md">
    <p class="kicker">RepairVision AI</p>
    <h1 class="mt-2 text-3xl font-semibold">Create your account</h1>
    <p class="mt-2 text-sm text-slate-600">Describe what went wrong, add a photo, and get help deciding what to check next.</p>
    <div class="mt-6 space-y-4">
      <div><label class="label" for="name">Your name</label><input id="name" class="input" autocomplete="name" required maxlength="100" bind:value={displayName} /></div>
      <div><label class="label" for="email">Email</label><input id="email" class="input" type="email" autocomplete="email" required bind:value={email} /></div>
      <div><label class="label" for="password">Password</label><input id="password" class="input" type="password" autocomplete="new-password" required minlength="10" maxlength="128" bind:value={password} aria-describedby="password-help" /><p id="password-help" class="mt-2 text-xs text-slate-500">At least 10 characters, including uppercase, lowercase and a number.</p></div>
      <div><label class="label" for="confirm">Confirm password</label><input id="confirm" class="input" type="password" autocomplete="new-password" required bind:value={confirmPassword} /></div>
      {#if error}<p role="alert" class="text-sm text-rose-600">{error}</p>{/if}
      <button class="btn-primary w-full" disabled={busy} type="submit"><UserPlus size={18} /> {busy ? 'Creating account…' : 'Create account'}</button>
    </div>
    <p class="mt-6 text-center text-sm text-slate-600">Already have an account? <a href={'/login?next=' + encodeURIComponent($page.url.searchParams.get('next') || '/dashboard')} class="text-brand-500 hover:underline">Sign in</a></p>
    <a href="/" class="block text-center mt-4 text-sm text-slate-500 hover:underline">Back to home</a>
  </form>
</main>
