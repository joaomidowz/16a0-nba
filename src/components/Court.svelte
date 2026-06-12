<script lang="ts">
  import type { Lineup, LineupSlot } from '../lib/types';

  export let lineup: Lineup;
  export let activeSlot: LineupSlot | null = null;
  export let compact = false;

  const starters: Exclude<LineupSlot, 'Six'>[] = ['PG', 'SG', 'SF', 'PF', 'C'];
</script>

<div class:compact class="court" aria-label="Quadra com as posições do elenco">
  <div class="center-line"></div>
  <div class="center-circle"></div>
  {#each starters as slot}
    <div class="slot slot-{slot.toLowerCase()}" class:filled={lineup[slot]} class:pulse={activeSlot === slot && !lineup[slot]}>
      <span>{slot}</span>
      <strong>{lineup[slot]?.name ?? (activeSlot === slot ? 'Escolha agora' : 'Livre')}</strong>
    </div>
  {/each}
</div>

<div class="sixth" class:filled={lineup.Six} class:pulse={activeSlot === 'Six' && !lineup.Six}>
  <span>6TH MAN</span>
  <strong>{lineup.Six?.name ?? (activeSlot === 'Six' ? 'Escolha agora' : 'Livre')}</strong>
</div>

<style>
  .court { position: relative; min-height: 25rem; border: 2px solid color-mix(in srgb, var(--cream) 65%, transparent); border-radius: 1rem; background: linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), #a95025; background-size: 2.5rem 2.5rem; overflow: hidden; }
  .court.compact { min-height: 20rem; }
  .center-line { position: absolute; inset: 0 50% 0 auto; border-right: 2px solid rgba(255,255,255,.55); }.center-circle { position: absolute; width: 6rem; height: 6rem; border: 2px solid rgba(255,255,255,.55); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .slot { position: absolute; width: 7rem; min-height: 3.7rem; display: grid; place-content: center; gap: .22rem; padding: .5rem; color: var(--muted); text-align: center; background: rgba(11,15,25,.9); border: 2px dashed rgba(255,255,255,.45); border-radius: 999px; transform: translate(-50%, -50%); transition: 180ms ease; }
  .slot.filled, .sixth.filled { color: var(--text); border-style: solid; border-color: var(--mint); background: color-mix(in srgb, var(--mint) 13%, rgba(11,15,25,.94)); }
  .slot span, .sixth span { color: var(--orange); font: 900 .68rem/1 var(--font-display); }.slot strong, .sixth strong { font-size: .75rem; line-height: 1.1; }
  .slot-pg { left: 17%; top: 50%; }.slot-sg { left: 38%; top: 23%; }.slot-sf { left: 38%; top: 77%; }.slot-pf { left: 72%; top: 27%; }.slot-c { left: 78%; top: 70%; }
  .sixth { margin-top: .65rem; min-height: 3.5rem; display: flex; gap: .7rem; justify-content: center; align-items: center; padding: .65rem; color: var(--muted); border: 2px dashed var(--line); border-radius: .8rem; transition: 180ms ease; }
  .pulse { animation: pulse 1.15s infinite ease-in-out; border-color: var(--cream); color: var(--cream); }
  @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,244,214,0); } 50% { box-shadow: 0 0 0 .38rem rgba(255,244,214,.22), 0 0 1.2rem rgba(240,118,54,.45); } }
  @media (max-width: 540px) { .court, .court.compact { min-height: 20rem; }.slot { width: 5.8rem; min-height: 3.3rem; }.slot strong { font-size: .66rem; } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; border-color: var(--cream); } }
</style>
