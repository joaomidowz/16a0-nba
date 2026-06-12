<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { isLegend, type Player } from '../lib/types';

  export let player: Player;
  export let selected = false;
  export let disabled = false;
  export let hideOverall = false;

  const dispatch = createEventDispatcher<{ toggle: Player }>();
</script>

<button
  class:selected
  class:legend={isLegend(player)}
  class="player-card"
  type="button"
  aria-pressed={selected}
  aria-label={`${selected ? 'Desmarcar' : 'Selecionar'} ${player.name}, ${player.position}`}
  {disabled}
  on:click={() => dispatch('toggle', player)}
>
  <span class="position">{player.position}</span>
  <span class="identity">
    <strong>{player.name}</strong>
    <small>{player.special}</small>
  </span>
  <span class="overall" class:hidden={hideOverall}>{hideOverall ? '?' : player.overall}</span>
</button>

<style>
  .player-card {
    width: 100%;
    display: grid;
    grid-template-columns: 2.6rem 1fr auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.8rem;
    color: var(--text);
    text-align: left;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 0.85rem;
    cursor: pointer;
    transition: 160ms ease;
  }

  .player-card:hover:not(:disabled), .player-card:focus-visible {
    border-color: var(--orange);
    transform: translateY(-1px);
  }

  .player-card.selected {
    border-color: var(--mint);
    background: color-mix(in srgb, var(--mint) 12%, var(--panel-2));
  }

  .player-card.legend { border-color: #d6a928; box-shadow: inset 0 0 0 1px rgba(250, 204, 21, .2); }
  .player-card.legend:hover:not(:disabled), .player-card.legend:focus-visible { border-color: #facc15; }

  .player-card:disabled { cursor: not-allowed; opacity: 0.5; }
  .position { font: 800 0.75rem/1 var(--font-display); color: var(--orange); }
  .identity { display: grid; gap: 0.2rem; min-width: 0; }
  .identity strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .identity small { color: var(--muted); }
  .overall { font: 900 1.2rem/1 var(--font-display); }
  .overall.hidden { color: var(--muted); }
</style>
