<script lang="ts">
  // The advisor for everyone, signed in or not, in the public site's own frame.
  // Saving to a repair is staff-only and lives on /advisor.
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import RepairAdvisor from '$lib/components/RepairAdvisor.svelte';
</script>

<SiteHeader variant="public" />
<main class="max-w-6xl mx-auto px-4 py-10 md:py-14">
  <RepairAdvisor publicMode />
</main>
<SiteFooter />
