<script lang="ts">
  /**
   * One RepairVision AI diagnosis, as cards: overview, what the photo shows,
   * possible faults, checks to try and safety. Everything in it was written by
   * a language model, so it is shown as plain text only and always labelled
   * as provisional.
   */
  import type { DeviceContext, DiagnosisMeta, DiagnosisResult } from '@circularity/shared';
  import { LIKELIHOOD_LABEL, LIKELIHOOD_TONE, STATUS_LABEL, STATUS_TONE } from '$lib/repairvision';
  import { AlertTriangle, Eye, EyeOff, ListChecks, OctagonAlert, ScanSearch, ShieldAlert, Sparkles } from 'lucide-svelte';

  export let diagnosis: DiagnosisResult;
  export let meta: DiagnosisMeta;
  export let context: DeviceContext;

  // Written out in full so Tailwind finds the class names.
  const COLUMNS: Record<number, string> = { 1: '', 2: 'md:grid-cols-2', 3: 'lg:grid-cols-3' };
</script>

<div class="space-y-4">
  <!-- Safety first, so a stop warning is the first thing anyone reads. -->
  {#if diagnosis.safetyWarnings.length > 0}
    <section class="card p-5 ring-1 ring-rose-300" aria-labelledby="rv-safety">
      <h2 id="rv-safety" class="font-semibold flex items-center gap-2 text-rose-800">
        <ShieldAlert size={18} /> Safety
      </h2>
      <ul class="mt-3 space-y-2">
        {#each diagnosis.safetyWarnings as warning}
          <li class="flex gap-2 rounded-xl p-3 text-sm {warning.severity === 'stop' ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-900'}">
            {#if warning.severity === 'stop'}<OctagonAlert size={18} class="shrink-0 mt-0.5" />{:else}<AlertTriangle size={18} class="shrink-0 mt-0.5" />{/if}
            <div>
              <p class="font-semibold">{warning.severity === 'stop' ? 'Stop' : 'Caution'}</p>
              <p>{warning.message}</p>
              <p class="mt-1 text-xs opacity-75">{warning.source === 'safety_screen' ? 'Flagged by the RepairVision safety screen' : 'Raised by the AI'}</p>
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <!-- ── Device overview ───────────────────────────────────────────── -->
  <section class="card p-5" aria-labelledby="rv-overview">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="eyebrow flex items-center gap-1.5"><Sparkles size={14} /> AI-assisted, unverified</p>
        <h2 id="rv-overview" class="text-xl font-bold mt-1">{diagnosis.device.name}</h2>
        {#if diagnosis.device.category || diagnosis.device.model}
          <p class="text-sm text-slate-600 mt-0.5">
            {[diagnosis.device.category, diagnosis.device.model].filter(Boolean).join(' · ')}
          </p>
        {/if}
      </div>
      <span class="badge {STATUS_TONE[diagnosis.status]} shrink-0">{STATUS_LABEL[diagnosis.status]}</span>
    </div>
    <dl class="mt-4 space-y-3 text-sm">
      <div>
        <dt class="text-slate-500">Reported issue</dt>
        <dd class="text-slate-900 whitespace-pre-line">{context.problem}</dd>
      </div>
      {#if diagnosis.reportedSymptoms.length}
        <div>
          <dt class="text-slate-500">Symptoms as understood</dt>
          <dd>
            <ul class="list-disc pl-5 text-slate-800">
              {#each diagnosis.reportedSymptoms as symptom}<li>{symptom}</li>{/each}
            </ul>
          </dd>
        </div>
      {/if}
      <div>
        <dt class="text-slate-500">AI analysis summary</dt>
        <dd class="text-slate-900">{diagnosis.summary}</dd>
      </div>
    </dl>
    {#if diagnosis.evidenceUpdate}
      <div class="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
        <p class="font-semibold">What changed after your answer</p>
        <p class="mt-1">{diagnosis.evidenceUpdate}</p>
      </div>
    {/if}
  </section>

  <!-- ── Visual observations ───────────────────────────────────────── -->
  <section class="card p-5" aria-labelledby="rv-visual">
    <h2 id="rv-visual" class="font-semibold flex items-center gap-2">
      {#if meta.imageAnalyzed}<Eye size={18} />{:else}<EyeOff size={18} />{/if} Visual observations
    </h2>
    {#if !meta.imageAnalyzed}
      <p class="mt-2 text-sm text-slate-500">No photo was provided, so this analysis is based on the description only.</p>
    {:else if diagnosis.visualObservations.length === 0}
      <p class="mt-2 text-sm text-slate-500">The AI did not report anything specific in the photo.</p>
    {:else}
      <ul class="mt-2 list-disc pl-5 text-sm text-slate-800 space-y-1">
        {#each diagnosis.visualObservations as observation}<li>{observation}</li>{/each}
      </ul>
      <p class="mt-2 text-xs text-slate-500">Only the outside of the device can be seen in a photo. Hidden internal faults cannot be detected this way.</p>
    {/if}
  </section>

  <!-- ── Possible faults ───────────────────────────────────────────── -->
  <section aria-labelledby="rv-faults">
    <h2 id="rv-faults" class="font-semibold flex items-center gap-2 px-1"><ScanSearch size={18} /> Possible faults</h2>
    {#if diagnosis.possibleCauses.length === 0}
      <div class="card p-5 mt-2 text-sm text-slate-500">The AI did not suggest a likely fault for this case.</div>
    {:else}
      <div class="mt-2 grid gap-3 {COLUMNS[diagnosis.possibleCauses.length] ?? COLUMNS[3]}">
        {#each diagnosis.possibleCauses as cause, i}
          <article class="card p-4 flex flex-col">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-semibold leading-snug"><span class="text-slate-400 font-mono text-sm mr-1">{i + 1}.</span>{cause.title}</h3>
            </div>
            <span class="badge {LIKELIHOOD_TONE[cause.likelihood]} mt-2 self-start">{LIKELIHOOD_LABEL[cause.likelihood]}</span>
            {#if cause.reasoning}<p class="mt-2 text-sm text-slate-700">{cause.reasoning}</p>{/if}
            {#if cause.supportingEvidence.length}
              <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Supporting evidence</p>
              <ul class="mt-1 list-disc pl-5 text-sm text-slate-800 space-y-0.5">
                {#each cause.supportingEvidence as e}<li>{e}</li>{/each}
              </ul>
            {/if}
            {#if cause.missingEvidence.length}
              <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Missing or contrary evidence</p>
              <ul class="mt-1 list-disc pl-5 text-sm text-slate-700 space-y-0.5">
                {#each cause.missingEvidence as e}<li>{e}</li>{/each}
              </ul>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <!-- ── Recommended checks ────────────────────────────────────────── -->
  <section class="card p-5" aria-labelledby="rv-checks">
    <h2 id="rv-checks" class="font-semibold flex items-center gap-2"><ListChecks size={18} /> Recommended checks</h2>
    {#if diagnosis.safeChecks.length === 0}
      <p class="mt-2 text-sm text-slate-500">No checks to suggest{diagnosis.status === 'refer_to_professional' ? ': this needs a qualified technician.' : '.'}</p>
    {:else}
      <ol class="mt-3 space-y-3">
        {#each diagnosis.safeChecks as check, i}
          <li class="flex gap-3">
            <span class="h-7 w-7 shrink-0 rounded-full bg-brand-100 text-brand-800 text-sm font-semibold inline-flex items-center justify-center">{i + 1}</span>
            <div class="text-sm">
              <p class="text-slate-900">{check.instruction}</p>
              <p class="text-slate-500 mt-0.5">Why: {check.purpose}</p>
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </section>

  <!-- ── Uncertainty and the provisional label ─────────────────────── -->
  <section class="card p-5 text-sm" aria-labelledby="rv-uncertainty">
    <h2 id="rv-uncertainty" class="font-semibold">How sure is this?</h2>
    <p class="mt-2 text-slate-800">{diagnosis.uncertainty}</p>
    <p class="mt-3 text-slate-500">
      This is a provisional, AI-assisted analysis by {meta.model}, not a confirmed diagnosis. It has not inspected or
      tested the device. Check before acting, and stop if anything feels unsafe.
    </p>
    {#if meta.notices.length}
      <ul class="mt-3 space-y-1 text-xs text-slate-500">
        {#each meta.notices as notice}<li>• {notice}</li>{/each}
      </ul>
    {/if}
  </section>
</div>
