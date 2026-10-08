<script lang="ts">
  import { cafe } from '$lib/stores/cafe';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import VolunteerCard from '$lib/components/VolunteerCard.svelte';
  import NextSessionCta from '$lib/components/NextSessionCta.svelte';
  import AddToCalendar from '$lib/components/AddToCalendar.svelte';
  import PhotoGrid from '$lib/components/PhotoGrid.svelte';
  import LocalCafeMap from '$lib/components/LocalCafeMap.svelte';
  import { formatDistance, repairCafeOrgUrl, type LocalCafe } from '$lib/localCafes';
  import { Calendar, Clock, MapPin, ChevronDown, CheckCircle2, Laptop, ArrowRight, QrCode, Wrench, PackageCheck } from 'lucide-svelte';
  import Icon from '@iconify/svelte';
  import { categoryIcon, categoryTint, categoryInk } from '$lib/categoryIcon';
  import type { PageData } from './$types';

  interface PublicEvent {
    id: string;
    name: string;
    description: string | null;
    date: string;
    startTime: string;
    endTime: string;
    /** Linux help is on offer at this session as well as ordinary repairs. */
    supportsLinux?: boolean;
    venue: { name: string; address: string | null; postcode: string | null };
  }
  interface SkillCategory { id: string; name: string; icon: string; colour: string; repairerCount: number }
  interface PublicStats {
    eventCount: number;
    repairCount: number;
    completedCount: number;
    successRate: number;
    co2SavedKg: number;
    volunteerCount: number;
  }
  interface Repairer { id: string; displayName: string; avatarUrl: string | null; bio: string | null; skills: string[]; joinDate: string | null; showOnHomePage?: boolean }

  let upcomingEvents: PublicEvent[] = [];
  let categories: SkillCategory[] = [];
  let repairers: Repairer[] = [];
  let openFaq = -1;

  export let data: PageData;
  $: upcomingEvents = (data.upcomingEvents ?? []) as PublicEvent[];
  $: categories = (data.categories ?? []) as SkillCategory[];
  $: repairers = (data.repairers ?? []) as Repairer[];
  $: stats = (data.stats ?? null) as PublicStats | null;

  // How much of each long list the home page shows before it hands off to the
  // full page. Each number fills its grid exactly, so no row is left ragged.
  const DATE_PREVIEW = 4;   // 4 across on desktop, 2 across on mobile
  const PHOTO_PREVIEW = 8;  // 2 rows of 4, or 4 rows of 2
  const TEAM_PREVIEW = 6;   // 2 rows of 3
  const BADGE_PREVIEW = 4;  // skills shown on a team card before "+n more"

  // A short form for the hero, where the full date is too long on a phone.
  function formatDateShort(d: string): string {
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  }
  // Split a date into the pieces a calendar tile needs (day number, short
  // month, weekday name). Anchored at UTC noon + a fixed locale so the server
  // and client render identical text (no hydration mismatch).
  function dateParts(d: string) {
    const dt = new Date(d + 'T12:00:00Z');
    return {
      day: dt.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'UTC' }),
      monthShort: dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
      weekdayLong: dt.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' }),
    };
  }

  // Keep a value on one line by swapping its spaces for non-breaking ones.
  // Used for postcodes, which look wrong when a line break splits them.
  function noWrap(s: string): string {
    return s.replace(/\s+/g, ' ');
  }

  // Is the next session today? Then the hero says so, with a live dot.
  function isToday(d: string): boolean {
    const now = new Date();
    const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return d === local;
  }

  // The same homeVenue is shown for most "When & where" sections.
  $: homeVenue = upcomingEvents[0]?.venue ?? null;
  $: nextEvent = upcomingEvents[0] ?? null;
  // When every upcoming event shares one name (the common case for a regular
  // monthly cafe) we hide the repetitive label on the date tiles; if some
  // events are specially named we surface those names instead.
  $: uniformEventName = upcomingEvents.length > 0 && upcomingEvents.every((e) => e.name === upcomingEvents[0]!.name);
  $: hp = $cafe?.homePage ?? {};
  $: gallery = $cafe?.gallery ?? [];
  $: cafeName = $cafe?.name ?? 'Repair Café';

  // Volunteers featured in the "Meet our team" strip — anyone whose admin
  // (or self-edit) has opted in. The field defaults to true server-side, so
  // existing volunteers keep showing until someone explicitly opts them out.
  $: homeRepairers = repairers.filter((r) => r.showOnHomePage !== false);

  // ── "Our numbers" ─────────────────────────────────────────────────────────
  // Off unless the cafe turns it on in Settings. Each figure is dropped when
  // it is still zero, so a cafe that has just started never shows a row of
  // noughts, and the band itself disappears if nothing is worth showing yet.
  $: showStats = hp.showStats === true && stats !== null;
  $: statTiles = !stats
    ? []
    : [
        { value: stats.completedCount.toLocaleString('en-GB'), label: 'Repairs done', show: stats.completedCount > 0 },
        // Same figure the admin stats page reports as "CO₂ saved" (the
        // environmental_saving_kg a repairer records on a finished job), so
        // the public number and the internal one always agree.
        { value: `${stats.co2SavedKg.toLocaleString('en-GB')} kg`, label: 'CO₂ saved', show: stats.co2SavedKg > 0 },
        { value: stats.volunteerCount.toLocaleString('en-GB'), label: 'Volunteers', show: stats.volunteerCount > 0 },
        { value: stats.eventCount.toLocaleString('en-GB'), label: 'Sessions held', show: stats.eventCount > 0 },
      ].filter((t) => t.show);

  // The closing band sits on a real photo of a session. Nothing else does:
  // an image behind a heavy wash adds noise rather than atmosphere, so the
  // hero is a flat block of the cafe's own colour instead.
  $: closingImage = gallery.length > 0 ? gallery[gallery.length - 1]!.url : null;

  // "What to bring" can be free prose or a bullet list. We split on lines
  // starting with -, *, • or a number (e.g. "1."). If most non-empty lines
  // look like bullets we render a checklist; otherwise we render paragraphs.
  function parseBringList(body: string): { items: string[]; isList: boolean; paragraphs: string[] } {
    const lines = (body ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const bulletRe = /^(?:[-*•]|\d+[.)])\s+(.+)$/;
    const items: string[] = [];
    let bulletCount = 0;
    for (const l of lines) {
      const m = l.match(bulletRe);
      if (m) { items.push(m[1]!.trim()); bulletCount++; }
      else items.push(l);
    }
    const isList = bulletCount >= 2 && bulletCount >= lines.length - 1;
    const paragraphs = (body ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return { items, isList, paragraphs };
  }
  $: bring = parseBringList(hp.whatToBring?.body ?? '');

  // Split the intro body into paragraphs on blank lines so the first one can
  // be rendered as a larger "lead" and subsequent ones as supporting text.
  $: introParagraphs = (hp.intro?.body ?? '')
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  // Photos from a session say where and when they were taken, so the gallery
  // lede can promise something the strip actually delivers.
  $: galleryHasSessions = gallery.some((g) => g.eventId);

  // ── Linux Repair Cafe ─────────────────────────────────────────────────────
  // Only for cafes that offer it. The wording is the admin's, with a sensible
  // fallback so the card still reads properly if they clear a field.
  $: linuxEnabled = $cafe?.linuxEnabled === true;
  $: linuxCard = $cafe?.linuxPage?.homeCard ?? {};
  $: linuxHeading = linuxCard.heading?.trim() || 'We are a Linux Repair Cafe';
  $: linuxBody =
    linuxCard.body?.trim() ||
    'Is your computer too old for Windows 11? We can put Linux on it instead, for free. ' +
      'It keeps working, it keeps getting updates, and it stays out of the bin.';
  $: linuxCta = linuxCard.ctaLabel?.trim() || 'Find out about Linux';
  // The soonest session where Linux help is on offer, so the card can give a
  // date rather than only an explanation.
  $: nextLinuxEvent = upcomingEvents.find((e) => e.supportsLinux) ?? null;

  // ── Repair Cafes near us ──────────────────────────────────────────────────
  // Only appears when an admin has picked some under Settings, Local cafes.
  $: localCafes = ((data.localCafes?.cafes ?? []) as LocalCafe[]);
  $: localOurs = (data.localCafes?.ours ?? null) as LocalCafe | null;
  let selectedLocalSlug: string | null = null;

  /** Clicking a pin picks that cafe out in the list, and brings it into view. */
  function pickLocalCafe(slug: string | null) {
    selectedLocalSlug = slug;
    if (!slug || typeof document === 'undefined') return;
    document.getElementById(`local-cafe-${slug}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
</script>

<SiteHeader variant="public" />

<main>
  <!-- ───────────────────────── Hero ─────────────────────────
       Two jobs, side by side: who we are on the left, and the one thing most
       visitors came for on the right — when the next session is. The session
       card is drawn as a ticket, because a visit here is a ticket: you check
       an item in, it gets a number, you collect it fixed. -->
  <section class="hero-bg">
    <div class="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
      <div class="animate-fade-up">
        {#if nextEvent}
          <a href="#when" class="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[13px] text-slate-600 ring-1 ring-white/10 hover:text-slate-900 hover:bg-white/[0.07] transition-colors">
            <span class="relative flex h-2 w-2">
              {#if isToday(nextEvent.date)}<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden"></span>{/if}
              <span class="relative inline-flex h-2 w-2 rounded-full {isToday(nextEvent.date) ? 'bg-emerald-500' : 'bg-brand-500'}"></span>
            </span>
            {isToday(nextEvent.date) ? 'Open today' : 'Next session'} · {formatDateShort(nextEvent.date)}
            <ArrowRight size={14} class="opacity-60" />
          </a>
        {:else}
          <span class="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[13px] text-slate-600 ring-1 ring-white/10">
            <span class="h-2 w-2 rounded-full bg-brand-500"></span> Community repair café
          </span>
        {/if}

        <h1 class="mt-6 text-gradient text-[44px] leading-[1.02] sm:text-6xl md:text-7xl font-semibold tracking-[-0.045em]">{cafeName}</h1>
        {#if $cafe?.tagline}
          <p class="mt-5 text-xl md:text-2xl font-medium tracking-[-0.015em] text-slate-800">{$cafe.tagline}</p>
        {/if}
        {#if !$cafe?.tagline && !$cafe?.description}
          <p class="mt-5 max-w-xl text-lg md:text-xl leading-relaxed text-slate-500">Bring something broken. Our volunteers will help you work out what is wrong, and fix it together.</p>
        {/if}
        {#if $cafe?.description}
          <p class="mt-3 max-w-xl text-base md:text-lg leading-relaxed text-slate-500">{$cafe.description}</p>
        {/if}

        <div class="mt-9 flex flex-col sm:flex-row gap-3">
          <a href="/diagnosis" class="btn-primary btn-lg"><Wrench size={18} /> Diagnose my device</a>
          <a href={upcomingEvents.length > 0 ? '#when' : '/events'} class="btn-primary btn-lg">
            <Calendar size={18} /> See upcoming sessions
          </a>
          <a href={categories.length > 0 ? '#repair' : '/skills'} class="btn-secondary btn-lg">What we repair</a>
        </div>
      </div>

      <!-- The ticket. -->
      <div class="animate-fade-up [animation-delay:80ms] w-full max-w-md lg:max-w-none mx-auto">
        <div class="ticket-top rounded-t-3xl bg-surface/90 ring-1 ring-white/[0.08] backdrop-blur-xl px-6 pt-6 pb-7 sm:px-8 sm:pt-8">
          <div class="flex items-center justify-between">
            <p class="kicker">Next session</p>
            {#if nextEvent}
              <span class="badge {isToday(nextEvent.date) ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-100 text-brand-800'}">
                {isToday(nextEvent.date) ? 'Today' : 'Upcoming'}
              </span>
            {/if}
          </div>
          {#if nextEvent}
            {@const p = dateParts(nextEvent.date)}
            <div class="mt-5 flex items-end gap-5">
              <span class="text-7xl font-semibold leading-[0.8] tracking-[-0.05em] text-slate-950 tabular-nums">{p.day}</span>
              <div class="pb-0.5">
                <p class="text-lg font-semibold text-slate-900 leading-tight">{p.weekdayLong}</p>
                <p class="text-slate-500">{p.monthShort} · <span class="font-mono text-[15px]">{nextEvent.startTime.slice(0,5)}–{nextEvent.endTime.slice(0,5)}</span></p>
              </div>
            </div>
            {#if homeVenue}
              <p class="mt-6 flex items-start gap-2 text-slate-700">
                <MapPin size={18} class="shrink-0 mt-0.5 text-brand-500" />
                <span>
                  <span class="font-medium text-slate-900">{homeVenue.name}</span>
                  {#if homeVenue.address || homeVenue.postcode}
                    <span class="block text-sm text-slate-500">{homeVenue.address ?? ''}{#if homeVenue.address && homeVenue.postcode}{', '}{/if}{#if homeVenue.postcode}{noWrap(homeVenue.postcode)}{/if}</span>
                  {/if}
                </span>
              </p>
            {/if}
          {:else}
            <p class="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Dates coming soon</p>
            <p class="mt-2 text-slate-500">We are planning the next session. Check back soon, or get in touch.</p>
          {/if}
        </div>
        <div class="ticket-bottom rounded-b-3xl bg-surface/90 ring-1 ring-white/[0.08] backdrop-blur-xl px-6 pt-6 pb-6 sm:px-8">
          <ol class="grid grid-cols-3 gap-3 text-center">
            <li class="flex flex-col items-center gap-2">
              <span class="icon-chip !h-10 !w-10"><QrCode size={18} /></span>
              <span class="text-[13px] text-slate-600 leading-tight">Check in</span>
            </li>
            <li class="flex flex-col items-center gap-2">
              <span class="icon-chip !h-10 !w-10"><Wrench size={18} /></span>
              <span class="text-[13px] text-slate-600 leading-tight">Repair together</span>
            </li>
            <li class="flex flex-col items-center gap-2">
              <span class="icon-chip !h-10 !w-10"><PackageCheck size={18} /></span>
              <span class="text-[13px] text-slate-600 leading-tight">Take it home</span>
            </li>
          </ol>
          <div class="mt-6 flex gap-2">
            {#if nextEvent}
              <AddToCalendar event={nextEvent} variant="button" class="flex-1 btn-sm" />
              <a href="/events/{nextEvent.id}" class="btn-ghost btn-sm">Details <ArrowRight size={15} /></a>
            {:else}
              <a href="/contact" class="btn-secondary btn-sm flex-1">Get in touch</a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ──────────────────── Our numbers ───────────────────────── -->
  {#if showStats && statTiles.length > 0}
    <section class="border-b border-slate-200 bg-surface/40">
      <dl class="max-w-6xl mx-auto px-4 grid grid-cols-2 {statTiles.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}">
        {#each statTiles as tile, i}
          <div class="py-8 md:py-10 px-2 md:px-6 {i % 2 === 1 ? 'border-l' : ''} {i > 0 ? 'md:border-l' : ''} {i >= 2 ? 'border-t md:border-t-0' : ''} border-slate-200">
            <dt class="kicker">{tile.label}</dt>
            <dd class="mt-2 text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-950 tabular-nums">{tile.value}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  <!-- ──────────────── Intro / "What & Who" ───────────────── -->
  {#if hp.intro?.body || hp.intro?.heading}
    <section class="section">
      <div class="grid lg:grid-cols-[1fr_1.4fr] gap-6 lg:gap-16">
        <div>
          <p class="eyebrow">About us</p>
          {#if hp.intro?.heading}
            <h2 class="section-title mt-3">{hp.intro.heading}</h2>
          {/if}
        </div>
        {#if introParagraphs.length > 0}
          <div class="lg:pt-8">
            <p class="text-lg md:text-xl leading-relaxed text-slate-800 whitespace-pre-line">{introParagraphs[0]}</p>
            {#each introParagraphs.slice(1) as p}
              <p class="mt-4 text-base md:text-lg leading-relaxed text-slate-500 whitespace-pre-line">{p}</p>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- ──────────────── How it works ─────────────────────── -->
  {#if Array.isArray(hp.howItWorks) && hp.howItWorks.length > 0}
    <section class="band">
      <div class="section">
        <div class="max-w-2xl">
          <p class="eyebrow">Your visit</p>
          <h2 class="section-title mt-3">How it works</h2>
        </div>
        <ol class="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {#each hp.howItWorks as step, i}
            <li class="card p-6">
              <span class="font-mono text-xs text-brand-400">Step {i + 1}</span>
              <h3 class="mt-3 !text-lg font-semibold text-pine">{step.title}</h3>
              <p class="mt-2 text-[15px] leading-relaxed text-slate-500 whitespace-pre-line">{step.body}</p>
            </li>
          {/each}
        </ol>
      </div>
    </section>
  {/if}

  <!-- ──────────────────── When & where ──────────────────────── -->
  {#if upcomingEvents.length > 0}
    <section id="when" class="section scroll-mt-20">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p class="eyebrow">Mark your calendar</p>
          <h2 class="section-title mt-3">When &amp; where</h2>
        </div>
        <a href="/events" class="btn-secondary btn-sm self-start md:self-auto">Full schedule <ArrowRight size={15} /></a>
      </div>

      <ul class="mt-10 card divide-y divide-slate-200 overflow-hidden">
        {#each upcomingEvents.slice(0, DATE_PREVIEW) as e, i}
          {@const p = dateParts(e.date)}
          <li class="flex items-center gap-4 sm:gap-6 px-4 py-4 sm:px-6 sm:py-5 transition-colors hover:bg-white/[0.02]">
            <div class="w-12 shrink-0 text-center">
              <div class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-400">{p.monthShort}</div>
              <div class="text-2xl font-semibold leading-tight text-slate-950 tabular-nums">{p.day}</div>
            </div>
            <a href="/events/{e.id}" class="min-w-0 flex-1 group">
              <p class="font-medium text-slate-900 group-hover:text-slate-950 truncate">
                {uniformEventName ? p.weekdayLong : e.name}
                {#if i === 0}<span class="badge bg-brand-100 text-brand-800 ml-2 align-middle">Next</span>{/if}
              </p>
              <p class="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span class="inline-flex items-center gap-1.5"><Clock size={14} /> <span class="font-mono">{e.startTime.slice(0,5)}–{e.endTime.slice(0,5)}</span></span>
                <span class="inline-flex items-center gap-1.5 min-w-0"><MapPin size={14} class="shrink-0" /> <span class="truncate">{e.venue.name}</span></span>
              </p>
            </a>
            <AddToCalendar event={e} variant="compact" />
          </li>
        {/each}
      </ul>
      {#if upcomingEvents.length > DATE_PREVIEW}
        <p class="mt-4 text-sm text-slate-500">
          {upcomingEvents.length - DATE_PREVIEW} more {upcomingEvents.length - DATE_PREVIEW === 1 ? 'date' : 'dates'} booked after these.
        </p>
      {/if}
    </section>
  {/if}

  <!-- ──────────────── What we repair (categories) ───────────── -->
  {#if categories.length > 0}
    <section id="repair" class="band scroll-mt-20">
      <div class="section">
        <div class="max-w-2xl">
          <p class="eyebrow">What we can look at</p>
          <h2 class="section-title mt-3">What we repair</h2>
          <p class="section-lede">Bring one of these along, or just ask. We will always take a look.</p>
        </div>
        <ul class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {#each categories as cat}
            <li class="card flex items-center gap-3.5 p-4">
              <span class="icon-tile !h-10 !w-10 shrink-0" style={`background-color: ${categoryTint(cat.colour)}; color: ${categoryInk(cat.colour)}`}>
                <Icon icon={categoryIcon(cat.icon, cat.name)} width="20" height="20" />
              </span>
              <div class="min-w-0">
                <p class="font-medium text-slate-900 truncate">{cat.name}</p>
                <p class="text-xs text-slate-500">{cat.repairerCount} volunteer{cat.repairerCount === 1 ? '' : 's'}</p>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </section>
  {/if}

  <!-- ─────────────── Linux Repair Cafe ─────────────────────── -->
  {#if linuxEnabled}
    <section class="section">
      <div class="card p-6 sm:p-10 flex flex-col sm:flex-row gap-6 sm:items-start">
        <span class="icon-chip !h-12 !w-12 shrink-0"><Laptop size={22} /></span>
        <div class="min-w-0 flex-1">
          <p class="eyebrow">Also here</p>
          <h2 class="mt-2 !text-2xl sm:!text-3xl font-semibold text-pine">{linuxHeading}</h2>
          <p class="mt-3 max-w-2xl text-slate-500 leading-relaxed whitespace-pre-line">{linuxBody}</p>
          {#if nextLinuxEvent}
            <p class="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
              <Calendar size={15} class="text-brand-500" />
              Next session with Linux help: <span class="font-medium text-slate-900">{formatDateShort(nextLinuxEvent.date)}</span>
              <span class="font-mono">{nextLinuxEvent.startTime.slice(0, 5)}–{nextLinuxEvent.endTime.slice(0, 5)}</span>
            </p>
          {/if}
          <div class="mt-6">
            <a href="/linux" class="btn-primary">{linuxCta} <ArrowRight size={18} /></a>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- ──────────────────── Photo gallery ─────────────────────── -->
  {#if gallery.length > 0}
    <section class="section">
      <div class="max-w-2xl">
        <p class="eyebrow">From our sessions</p>
        <h2 class="section-title mt-3">In the workshop</h2>
        <p class="section-lede">
          {galleryHasSessions
            ? 'Photos from recent repair sessions. Open one to see which session it came from.'
            : 'A few photos from recent repair sessions.'}
        </p>
      </div>
      <div class="mt-10">
        <PhotoGrid photos={gallery} previewCount={PHOTO_PREVIEW} fallbackAlt={`${cafeName} repair café`} />
      </div>
    </section>
  {/if}

  <!-- ──────────────────── Team ──────────────────────────────── -->
  {#if homeRepairers.length > 0}
    <section class="section">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div class="max-w-2xl">
          <p class="eyebrow">The people who fix things</p>
          <h2 class="section-title mt-3">Meet our team</h2>
          <p class="section-lede">Our repairers are volunteers. They give their time, their tools and their know-how.</p>
        </div>
        <a href="/skills" class="btn-secondary btn-sm self-start md:self-auto">See everyone <ArrowRight size={15} /></a>
      </div>
      <div class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each homeRepairers.slice(0, TEAM_PREVIEW) as r}
          <VolunteerCard volunteer={r} badgeLimit={BADGE_PREVIEW} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- ──────────── What to bring + common questions ──────────── -->
  {#if hp.whatToBring?.body || (Array.isArray(hp.faqs) && hp.faqs.length > 0)}
    <section class="band">
      <div class="section grid gap-12 {hp.whatToBring?.body && hp.faqs?.length ? 'lg:grid-cols-[1fr_1.3fr]' : ''}">
        {#if hp.whatToBring?.body}
          <div>
            <p class="eyebrow">Before you come</p>
            <h2 class="section-title mt-3">{hp.whatToBring.heading || 'What to bring'}</h2>
            <div class="mt-8">
              {#if bring.isList}
                <ul class="space-y-3.5">
                  {#each bring.items as item}
                    <li class="flex items-start gap-3 text-slate-700">
                      <CheckCircle2 size={19} class="text-brand-500 shrink-0 mt-0.5" />
                      <span class="leading-relaxed">{item}</span>
                    </li>
                  {/each}
                </ul>
              {:else}
                {#each bring.paragraphs as p}
                  <p class="mt-3 first:mt-0 text-lg leading-relaxed text-slate-600 whitespace-pre-line">{p}</p>
                {/each}
              {/if}
            </div>
          </div>
        {/if}

        {#if Array.isArray(hp.faqs) && hp.faqs.length > 0}
          <div>
            <p class="eyebrow">Good to know</p>
            <h2 class="section-title mt-3">Common questions</h2>
            <div class="mt-8 card divide-y divide-slate-200 overflow-hidden">
              {#each hp.faqs as faq, i}
                <details
                  class="group"
                  open={openFaq === i}
                  on:toggle={(e) => { if ((e.target as HTMLDetailsElement).open) openFaq = i; }}
                >
                  <summary class="cursor-pointer flex items-center gap-4 px-5 py-4 list-none hover:bg-white/[0.02] transition-colors [&::-webkit-details-marker]:hidden">
                    <span class="flex-1 font-medium text-slate-900">{faq.q}</span>
                    <ChevronDown size={18} class="shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div class="px-5 pb-5 -mt-1 text-slate-500 leading-relaxed whitespace-pre-line">{faq.a}</div>
                </details>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- ─────────────── Repair Cafes near us ───────────────────── -->
  {#if localCafes.length > 0}
    <section class="section">
      <div class="max-w-2xl">
        <p class="eyebrow">Not just us</p>
        <h2 class="section-title mt-3">Repair Cafes near us</h2>
        <p class="section-lede">We are part of a wider community of repairers. If we cannot help, one of these might.</p>
      </div>
      <div class="mt-10 grid gap-6 lg:grid-cols-5 items-start">
        <div class="lg:col-span-3">
          <LocalCafeMap
            cafes={localCafes}
            ours={localOurs}
            selectedSlug={selectedLocalSlug}
            cartoApiKey={$cafe?.cartoApiKey ?? null}
            height="24rem"
            on:select={(e) => pickLocalCafe(e.detail.slug)}
          />
          <p class="mt-2 text-xs text-slate-500">
            Tap a pin to find that cafe in the list. Details come from
            <a href="https://www.repaircafe.org" target="_blank" rel="noopener" class="underline underline-offset-2">repaircafe.org</a>.
          </p>
        </div>

        <ul class="lg:col-span-2 space-y-2 lg:max-h-[24rem] lg:overflow-y-auto lg:pr-1">
          {#each localCafes as cafe, i (cafe.slug ?? cafe.name)}
            <li
              id={`local-cafe-${cafe.slug}`}
              class="rounded-xl p-3 ring-1 transition-colors {selectedLocalSlug === cafe.slug
                ? 'bg-brand-50 ring-brand-300'
                : 'bg-surface ring-slate-200'}"
            >
              <div class="flex items-start gap-3">
                <!-- The number matches the pin on the map. -->
                <button
                  type="button"
                  class="mt-0.5 shrink-0 h-6 w-6 rounded-full text-xs font-bold ring-2 transition-colors {selectedLocalSlug === cafe.slug
                    ? 'bg-brand-600 text-white ring-brand-700'
                    : 'bg-surface text-brand-800 ring-brand-600 hover:bg-brand-50'}"
                  aria-label={`Show ${cafe.name} on the map`}
                  on:click={() => (selectedLocalSlug = selectedLocalSlug === cafe.slug ? null : cafe.slug)}
                >
                  {i + 1}
                </button>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-pine">{cafe.name}</p>
                  {#if cafe.address}
                    <p class="text-sm text-slate-600">{cafe.address}</p>
                  {/if}
                  <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {#if formatDistance(cafe.distanceKm)}
                      <span class="text-slate-500">{formatDistance(cafe.distanceKm)}</span>
                    {/if}
                    {#if cafe.website}
                      <a href={cafe.website} target="_blank" rel="noopener" class="text-brand-400 underline underline-offset-2 hover:text-brand-700">
                        Their website
                      </a>
                    {/if}
                    {#if repairCafeOrgUrl(cafe.slug)}
                      <a href={repairCafeOrgUrl(cafe.slug)} target="_blank" rel="noopener" class="text-brand-400 underline underline-offset-2 hover:text-brand-700">
                        On repaircafe.org
                      </a>
                    {/if}
                  </p>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </section>
  {/if}

  <!-- ──────────────── Closing call to action ────────────────
       The page ends on an invitation, not on a list. -->
  <NextSessionCta event={nextEvent} venue={homeVenue} image={closingImage} />
</main>

<SiteFooter />
