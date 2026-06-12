<script lang="ts">
  import type { RunSetup, RunSummary as Summary, SeriesResult } from '../lib/types';
  export let setup: RunSetup;
  export let series: SeriesResult[];
  export let summary: Summary;
</script>

<section class="summary-card">
  <div class="summary-heading">
    <div>
      <span class="eyebrow">{setup.mode} · seed {setup.seed}</span>
      <h2>{summary.verdict}</h2>
    </div>
    <strong class="record">{summary.wins}-{summary.losses}</strong>
  </div>

  <div class="series-list">
    {#each series as item, index}
      <div><span>R{index + 1}</span><strong>{item.opponent.year} {item.opponent.name}</strong><b>{item.userWins}-{item.opponentWins}</b></div>
    {/each}
  </div>

  <div class="metrics">
    <div><span>MVP</span><strong>{summary.mvp?.name ?? '-'}</strong><small>{summary.mvp?.rating ?? '-'} de nota</small></div>
    <div><span>Média</span><strong>{summary.averagePoints}</strong><small>pontos por jogo</small></div>
    <div><span>Maior vitória</span><strong>+{summary.biggestWin}</strong><small>pontos</small></div>
    <div><span>Mais clutch</span><strong>{summary.clutchPlayer?.name ?? '-'}</strong><small>{summary.clutchPlayer?.clutch ?? '-'} clutch</small></div>
  </div>
</section>

<style>
  .summary-card { padding: clamp(1rem, 3vw, 2rem); color: var(--text); background: radial-gradient(circle at top right, rgba(240,118,54,.2), transparent 32%), var(--panel); border: 1px solid var(--line); border-radius: 1.4rem; }
  .summary-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: end; padding-bottom: 1.4rem; border-bottom: 1px solid var(--line); }
  h2 { margin: .25rem 0 0; font: 900 clamp(2rem, 7vw, 4rem)/.95 var(--font-display); text-transform: uppercase; }
  .eyebrow { color: var(--orange); font: 800 .72rem/1 var(--font-display); text-transform: uppercase; letter-spacing: .09em; }
  .record { color: var(--cream); font: 900 clamp(3rem, 10vw, 6rem)/.8 var(--font-display); }
  .series-list { display: grid; gap: .5rem; margin: 1.2rem 0; }
  .series-list div { display: grid; grid-template-columns: 2rem 1fr auto; gap: .75rem; padding: .75rem; background: var(--panel-2); border-radius: .75rem; }
  .series-list span { color: var(--muted); }
  .series-list b { color: var(--mint); }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: .7rem; }
  .metrics div { display: grid; gap: .3rem; padding: .85rem; border: 1px solid var(--line); border-radius: .8rem; }
  .metrics span, .metrics small { color: var(--muted); font-size: .72rem; }
  @media (max-width: 720px) { .metrics { grid-template-columns: 1fr 1fr; } }
</style>
