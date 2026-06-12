<script lang="ts">
  import type { PlayerBoxScore } from '../lib/types';
  export let rows: PlayerBoxScore[] = [];
  export let hideRating = false;
</script>

<div class="table-wrap">
  <table>
    <thead><tr><th>Jogador</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th>{#if !hideRating}<th>NOTA</th>{/if}</tr></thead>
    <tbody>
      {#each rows as row}
        <tr><td>{row.name}</td><td>{row.points}</td><td>{row.rebounds}</td><td>{row.assists}</td><td>{row.steals}</td><td>{row.blocks}</td>{#if !hideRating}<td><strong>{row.rating}</strong></td>{/if}</tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 36rem; }
  th, td { padding: .7rem .6rem; border-bottom: 1px solid var(--line); text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  th { color: var(--muted); font: 700 .68rem/1 var(--font-display); }
  td { font-size: .88rem; }
  td strong { color: var(--mint); }
</style>
