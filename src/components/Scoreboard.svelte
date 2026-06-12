<script lang="ts">
  import type { GameResult } from '../lib/types';
  export let result: GameResult;
</script>

<div class="scoreboard">
  <div>
    <small>SEU TIME</small>
    <strong>{result.userScore}</strong>
  </div>
  <div class="quarters">
    {#each result.quarters as quarter, index}
      <span><small>Q{index + 1}</small>{quarter.user}-{quarter.opponent}</span>
    {/each}
  </div>
  <div>
    <small>ADVERSÁRIO</small>
    <strong>{result.opponentScore}</strong>
  </div>
</div>

<style>
  .scoreboard { display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center; padding: 1rem; background: #070a11; border: 1px solid var(--line); border-radius: 1rem; text-align: center; }
  .scoreboard > div { display: grid; gap: .2rem; }
  small { color: var(--muted); font: 700 .65rem/1 var(--font-display); letter-spacing: .08em; }
  strong { color: var(--cream); font: 900 2.5rem/1 var(--font-display); }
  .quarters { grid-auto-flow: column; gap: .65rem !important; }
  .quarters span { display: grid; gap: .25rem; color: var(--text); font-weight: 800; }
  @media (max-width: 600px) { .scoreboard { grid-template-columns: 1fr 1fr; } .quarters { grid-column: 1 / -1; grid-row: 2; justify-content: center; } }
</style>
