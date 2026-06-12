<script lang="ts">
  import type { Player, Position } from '../lib/types';

  export let players: Player[] = [];
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

  $: starters = positions.map((position) => players.find((player) => player.position === position));
  $: starterIds = new Set(starters.filter(Boolean).map((player) => player!.id));
  $: sixth = players.find((player) => !starterIds.has(player.id));
</script>

<div class="court" aria-label="Quadra com a escalação selecionada">
  <div class="line center-line"></div>
  <div class="circle"></div>
  {#each positions as position, index}
    <div class="slot slot-{position.toLowerCase()}" class:filled={starters[index]}>
      <span>{position}</span>
      <strong>{starters[index]?.name ?? 'Vaga aberta'}</strong>
    </div>
  {/each}
</div>

<div class="sixth" class:filled={sixth}>
  <span>6TH</span>
  <strong>{sixth?.name ?? 'Sexto homem'}</strong>
</div>

<style>
  .court {
    position: relative;
    min-height: 28rem;
    border: 2px solid color-mix(in srgb, var(--cream) 65%, transparent);
    border-radius: 1.2rem;
    background: linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), #a95025;
    background-size: 2.5rem 2.5rem;
    overflow: hidden;
  }
  .center-line { position: absolute; inset: 0 50% 0 auto; border-right: 2px solid rgba(255,255,255,.55); }
  .circle { position: absolute; width: 7rem; height: 7rem; border: 2px solid rgba(255,255,255,.55); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .slot { position: absolute; width: 8rem; min-height: 4rem; padding: .65rem; display: grid; place-content: center; gap: .25rem; text-align: center; background: rgba(11,15,25,.86); border: 1px dashed rgba(255,255,255,.45); border-radius: .8rem; transform: translate(-50%, -50%); }
  .slot.filled { border-style: solid; border-color: var(--mint); }
  .slot span, .sixth span { color: var(--orange); font: 900 .72rem/1 var(--font-display); }
  .slot strong, .sixth strong { font-size: .82rem; }
  .slot-pg { left: 18%; top: 50%; }
  .slot-sg { left: 37%; top: 23%; }
  .slot-sf { left: 37%; top: 77%; }
  .slot-pf { left: 70%; top: 28%; }
  .slot-c { left: 76%; top: 68%; }
  .sixth { margin-top: .75rem; display: flex; gap: .75rem; justify-content: center; padding: .8rem; border: 1px dashed var(--line); border-radius: .8rem; }
  .sixth.filled { border-style: solid; border-color: var(--mint); }
  @media (max-width: 540px) {
    .court { min-height: 23rem; }
    .slot { width: 6.2rem; min-height: 3.5rem; padding: .45rem; }
    .slot strong { font-size: .72rem; }
  }
</style>
