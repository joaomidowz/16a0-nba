<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Player } from '../lib/types';

  export let player: Player;
  export let selected = false;
  export let disabled = false;

  const dispatch = createEventDispatcher<{ toggle: Player }>();
</script>

<button
  class:selected
  class="player-card"
  type="button"
  aria-pressed={selected}
  aria-label={`${selected ? 'Remover' : 'Adicionar'} ${player.name}, ${player.position}`}
  {disabled}
  on:click={() => dispatch('toggle', player)}
>
  <span class="position">{player.position}</span>
  <span class="identity">
    <strong>{player.name}</strong>
    <small>{player.special}</small>
  </span>
  <span class="overall">{player.overall}</span>
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

  .player-card:disabled { cursor: not-allowed; opacity: 0.5; }
  .position { font: 800 0.75rem/1 var(--font-display); color: var(--orange); }
  .identity { display: grid; gap: 0.2rem; min-width: 0; }
  .identity strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .identity small { color: var(--muted); }
  .overall { font: 900 1.2rem/1 var(--font-display); }
</style>
