<script lang="ts">
  import { cafe } from '$lib/stores/cafe';
  import { Mail, MapPin, Heart } from 'lucide-svelte';

  // Social links are stored as { platform: url }. Capitalise the key for the
  // link text so "facebook" reads as "Facebook".
  function label(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
  $: socials = Object.entries($cafe?.socialLinks ?? {}).filter(([, v]) => Boolean(v));
</script>

<!-- A solid dark block closes the page. Without it the page trails off into
     white and never feels finished. -->
<footer class="bg-brand-900 text-white no-print">
  <div class="max-w-6xl mx-auto px-4 py-14">
    <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <p class="font-display text-xl font-semibold">{$cafe?.name ?? ''}</p>
        {#if $cafe?.tagline}<p class="mt-2 text-white/70">{$cafe.tagline}</p>{/if}
        {#if $cafe?.donateUrl}
          <a
            href={$cafe.donateUrl}
            target="_blank"
            rel="noopener"
            class="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/20"
          >
            <Heart size={16} /> Support us
          </a>
        {/if}
      </div>

      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Visit</p>
        <ul class="mt-4 space-y-2 text-white/80">
          <li><a class="hover:text-white" href="/events">Events</a></li>
          <li><a class="hover:text-white" href="/skills">Skills &amp; team</a></li>
          <li><a class="hover:text-white" href="/guides">Repair guides</a></li>
          <li><a class="hover:text-white" href="/world">Repair Cafés worldwide</a></li>
          <li><a class="hover:text-white" href="/about">About &amp; how we measure</a></li>
          <li><a class="hover:text-white" href="/contact">Contact</a></li>
        </ul>
      </div>

      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Get in touch</p>
        <ul class="mt-4 space-y-2 text-white/80">
          {#if $cafe?.contactEmail}
            <li>
              <a class="inline-flex items-start gap-2 hover:text-white" href="mailto:{$cafe.contactEmail}">
                <Mail size={16} class="shrink-0 mt-0.5" /> <span class="break-all">{$cafe.contactEmail}</span>
              </a>
            </li>
          {/if}
          {#if $cafe?.address}
            <li class="inline-flex items-start gap-2">
              <MapPin size={16} class="shrink-0 mt-0.5" /> <span>{$cafe.address}</span>
            </li>
          {/if}
          {#if socials.length > 0}
            <li class="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {#each socials as [k, v]}
                <a class="hover:text-white underline underline-offset-2" href={v} target="_blank" rel="noopener">{label(k)}</a>
              {/each}
            </li>
          {/if}
          {#if !$cafe?.contactEmail && !$cafe?.address && socials.length === 0}
            <li><a class="hover:text-white underline underline-offset-2" href="/contact">Send us a message</a></li>
          {/if}
        </ul>
      </div>
    </div>

  </div>
</footer>
