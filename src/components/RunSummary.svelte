<script lang="ts">
  import { isLegend, type Player, type PlayerBoxScore, type RunSetup, type RunSummary as Summary, type SeriesResult } from '../lib/types';
  export let setup: RunSetup;
  export let series: SeriesResult[];
  export let summary: Summary;
  export let roster: Player[];

  let statView: 'basic' | 'advanced' = 'basic';

  function playerAverage(item: SeriesResult, player: Player): PlayerBoxScore {
    const rows = item.games.map((game) => game.opponentBoxScore.find((row) => row.playerId === player.id)).filter((row): row is PlayerBoxScore => Boolean(row));
    const average = (field: keyof Pick<PlayerBoxScore, 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks' | 'rating'>) => rows.length ? Number((rows.reduce((sum, row) => sum + row[field], 0) / rows.length).toFixed(1)) : 0;
    return { playerId: player.id, name: player.name, points: average('points'), rebounds: average('rebounds'), assists: average('assists'), steals: average('steals'), blocks: average('blocks'), rating: average('rating') };
  }
</script>

<section class="summary-card">
  <div class="summary-heading">
    <div><span class="eyebrow">{setup.mode} · seed {setup.seed}</span><h2>{summary.verdict}</h2></div>
    <strong class="record">{summary.wins}-{summary.losses}</strong>
  </div>

  <div class="summary-grid">
    <div class="campaign-column">
      <span class="section-label">CAMINHO DA CAMPANHA</span>
      <div class="series-list">
        {#each series as item, index}
          <details>
            <summary><span>R{index + 1}</span><strong>{item.opponent.year} {item.opponent.name}</strong><b>{item.userWins}-{item.opponentWins}</b><i>+</i></summary>
            <div class="opponent-panel">
              <div class="opponent-toolbar"><small>6 jogadores · médias da série</small><div><button class:active={statView === 'basic'} type="button" on:click|preventDefault={() => statView = 'basic'}>PTS/REB/AST</button><button class:active={statView === 'advanced'} type="button" on:click|preventDefault={() => statView = 'advanced'}>Defesa/Clutch</button></div></div>
              <div class="opponent-players">
                {#each item.opponentPlayers as player}
                  {@const average = playerAverage(item, player)}
                  <article><div><span>{player.position}</span><strong>{player.name}</strong><small>{player.special}</small></div>{#if statView === 'basic'}<dl><div><dt>PTS</dt><dd>{average.points}</dd></div><div><dt>REB</dt><dd>{average.rebounds}</dd></div><div><dt>AST</dt><dd>{average.assists}</dd></div></dl>{:else}<dl><div><dt>DEF</dt><dd>{setup.mode === 'hardcore' ? '?' : player.defense}</dd></div><div><dt>CLU</dt><dd>{setup.mode === 'hardcore' ? '?' : player.clutch}</dd></div><div><dt>NOTA</dt><dd>{setup.mode === 'hardcore' ? '?' : average.rating}</dd></div></dl>{/if}</article>
                {/each}
              </div>
            </div>
          </details>
        {/each}
      </div>
    </div>

    <div class="metrics-column">
      <span class="section-label">DESTAQUES</span>
      <div class="metrics desktop-metrics">
        <div><span>MVP</span><strong>{summary.mvp?.name ?? '-'}</strong><small>{setup.mode === 'hardcore' ? 'nota oculta' : `${summary.mvp?.rating ?? '-'} de nota`}</small></div>
        <div><span>Média</span><strong>{summary.averagePoints}</strong><small>pontos por jogo</small></div>
        <div><span>Maior vitória</span><strong>+{summary.biggestWin}</strong><small>pontos</small></div>
        <div><span>Mais clutch</span><strong>{summary.clutchPlayer?.name ?? '-'}</strong><small>{setup.mode === 'hardcore' ? 'atributo oculto' : `${summary.clutchPlayer?.clutch ?? '-'} clutch`}</small></div>
      </div>
      <details class="mobile-metrics"><summary>Detalhes da campanha <span>+</span></summary><div class="metrics"><div><span>MVP</span><strong>{summary.mvp?.name ?? '-'}</strong><small>{setup.mode === 'hardcore' ? 'nota oculta' : `${summary.mvp?.rating ?? '-'} de nota`}</small></div><div><span>Média</span><strong>{summary.averagePoints}</strong><small>pontos por jogo</small></div><div><span>Maior vitória</span><strong>+{summary.biggestWin}</strong><small>pontos</small></div><div><span>Mais clutch</span><strong>{summary.clutchPlayer?.name ?? '-'}</strong><small>{setup.mode === 'hardcore' ? 'atributo oculto' : `${summary.clutchPlayer?.clutch ?? '-'} clutch`}</small></div></div></details>
    </div>
  </div>

  <div class="roster-section">
    <div class="roster-heading"><span class="section-label">MEU TIME FINAL</span><small>Jogadores Legend têm borda dourada</small></div>
    <div class="final-roster">
      {#each roster as player, index}
        <article class:legend={isLegend(player)}>
          <span>{index === 5 ? '6TH' : player.position}</span>
          <div><strong>{player.name}</strong><small>{player.special}</small></div>
          <b>{setup.mode === 'hardcore' ? '?' : player.overall}</b>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .summary-card { padding: 1.25rem; color: var(--text); background: radial-gradient(circle at top right, rgba(240,118,54,.18), transparent 30%), var(--panel); border: 1px solid var(--line); border-radius: 1.2rem; }.summary-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: end; padding-bottom: .9rem; border-bottom: 1px solid var(--line); }.summary-heading h2 { margin: .2rem 0 0; font: 900 clamp(1.8rem, 5vw, 3.3rem)/.92 var(--font-display); text-transform: uppercase; }.record { color: var(--cream); font: 900 clamp(2.8rem, 8vw, 5rem)/.8 var(--font-display); }.summary-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(18rem, .95fr); gap: 1rem; margin-top: 1rem; }.section-label { display: block; margin-bottom: .45rem; color: var(--muted); font: 900 .65rem/1 var(--font-display); letter-spacing: .1em; }.series-list { display: grid; gap: .4rem; }.series-list details { background: var(--panel-2); border: 1px solid transparent; border-radius: .7rem; overflow: hidden; }.series-list details[open] { border-color: var(--orange); }.series-list summary { display: grid; grid-template-columns: 2rem 1fr auto 1rem; gap: .6rem; align-items: center; padding: .65rem .7rem; cursor: pointer; list-style: none; }.series-list summary::-webkit-details-marker { display: none; }.series-list summary span { color: var(--muted); }.series-list summary b { color: var(--mint); }.series-list summary i { color: var(--orange); font-style: normal; }.opponent-panel { padding: 0 .65rem .65rem; }.opponent-toolbar { display: flex; justify-content: space-between; gap: .5rem; align-items: center; padding-top: .55rem; border-top: 1px solid var(--line); }.opponent-toolbar small { color: var(--muted); }.opponent-toolbar > div { display: flex; gap: .25rem; }.opponent-toolbar button { padding: .35rem .45rem; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: .4rem; cursor: pointer; font-size: .62rem; }.opponent-toolbar button.active { color: var(--bg); background: var(--mint); border-color: var(--mint); }.opponent-players { display: grid; gap: .3rem; margin-top: .5rem; max-height: 16rem; overflow-y: auto; }.opponent-players article { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .5rem; align-items: center; padding: .5rem; background: var(--panel); border-radius: .5rem; }.opponent-players article > div { display: grid; grid-template-columns: 2rem 1fr; gap: .1rem .35rem; min-width: 0; }.opponent-players article > div span { grid-row: 1 / 3; color: var(--orange); font-weight: 900; }.opponent-players article > div strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem; }.opponent-players article > div small { color: var(--muted); font-size: .62rem; }.opponent-players dl { display: grid; grid-template-columns: repeat(3, 2.6rem); gap: .2rem; margin: 0; }.opponent-players dl div { display: grid; gap: .1rem; text-align: center; }.opponent-players dt { color: var(--muted); font-size: .55rem; }.opponent-players dd { margin: 0; font-size: .72rem; font-weight: 900; }.metrics { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }.metrics > div { display: grid; align-content: center; gap: .25rem; min-height: 6.3rem; padding: .75rem; border: 1px solid var(--line); border-radius: .7rem; }.metrics span, .metrics small { color: var(--muted); font-size: .68rem; }.metrics strong { overflow-wrap: anywhere; }.mobile-metrics { display: none; }.roster-section { margin-top: 1rem; padding-top: .8rem; border-top: 1px solid var(--line); }.roster-heading { display: flex; justify-content: space-between; gap: .5rem; align-items: center; }.roster-heading small { color: var(--muted); font-size: .62rem; }.final-roster { display: grid; grid-template-columns: repeat(3, 1fr); gap: .45rem; }.final-roster article { display: grid; grid-template-columns: 2.2rem 1fr auto; gap: .5rem; align-items: center; min-width: 0; padding: .6rem; background: var(--panel-2); border: 1px solid var(--line); border-radius: .65rem; }.final-roster article.legend { border-color: #d6a928; box-shadow: inset 0 0 0 1px rgba(250, 204, 21, .18); }.final-roster article > span { color: var(--orange); font: 900 .68rem/1 var(--font-display); }.final-roster article > div { display: grid; gap: .15rem; min-width: 0; }.final-roster strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem; }.final-roster small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; font-size: .6rem; }.final-roster b { color: var(--cream); }
  @media (max-width: 720px) { .summary-card { padding: .8rem; }.summary-grid { grid-template-columns: 1fr; }.desktop-metrics, .metrics-column > .section-label { display: none; }.mobile-metrics { display: block; background: var(--panel-2); border-radius: .7rem; }.mobile-metrics > summary { display: flex; justify-content: space-between; padding: .75rem; cursor: pointer; font-weight: 900; list-style: none; }.mobile-metrics .metrics { padding: 0 .65rem .65rem; }.metrics > div { min-height: 5rem; }.opponent-toolbar { align-items: stretch; flex-direction: column; }.opponent-toolbar button { flex: 1; }.opponent-players { max-height: none; }.opponent-players article { min-width: 31rem; }.opponent-panel { overflow-x: auto; }.final-roster { grid-template-columns: 1fr 1fr; }.roster-heading { align-items: flex-start; flex-direction: column; } }
</style>
