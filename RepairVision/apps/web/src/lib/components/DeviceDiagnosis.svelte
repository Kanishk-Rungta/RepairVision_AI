<script lang="ts">
  // RepairVision AI Diagnosis. Describe a device (and add a photo if there is
  // one), get a provisional diagnosis from Gemma 4, then answer its questions
  // one at a time, up to five, each answer updating the diagnosis.
  //
  // The whole session lives in this page. Nothing is saved, and nothing here
  // changes a repair record: opening it from a repair (?job=<id>) only fills
  // in the form.
  import { onDestroy, onMount } from 'svelte';
  export let allowJobPrefill = false;
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import DiagnosisReport from '$lib/components/DiagnosisReport.svelte';
  import {
    analyze,
    errorMessage,
    followup,
    getStatus,
    preparePhoto,
    type RepairVisionStatus,
  } from '$lib/repairvision';
  import { REPAIRVISION_LIMITS, type DeviceContext, type DiagnosisResponse, type QaTurn } from '@circularity/shared';
  import {
    ArrowLeft,
    Camera,
    ImagePlus,
    Loader2,
    MessageCircleQuestion,
    RotateCcw,
    ScanSearch,
    Sparkles,
    X,
  } from 'lucide-svelte';

  // ── Setup ──────────────────────────────────────────────────────────────
  let status: RepairVisionStatus | null = null;

  // ── The form ───────────────────────────────────────────────────────────
  let deviceName = '';
  let manufacturer = '';
  let model = '';
  let problem = '';
  let photo: Blob | null = null;
  let photoUrl: string | null = null;
  let photoBusy = false;
  let photoError = '';
  let fileInput: HTMLInputElement;
  let cameraInput: HTMLInputElement;
  let linkedJob: { id: string; jobNumber: string } | null = null;

  // ── The session ────────────────────────────────────────────────────────
  /** The case as it was analysed, kept fixed for the follow-ups. */
  let context: DeviceContext | null = null;
  let current: DiagnosisResponse | null = null;
  /** Questions answered so far, oldest first. */
  let history: QaTurn[] = [];
  let analyzing = false;
  let analyzeError = '';
  let answering = false;
  let followupError = '';
  let chosenOption: string | null = null;
  let otherAnswer = '';

  $: answer = (chosenOption === '__other' ? otherAnswer : chosenOption ?? '').trim();
  $: question = current?.diagnosis.nextQuestion ?? null;
  $: roundsLeft = REPAIRVISION_LIMITS.maxRounds - history.length;
  $: canAnalyze = deviceName.trim().length >= 2 && problem.trim().length >= 5 && !analyzing && !photoBusy;

  onMount(async () => {
    try {
      status = await getStatus();
    } catch {
      status = null;
    }
    const jobId = $page.url.searchParams.get('job');
    if (allowJobPrefill && jobId) await prefillFromJob(jobId);
  });

  onDestroy(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });

  /** Fill the form from a repair the volunteer can already see. */
  async function prefillFromJob(id: string) {
    try {
      const detail = await api<{
        job: { id: string; jobNumber: string; itemDescription: string; itemBrand: string | null; faultDescription: string };
        images: Array<{ filePath: string; stage: string }>;
      }>(`/api/repairer/jobs/${encodeURIComponent(id)}`);
      linkedJob = { id: detail.job.id, jobNumber: detail.job.jobNumber };
      deviceName = detail.job.itemDescription ?? '';
      manufacturer = detail.job.itemBrand ?? '';
      problem = detail.job.faultDescription ?? '';
      const image = detail.images.find((i) => i.stage === 'check_in') ?? detail.images[0];
      if (image) {
        const res = await fetch(`/uploads/${image.filePath}`, { credentials: 'include' });
        if (res.ok) await setPhoto(await res.blob());
      }
    } catch {
      // The form simply stays empty; nothing about the repair is changed.
    }
  }

  async function setPhoto(file: Blob) {
    photoError = '';
    photoBusy = true;
    try {
      const prepared = await preparePhoto(file);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photo = prepared;
      photoUrl = URL.createObjectURL(prepared);
    } catch (err) {
      photoError = (err as Error).message;
    } finally {
      photoBusy = false;
    }
  }

  function onPick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void setPhoto(file);
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photo = null;
    photoUrl = null;
    photoError = '';
  }

  async function runAnalysis() {
    if (!canAnalyze) return;
    analyzeError = '';
    analyzing = true;
    const ctx: DeviceContext = {
      deviceName: deviceName.trim(),
      manufacturer: manufacturer.trim() || null,
      model: model.trim() || null,
      problem: problem.trim(),
    };
    try {
      current = await analyze(ctx, photo);
      context = ctx;
      history = [];
      chosenOption = null;
      otherAnswer = '';
      followupError = '';
    } catch (err) {
      analyzeError = errorMessage(err);
    } finally {
      analyzing = false;
    }
  }

  async function continueDiagnosis() {
    if (!current || !context || !question || !answer || answering) return;
    followupError = '';
    answering = true;
    try {
      const next = await followup({
        context,
        imageAnalyzed: current.meta.imageAnalyzed,
        previous: current.diagnosis,
        history,
        question: question.question,
        answer,
      });
      history = [...history, { question: question.question, answer }];
      current = next;
      chosenOption = null;
      otherAnswer = '';
    } catch (err) {
      followupError = errorMessage(err);
    } finally {
      answering = false;
    }
  }

  function restart() {
    removePhoto();
    deviceName = '';
    manufacturer = '';
    model = '';
    problem = '';
    linkedJob = null;
    context = null;
    current = null;
    history = [];
    analyzeError = '';
    followupError = '';
    chosenOption = null;
    otherAnswer = '';
  }
</script>

<svelte:head><title>AI Diagnosis</title></svelte:head>

<div class="max-w-6xl mx-auto">
  {#if linkedJob}
    <a href={`/repairer/job/${linkedJob.id}`} class="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-3">
      <ArrowLeft size={16} /> Back to repair {linkedJob.jobNumber}
    </a>
  {/if}

  <header class="mb-4">
    <p class="eyebrow flex items-center gap-1.5"><Sparkles size={14} /> RepairVision AI</p>
    <h1 class="text-2xl font-bold mt-1">AI Diagnosis</h1>
    <p class="text-slate-600 mt-1 max-w-2xl">
      Describe a faulty device, add a photo if you have one, and Gemma 4 suggests possible faults, safe checks and a
      question to narrow it down. Its answers are provisional and must be checked by a person.
    </p>
  </header>

  {#if status && !status.configured}
    <div class="card p-4 mb-4 bg-amber-50 text-amber-900 text-sm" role="status">
      AI diagnosis is not set up on this hub yet. An admin needs to add the <code class="font-mono">GEMINI_API_KEY</code> secret
      to the Worker (see <span class="font-mono">docs/repairvision-ai.md</span>).
    </div>
  {/if}

  <div class="grid lg:grid-cols-5 gap-4 items-start">
    <!-- ── Left: the case and the conversation ──────────────────────── -->
    <div class="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
      {#if !current}
        <form class="card p-5 space-y-4" on:submit|preventDefault={runAnalysis}>
          <h2 class="font-semibold">Device information</h2>
          {#if linkedJob}
            <p class="text-xs text-slate-500">Filled in from repair {linkedJob.jobNumber}. The repair itself is not changed.</p>
          {/if}
          <div>
            <label class="label" for="rv-device">Device type or name</label>
            <input id="rv-device" class="input" bind:value={deviceName} maxlength="120" placeholder="e.g. Wired USB mouse" required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label" for="rv-make">Manufacturer <span class="font-normal text-slate-400">(optional)</span></label>
              <input id="rv-make" class="input" bind:value={manufacturer} maxlength="120" />
            </div>
            <div>
              <label class="label" for="rv-model">Model <span class="font-normal text-slate-400">(optional)</span></label>
              <input id="rv-model" class="input" bind:value={model} maxlength="120" />
            </div>
          </div>
          <div>
            <label class="label" for="rv-problem">What is wrong?</label>
            <textarea
              id="rv-problem"
              class="input"
              rows="4"
              bind:value={problem}
              maxlength="2000"
              placeholder="e.g. The mouse disconnects whenever I move the USB cable."
              required
            ></textarea>
          </div>

          <div>
            <span class="label">Photo <span class="font-normal text-slate-400">(optional)</span></span>
            {#if photoUrl}
              <div class="relative mt-1">
                <img src={photoUrl} alt="The device to diagnose" class="w-full max-h-64 object-contain rounded-xl bg-slate-100 ring-1 ring-slate-200" />
                <div class="mt-2 flex gap-2">
                  <button type="button" class="btn-secondary btn-sm" on:click={() => fileInput.click()}>Replace</button>
                  <button type="button" class="btn-ghost btn-sm" on:click={removePhoto}><X size={14} /> Remove</button>
                </div>
              </div>
            {:else}
              <div class="mt-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                {#if photoBusy}
                  <p class="text-sm text-slate-600 inline-flex items-center gap-2"><Loader2 size={16} class="animate-spin" /> Preparing photo…</p>
                {:else}
                  <div class="flex flex-wrap justify-center gap-2">
                    <button type="button" class="btn-secondary btn-sm" on:click={() => fileInput.click()}><ImagePlus size={16} /> Upload a photo</button>
                    <button type="button" class="btn-secondary btn-sm" on:click={() => cameraInput.click()}><Camera size={16} /> Take a photo</button>
                  </div>
                  <p class="mt-2 text-xs text-slate-500">JPEG, PNG or WebP. Without a photo the analysis uses the description only.</p>
                {/if}
              </div>
            {/if}
            <input bind:this={fileInput} class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" on:change={onPick} />
            <input bind:this={cameraInput} class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" on:change={onPick} />
            {#if photoError}<p class="mt-2 text-sm text-rose-700">{photoError}</p>{/if}
          </div>

          {#if analyzeError}
            <div class="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">
              <p>{analyzeError}</p>
              <button type="button" class="mt-2 underline underline-offset-2" on:click={runAnalysis} disabled={!canAnalyze}>Try again</button>
            </div>
          {/if}

          <button type="submit" class="btn-primary w-full" disabled={!canAnalyze}>
            {#if analyzing}<Loader2 size={18} class="animate-spin" /> Analysing…{:else}<ScanSearch size={18} /> Analyze Device{/if}
          </button>
        </form>
      {:else if context}
        <section class="card p-5 text-sm">
          <div class="flex items-start gap-3">
            {#if photoUrl}<img src={photoUrl} alt="" class="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200 shrink-0" />{/if}
            <div class="min-w-0">
              <p class="font-semibold text-slate-900">{context.deviceName}</p>
              {#if context.manufacturer || context.model}
                <p class="text-slate-600">{[context.manufacturer, context.model].filter(Boolean).join(' · ')}</p>
              {/if}
              <p class="mt-1 text-slate-700 line-clamp-3">{context.problem}</p>
            </div>
          </div>
          <button type="button" class="btn-ghost btn-sm mt-3" on:click={restart}><RotateCcw size={14} /> Restart diagnosis</button>
        </section>

        <!-- ── Guided troubleshooting ─────────────────────────────── -->
        <section class="card p-5" aria-labelledby="rv-guided">
          <h2 id="rv-guided" class="font-semibold flex items-center gap-2"><MessageCircleQuestion size={18} /> Guided troubleshooting</h2>

          {#if history.length}
            <ol class="mt-3 space-y-2 text-sm">
              {#each history as turn, i}
                <li class="rounded-xl bg-slate-50 p-3">
                  <p class="text-slate-500 text-xs">Question {i + 1}</p>
                  <p class="text-slate-800">{turn.question}</p>
                  <p class="mt-1 text-slate-900"><span class="text-slate-500">Answer:</span> {turn.answer}</p>
                </li>
              {/each}
            </ol>
          {/if}

          {#if question}
            <form class="mt-4 space-y-3" on:submit|preventDefault={continueDiagnosis}>
              <fieldset disabled={answering}>
                <legend class="font-medium text-slate-900">{question.question}</legend>
                <div class="mt-2 grid gap-2">
                  {#each question.options as option}
                    <label class="flex items-center gap-2 rounded-xl p-3 ring-1 cursor-pointer {chosenOption === option ? 'ring-2 ring-brand-500 bg-brand-50' : 'ring-slate-200 hover:bg-slate-50'}">
                      <input type="radio" name="rv-answer" value={option} bind:group={chosenOption} />
                      <span class="text-sm">{option}</span>
                    </label>
                  {/each}
                  <label class="flex items-center gap-2 rounded-xl p-3 ring-1 cursor-pointer {chosenOption === '__other' ? 'ring-2 ring-brand-500 bg-brand-50' : 'ring-slate-200 hover:bg-slate-50'}">
                    <input type="radio" name="rv-answer" value="__other" bind:group={chosenOption} />
                    <span class="text-sm">Something else</span>
                  </label>
                  {#if chosenOption === '__other'}
                    <textarea class="input" rows="2" maxlength="1000" bind:value={otherAnswer} placeholder="Describe what you observed"></textarea>
                  {/if}
                </div>
              </fieldset>
              {#if followupError}
                <div class="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                  <p>{followupError}</p>
                  <button type="button" class="mt-2 underline underline-offset-2" on:click={continueDiagnosis}>Try again</button>
                </div>
              {/if}
              <button type="submit" class="btn-primary w-full" disabled={!answer || answering}>
                {#if answering}<Loader2 size={18} class="animate-spin" /> Updating diagnosis…{:else}Continue Diagnosis{/if}
              </button>
              <p class="text-xs text-slate-500">{roundsLeft} of {REPAIRVISION_LIMITS.maxRounds} questions left.</p>
            </form>
          {:else}
            <p class="mt-3 text-sm text-slate-600">
              {#if current.diagnosis.status === 'refer_to_professional'}
                Guided troubleshooting has stopped. This device should be assessed by a qualified technician.
              {:else if history.length >= REPAIRVISION_LIMITS.maxRounds}
                You have answered all {REPAIRVISION_LIMITS.maxRounds} questions. Use the checks to confirm the fault in person.
              {:else}
                No further question would help right now. Work through the recommended checks.
              {/if}
            </p>
            <button type="button" class="btn-secondary w-full mt-3" on:click={restart}><RotateCcw size={16} /> Diagnose another device</button>
          {/if}
        </section>
      {/if}
    </div>

    <!-- ── Right: the diagnosis ─────────────────────────────────────── -->
    <div class="lg:col-span-3" aria-live="polite" aria-busy={analyzing || answering}>
      {#if analyzing}
        <div class="card p-8 text-center">
          <Loader2 size={28} class="mx-auto animate-spin text-brand-500" />
          <p class="mt-3 font-semibold">Gemma is analysing the device…</p>
          <p class="mt-1 text-sm text-slate-500">Reading the description{photo ? ' and the photo' : ''}, weighing possible faults. This can take up to a minute.</p>
        </div>
      {:else if current && context}
        <div class="relative">
          {#if answering}
            <div class="absolute inset-0 z-10 rounded-2xl bg-canvas/70 backdrop-blur-sm flex items-start justify-center pt-24">
              <p class="card px-4 py-3 text-sm inline-flex items-center gap-2"><Loader2 size={16} class="animate-spin" /> Re-evaluating with your answer…</p>
            </div>
          {/if}
          {#if current.meta.round > 0}
            <p class="text-xs text-slate-500 mb-2 px-1">Updated after answer {current.meta.round} of {current.meta.maxRounds}</p>
          {/if}
          <DiagnosisReport diagnosis={current.diagnosis} meta={current.meta} {context} />
        </div>
      {:else}
        <div class="card p-8 text-center text-slate-500">
          <ScanSearch size={32} class="mx-auto text-slate-400" />
          <p class="mt-3">The diagnosis appears here.</p>
          <p class="mt-1 text-sm">Works best for low-voltage devices such as USB peripherals, keyboards, mice and headphones.</p>
        </div>
      {/if}
    </div>
  </div>
</div>
