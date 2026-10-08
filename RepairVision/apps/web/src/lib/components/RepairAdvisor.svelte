<script lang="ts">
  /**
   * Repair vs. Replace Advisor.
   *
   * A short form on the left, the answer on the right. Every price is typed in
   * by the person: the part finder only brings back a part's name and a link to
   * read the price from (and a price too, if the cafe has set up a price
   * service). The sums happen on the server, in one call, so the page only
   * draws what it is told. It never says what to do; it shows the cost.
   *
   * It can be opened with the form pre-filled, from a diagnosis or a repair:
   *   /advisor?item=Kettle&factor=<id>&success=0.65
   * and with a repair attached, so the answer can be kept on it:
   *   /advisor?job=<repair id>
   */
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import type { AdvisorEstimate, SavedAdvisorEstimate } from '@circularity/shared';
  import { BookmarkCheck, Calculator, Leaf, Link as LinkIcon, Loader2, Plus, Save, Search, Trash2, TriangleAlert } from 'lucide-svelte';

  /** Open to everyone on the public site. Saving to a repair needs sign-in. */
  export let publicMode = false;

  interface Factor { id: string; label: string; groupLabel: string }
  interface PartRow { name: string; unitPrice: string; quantity: string; url: string; source: 'user' | 'lookup' }
  interface PartMatch { name: string; url: string; partNumber: string | null; supplier: string; price: number | null; currency: string | null; source: 'link' | 'lookup' }

  let factors: Factor[] = [];
  let co2Enabled = true;

  // ── The form ─────────────────────────────────────────────────────────────
  let item = '';
  let factorId = '';
  let replacementCost = '';
  let replacementExtras = '';
  let parts: PartRow[] = [{ name: '', unitPrice: '', quantity: '1', url: '', source: 'user' }];
  let labourCost = '';
  let toolsCost = '';
  let professionalQuote = '';
  let successPercent = 80;
  let ageYears = '';
  let lifeYears = '';
  // The cafe's own currency and the points a verdict is judged against.
  let currency = 'GBP';
  let thresholds = { repairShare: 0.5, replaceShare: 0.9 };
  $: symbol = new Intl.NumberFormat('en-GB', { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;

  // ── A repair this is attached to ──────────────────────────────────────────
  let jobId: string | null = null;
  let saved: SavedAdvisorEstimate | null = null;
  let saving = false;
  let saveError = '';
  // True once the figures on screen match what is saved.
  let upToDate = false;

  // ── Part finder ──────────────────────────────────────────────────────────
  let partQuery = '';
  let finding = false;
  let found: PartMatch[] | null = null;
  let findError = '';
  let priceProvider = false;

  // ── The answer ───────────────────────────────────────────────────────────
  let estimate: AdvisorEstimate | null = null;
  let busy = false;
  let error = '';

  onMount(async () => {
    const q = $page.url.searchParams;
    item = q.get('item') ?? '';
    factorId = q.get('factor') ?? '';
    const success = Number(q.get('success'));
    if (Number.isFinite(success) && success >= 0.05 && success <= 1) successPercent = Math.round(success * 100);

    const [cfg, co2] = await Promise.allSettled([
      api<{ currency: string; repairShare: number; replaceShare: number }>('/api/advisor/config', { autoRefresh: false }),
      api<{ enabled: boolean; factors: Factor[] }>('/api/public/co2-factors', { autoRefresh: false }),
    ]);
    if (cfg.status === 'fulfilled') {
      currency = cfg.value.currency;
      thresholds = { repairShare: cfg.value.repairShare, replaceShare: cfg.value.replaceShare };
    }
    if (co2.status === 'fulfilled') {
      co2Enabled = co2.value.enabled;
      factors = co2.value.factors;
    }

    // Opened from a repair: fill in the item, and show what was saved before.
    jobId = !publicMode && $auth ? q.get('job') : null;
    if (jobId) {
      try {
        const [job, keep] = await Promise.all([
          api<{ job: { itemDescription: string | null; co2FactorId: string | null } }>(`/api/repairer/jobs/${encodeURIComponent(jobId)}`),
          api<{ saved: SavedAdvisorEstimate | null }>(`/api/advisor/jobs/${encodeURIComponent(jobId)}`),
        ]);
        if (keep.saved) {
          saved = keep.saved;
          fill(keep.saved.request);
          estimate = keep.saved.result;
          upToDate = true;
        } else {
          item = item || job.job.itemDescription || '';
          factorId = factorId || job.job.co2FactorId || '';
        }
      } catch {
        jobId = null;
      }
    }
    partQuery = item;
  });

  /** Put a saved request back into the form. */
  function fill(r: SavedAdvisorEstimate['request']) {
    item = r.item;
    factorId = r.factorId ?? '';
    replacementCost = String(r.replacementCost);
    replacementExtras = r.replacementExtras ? String(r.replacementExtras) : '';
    parts = r.parts.length
      ? r.parts.map((p) => ({ name: p.name, unitPrice: String(p.unitPrice), quantity: String(p.quantity), url: p.url ?? '', source: p.source }))
      : parts;
    labourCost = r.labourCost ? String(r.labourCost) : '';
    toolsCost = r.toolsCost ? String(r.toolsCost) : '';
    professionalQuote = r.professionalQuote !== undefined ? String(r.professionalQuote) : '';
    successPercent = Math.round(r.successChance * 100);
    ageYears = r.deviceAgeYears !== undefined ? String(r.deviceAgeYears) : '';
    lifeYears = r.expectedLifeYears !== undefined ? String(r.expectedLifeYears) : '';
  }

  const num = (s: string): number => {
    const n = Number(s.replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  $: filledParts = parts.filter((p) => p.name.trim() && num(p.unitPrice) > 0);
  $: canEstimate = item.trim().length > 0 && num(replacementCost) > 0 && !busy;

  async function findParts() {
    const q = partQuery.trim();
    if (q.length < 2 || finding) return;
    finding = true;
    findError = '';
    try {
      const res = await api<{ parts: PartMatch[]; priceProvider: boolean }>(`/api/advisor/parts?q=${encodeURIComponent(q)}&currency=${currency}`);
      found = res.parts;
      priceProvider = res.priceProvider;
    } catch (e: any) {
      found = null;
      findError = e?.message || 'Could not look for parts just now. You can still type one in.';
    } finally {
      finding = false;
    }
  }

  function usePart(m: PartMatch) {
    const row: PartRow = {
      name: m.name,
      unitPrice: m.price !== null ? String(m.price) : '',
      quantity: '1',
      url: m.url,
      source: m.price !== null ? 'lookup' : 'user',
    };
    const empty = parts.findIndex((p) => !p.name.trim() && !p.unitPrice);
    if (empty >= 0) parts[empty] = row;
    else parts = [...parts, row];
    parts = parts;
  }

  const addRow = () => (parts = [...parts, { name: '', unitPrice: '', quantity: '1', url: '', source: 'user' }]);
  const removeRow = (i: number) => (parts = parts.length > 1 ? parts.filter((_, j) => j !== i) : parts);

  /** The form as the server wants it, read as it is right now. */
  function payload() {
    const now = parts.filter((p) => p.name.trim() && num(p.unitPrice) > 0);
    return {
      item: item.trim(),
      ...(factorId ? { factorId } : {}),
      replacementCost: num(replacementCost),
      replacementExtras: num(replacementExtras),
      parts: now.map((p) => ({
        name: p.name.trim(),
        unitPrice: num(p.unitPrice),
        quantity: Math.max(1, Math.round(num(p.quantity)) || 1),
        source: p.source,
        ...(p.url.trim() ? { url: p.url.trim() } : {}),
      })),
      labourCost: num(labourCost),
      toolsCost: num(toolsCost),
      ...(professionalQuote.trim() ? { professionalQuote: num(professionalQuote) } : {}),
      successChance: successPercent / 100,
      ...(ageYears.trim() && lifeYears.trim() ? { deviceAgeYears: num(ageYears), expectedLifeYears: num(lifeYears) } : {}),
    };
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (busy || !item.trim() || num(replacementCost) <= 0) return;
    busy = true;
    error = '';
    try {
      estimate = await api<AdvisorEstimate>('/api/advisor/estimate', { method: 'POST', json: payload() });
      upToDate = false;
      saveError = '';
      // Bring the answer into view on a phone, where it sits below the form.
      requestAnimationFrame(() => document.getElementById('advisor-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e: any) {
      estimate = null;
      error = e?.message || 'Could not work that out. Check the figures and try again.';
    } finally {
      busy = false;
    }
  }

  /** Keep this comparison on the repair. The server works it out again before saving. */
  async function save() {
    if (!jobId || saving) return;
    saving = true;
    saveError = '';
    try {
      const res = await api<{ saved: SavedAdvisorEstimate }>(`/api/advisor/jobs/${encodeURIComponent(jobId)}`, { method: 'PUT', json: payload() });
      saved = res.saved;
      estimate = res.saved.result;
      upToDate = true;
    } catch (e: any) {
      saveError = e?.message || 'Could not save it. Try again.';
    } finally {
      saving = false;
    }
  }

  async function removeSaved() {
    if (!jobId || saving) return;
    saving = true;
    try {
      await api(`/api/advisor/jobs/${encodeURIComponent(jobId)}`, { method: 'DELETE' });
      saved = null;
      upToDate = false;
    } catch (e: any) {
      saveError = e?.message || 'Could not remove it. Try again.';
    } finally {
      saving = false;
    }
  }

  const savedOn = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const money = (n: number) => {
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: estimate?.currency ?? currency }).format(n);
    } catch {
      return n.toFixed(2);
    }
  };
  const VERDICT = {
    repair: { label: 'Repair it', tone: 'bg-emerald-100 text-emerald-800' },
    replace: { label: 'Replace it', tone: 'bg-amber-100 text-amber-800' },
    close: { label: 'Too close to call', tone: 'bg-blue-100 text-blue-800' },
  } as const;

  $: widest = estimate ? Math.max(...estimate.options.map((o) => o.expectedCost), 0.01) : 1;
</script>

<svelte:head><title>Repair or replace?</title></svelte:head>

<div class="space-y-6">
  <header>
    <p class="eyebrow">Repair vs. replace</p>
    <h1 class="mt-2 text-3xl">Is it worth fixing?</h1>
    <p class="mt-2 max-w-2xl text-slate-600">
      Enter what a replacement would cost and what the repair needs. We work out which is cheaper, allowing for a repair that does not work, and what a repair keeps out of the bin.
      The prices are yours: nothing here is a guess about the market.
    </p>
  </header>

  <div class="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
    <form on:submit={submit} class="card p-6 space-y-6">
      <section class="space-y-4">
        <div>
          <label class="label" for="adv-item">What is broken?</label>
          <input id="adv-item" class="input" bind:value={item} placeholder="e.g. Kettle" required maxlength="160" />
        </div>
        {#if co2Enabled && factors.length}
          <div>
            <label class="label" for="adv-type">What kind of thing is it? <span class="font-normal text-slate-500">(for waste figures)</span></label>
            <select id="adv-type" class="input" bind:value={factorId}>
              <option value="">Not sure</option>
              {#each factors as f (f.id)}<option value={f.id}>{f.label}</option>{/each}
            </select>
          </div>
        {/if}
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold">A replacement</h2>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="adv-new">Price of a new one ({symbol})</label>
            <input id="adv-new" class="input" inputmode="decimal" bind:value={replacementCost} placeholder="35.00" required />
          </div>
          <div>
            <label class="label" for="adv-extra">Extras ({symbol}) <span class="font-normal text-slate-500">delivery, disposal</span></label>
            <input id="adv-extra" class="input" inputmode="decimal" bind:value={replacementExtras} placeholder="0.00" />
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold">The repair</h2>

        <div>
          <label class="label" for="adv-find">Find the part</label>
          <div class="flex gap-2">
            <input id="adv-find" class="input" bind:value={partQuery} placeholder="e.g. iPhone 12 battery" on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), findParts())} />
            <button type="button" class="btn-secondary shrink-0" on:click={findParts} disabled={finding || partQuery.trim().length < 2}>
              {#if finding}<Loader2 size={16} class="animate-spin" />{:else}<Search size={16} />{/if} Find
            </button>
          </div>
          {#if findError}<p class="mt-2 text-sm text-rose-600" role="alert">{findError}</p>{/if}
          {#if found}
            {#if found.length === 0}
              <p class="mt-2 text-sm text-slate-500">No matching parts found. Type the part in below.</p>
            {:else}
              <ul class="mt-2 divide-y divide-slate-200 rounded-xl ring-1 ring-slate-200">
                {#each found as m}
                  <li class="flex items-center gap-3 p-3">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium truncate">{m.name}</p>
                      <p class="text-xs text-slate-500 truncate">
                        {m.supplier}{#if m.partNumber} · <span class="font-mono">{m.partNumber}</span>{/if}
                        {#if m.price !== null} · <strong>{money(m.price)}</strong>{:else} · read the price on the page{/if}
                      </p>
                    </div>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" class="btn-ghost btn-xs" aria-label="Open {m.name} in a new tab"><LinkIcon size={14} /> Open</a>
                    <button type="button" class="btn-secondary btn-xs" on:click={() => usePart(m)}>Use</button>
                  </li>
                {/each}
              </ul>
              {#if !priceProvider}<p class="mt-2 text-xs text-slate-500">Part names and links come from iFixit, which does not publish prices. Open the link, read the price and type it in.</p>{/if}
            {/if}
          {/if}
        </div>

        <div class="space-y-3">
          {#each parts as row, i}
            <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div class="grid grid-cols-[1fr_5.5rem_4rem] gap-2">
                <input class="input" aria-label="Part {i + 1} name" bind:value={row.name} placeholder="Part name" maxlength="120" />
                <input class="input" aria-label="Part {i + 1} price" inputmode="decimal" bind:value={row.unitPrice} placeholder={symbol} on:input={() => (row.source = 'user')} />
                <input class="input" aria-label="Part {i + 1} quantity" inputmode="numeric" bind:value={row.quantity} placeholder="Qty" />
              </div>
              <div class="mt-2 flex items-center gap-2">
                <input class="input !py-1.5 text-sm" aria-label="Part {i + 1} link" bind:value={row.url} placeholder="Link to where you read the price (optional)" />
                <button type="button" class="btn-ghost btn-xs shrink-0" on:click={() => removeRow(i)} aria-label="Remove part {i + 1}"><Trash2 size={14} /></button>
              </div>
              {#if row.source === 'lookup'}<p class="mt-1 text-xs text-slate-500">Price filled in from a price service. Check it on the page.</p>{/if}
            </div>
          {/each}
          <button type="button" class="btn-ghost btn-sm" on:click={addRow}><Plus size={16} /> Add another part</button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="adv-labour">Paid labour ({symbol})</label>
            <input id="adv-labour" class="input" inputmode="decimal" bind:value={labourCost} placeholder="0.00" />
          </div>
          <div>
            <label class="label" for="adv-tools">Tools to buy ({symbol})</label>
            <input id="adv-tools" class="input" inputmode="decimal" bind:value={toolsCost} placeholder="0.00" />
          </div>
        </div>
        <div>
          <label class="label" for="adv-quote">A repair shop's quote ({symbol}) <span class="font-normal text-slate-500">optional</span></label>
          <input id="adv-quote" class="input" inputmode="decimal" bind:value={professionalQuote} placeholder="Shown as a third option" />
        </div>
        <div>
          <label class="label" for="adv-chance">How likely is the repair to work? <span class="font-semibold text-slate-900">{successPercent}%</span></label>
          <input id="adv-chance" type="range" min="5" max="100" step="5" class="w-full" bind:value={successPercent} />
          <p class="text-xs text-slate-500">If it fails you still end up buying a replacement, and we count that.</p>
        </div>
      </section>

      <details class="group">
        <summary class="cursor-pointer text-sm font-medium text-slate-700">Age and life (optional, gives a cost per year)</summary>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="adv-age">How old is it? (years)</label>
            <input id="adv-age" class="input" inputmode="decimal" bind:value={ageYears} />
          </div>
          <div>
            <label class="label" for="adv-life">How long should one last? (years)</label>
            <input id="adv-life" class="input" inputmode="decimal" bind:value={lifeYears} />
          </div>
        </div>
      </details>

      {#if error}<p class="text-sm text-rose-600" role="alert">{error}</p>{/if}
      <button class="btn-primary btn-lg w-full" type="submit" disabled={!canEstimate}>
        {#if busy}<Loader2 size={18} class="animate-spin" />{:else}<Calculator size={18} />{/if} Compare
      </button>
    </form>

    <!-- ── The answer ──────────────────────────────────────────────────── -->
    <div id="advisor-result" class="space-y-4 lg:sticky lg:top-6">
      {#if !estimate}
        <div class="card p-6 text-slate-500">
          <p class="font-medium text-slate-800">Your comparison will appear here.</p>
          <p class="mt-1 text-sm">Fill in the price of a new one and what the repair needs, then press Compare.</p>
        </div>
      {:else}
        <section class="card p-6 advisor-card" aria-live="polite">
          <span class="badge {VERDICT[estimate.verdict].tone}">{VERDICT[estimate.verdict].label}</span>
          <p class="mt-3 text-xl font-semibold leading-snug">{estimate.headline}</p>

          <div class="mt-5 space-y-3" aria-label="Costs compared">
            {#each estimate.options as o (o.id)}
              <div>
                <div class="flex items-baseline justify-between gap-3 text-sm">
                  <span class="font-medium">{o.label}</span>
                  <span class="tabular-nums"><strong>{money(o.cost)}</strong>{#if o.expectedCost !== o.cost} <span class="text-slate-500">(about {money(o.expectedCost)} allowing for a failed repair)</span>{/if}</span>
                </div>
                <div class="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                  <div class="advisor-bar h-full rounded-full {o.id === 'replace' ? 'bg-slate-400' : 'bg-brand-500'}" style="width:{(o.expectedCost / widest) * 100}%"></div>
                </div>
              </div>
            {/each}
          </div>

          <ul class="mt-5 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
            {#each estimate.reasons as r}<li>{r}</li>{/each}
          </ul>

          <p class="mt-4 text-xs text-slate-500">
            This cafe treats a repair as worthwhile at up to {Math.round(estimate.thresholds.repairShare * 100)}% of the price of a replacement, and a replacement as the better buy above {Math.round(estimate.thresholds.replaceShare * 100)}%.
          </p>

          {#if estimate.perYear}
            <p class="mt-4 text-sm text-slate-600">Per year of use: about <strong>{money(estimate.perYear.repair)}</strong> repaired, <strong>{money(estimate.perYear.replace)}</strong> new.</p>
          {/if}
        </section>

        {#if jobId}
          <section class="card p-5" aria-label="Keep this on the repair">
            {#if saved && upToDate}
              <p class="flex items-center gap-2 text-sm font-medium text-emerald-700"><BookmarkCheck size={18} /> Kept on this repair</p>
              <p class="mt-1 text-sm text-slate-600">Saved by {saved.savedBy.name} on {savedOn(saved.savedAt)}.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <a href={`/repairer/job/${jobId}`} class="btn-secondary btn-sm">Back to the repair</a>
                <button type="button" class="btn-ghost btn-sm" on:click={removeSaved} disabled={saving}>Remove</button>
              </div>
            {:else}
              <p class="text-sm text-slate-700">
                {#if saved}A different comparison is already kept on this repair. Saving replaces it.{:else}Keep this comparison on the repair, so the cafe has a record of the choice.{/if}
              </p>
              <button type="button" class="btn-primary btn-sm mt-3" on:click={save} disabled={saving}>
                {#if saving}<Loader2 size={16} class="animate-spin" />{:else}<Save size={16} />{/if} Save to this repair
              </button>
            {/if}
            {#if saveError}<p class="mt-2 text-sm text-rose-600" role="alert">{saveError}</p>{/if}
          </section>
        {/if}

        <section class="card p-6">
          <h2 class="flex items-center gap-2 text-base font-semibold"><Leaf size={18} class="text-emerald-600" /> Waste a repair avoids</h2>
          {#if estimate.waste.co2eAvoidedKg !== null || estimate.waste.wasteAvoidedKg !== null}
            <dl class="mt-3 grid grid-cols-2 gap-3">
              {#if estimate.waste.co2eAvoidedKg !== null}
                <div><dt class="text-xs text-slate-500">CO₂e avoided</dt><dd class="text-2xl font-semibold tabular-nums">{estimate.waste.co2eAvoidedKg} kg</dd></div>
              {/if}
              {#if estimate.waste.wasteAvoidedKg !== null}
                <div><dt class="text-xs text-slate-500">Kept out of the bin</dt><dd class="text-2xl font-semibold tabular-nums">{estimate.waste.wasteAvoidedKg} kg</dd></div>
              {/if}
            </dl>
            {#if estimate.waste.workings && estimate.waste.workings.preUseCo2eKg !== null}
              <p class="mt-3 text-xs text-slate-500">
                Making a new {estimate.waste.workings.label.toLowerCase()} produces about {estimate.waste.workings.preUseCo2eKg} kg of CO₂e. A repair is counted as displacing {Math.round(estimate.waste.workings.displacementRate * 100)}% of that, the Restart Project's method.
              </p>
            {/if}
          {:else}
            <p class="mt-2 text-sm text-slate-500">Choose what kind of thing it is to see the waste a repair avoids.</p>
          {/if}
        </section>

        {#if estimate.caveats.length}
          <section class="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 text-sm text-amber-900">
            <p class="flex items-center gap-2 font-semibold"><TriangleAlert size={16} /> Worth checking</p>
            <ul class="mt-2 list-disc pl-5 space-y-1">{#each estimate.caveats as c}<li>{c}</li>{/each}</ul>
          </section>
        {/if}
        <p class="text-xs text-slate-500">This is a guide to the figures you entered, not financial advice.</p>
      {/if}
    </div>
  </div>
</div>
