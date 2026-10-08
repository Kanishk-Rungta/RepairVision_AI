<script lang="ts">
  import StaffShell from '$lib/components/StaffShell.svelte';
  import { auth } from '$lib/stores/auth';
  import { ScanSearch, Camera, MessageCircleQuestion } from 'lucide-svelte';
</script>

<svelte:head><title>Your dashboard | RepairVision AI</title></svelte:head>
<StaffShell>
  <div class="max-w-4xl mx-auto px-4 py-10 sm:px-8">
    <p class="kicker">RepairVision AI</p>
    <h1 class="mt-3 text-3xl font-semibold">Welcome, {$auth?.user.displayName || 'there'}</h1>
    <p class="mt-3 text-slate-600">Start with what you can see. We’ll help you narrow down what might be wrong.</p>
    <div class="card p-6 sm:p-8 mt-8">
      <ScanSearch size={32} class="text-brand-500" />
      <h2 class="mt-4 text-2xl font-semibold">Diagnose your device</h2>
      <p class="mt-3 text-slate-600">Upload a photo and describe the symptoms. Get possible causes, safe checks, and one question at a time to help narrow them down.</p>
      <a href="/diagnosis" class="btn-primary mt-6"><ScanSearch size={18} /> Diagnose my device</a>
    </div>
    <div class="grid sm:grid-cols-2 gap-4 mt-6">
      <div class="card p-5"><Camera size={22} /><h2 class="mt-3 font-semibold">Show the problem</h2><p class="mt-2 text-sm text-slate-600">Add a clear photo of the outside of your device. You can also start with symptoms alone.</p></div>
      <div class="card p-5"><MessageCircleQuestion size={22} /><h2 class="mt-3 font-semibold">Follow the evidence</h2><p class="mt-2 text-sm text-slate-600">Answer up to five follow-up questions. Suggestions are provisional; dangerous faults need a qualified technician.</p></div>
    </div>
    <p class="mt-6 text-sm text-slate-500">Diagnosis sessions are not saved. Keep this tab open while answering follow-up questions.</p>
  </div>
</StaffShell>
