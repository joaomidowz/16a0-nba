<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import AnimatedScoreboard from '../components/AnimatedScoreboard.svelte';
  import BoxScore from '../components/BoxScore.svelte';
  import Court from '../components/Court.svelte';
  import type { GameMode, Lineup, PowerUp, SeriesResult, SimulationMode, SimulationSpeed } from '../lib/types';

  export let series: SeriesResult;
  export let lineup: Lineup;
  export let gameMode: GameMode;
  export let round: number;
  export let mode: SimulationMode = 'manual';
  export let speed: SimulationSpeed = 50;
  export let isFinalRound = false;
  export let rewardsEnabled = false;
  export let powerUpsRemaining = 0;
  export let animationSkipsRemaining = Number.POSITIVE_INFINITY;

  type View = 'score' | 'court' | 'box';
  let activeView: View = 'score';
  let boxTeam: 'user' | 'opponent' = 'user';
  let visibleGameIndex = 0;
  let gameComplete = false;
  let paused = false;
  let scoreboard: { pauseAnimation: () => void; resumeAnimation: () => void; skipAnimation: () => void };
  let autoTimer: ReturnType<typeof setTimeout> | null = null;
  const dispatch = createEventDispatcher<{
    config: { mode: SimulationMode; speed: SimulationSpeed };
    autoContinue: void;
    continue: void;
    powerUp: PowerUp;
    skipUsed: void;
    finish: void;
  }>();

  $: visibleGame = series.games[visibleGameIndex];
  $: revealedGames = series.games.slice(0, visibleGameIndex + (gameComplete ? 1 : 0));
  $: revealedUserWins = revealedGames.filter((game) => game.winner === 'user').length;
  $: revealedOpponentWins = revealedGames.length - revealedUserWins;
  $: seriesRevealed = gameComplete && visibleGameIndex === series.games.length - 1;
  $: canSkip = !gameComplete && (gameMode !== 'hardcore' || animationSkipsRemaining > 0);

  function clearAutoTimer() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
  }

  function scheduleAutoAdvance() {
    clearAutoTimer();
    if (mode !== 'automatic' || !gameComplete) return;
    autoTimer = setTimeout(() => {
      if (visibleGameIndex < series.games.length - 1) nextGame();
      else dispatch('autoContinue');
    }, 1200);
  }

  function handleComplete() {
    gameComplete = true;
    paused = false;
    scheduleAutoAdvance();
  }

  function nextGame() {
    clearAutoTimer();
    visibleGameIndex += 1;
    gameComplete = false;
    paused = false;
    activeView = 'score';
    boxTeam = 'user';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function changeMode(nextMode: SimulationMode) {
    mode = nextMode;
    paused = false;
    scoreboard?.resumeAnimation();
    dispatch('config', { mode, speed });
    if (mode === 'automatic') scheduleAutoAdvance();
    else clearAutoTimer();
  }

  function changeSpeed() {
    dispatch('config', { mode, speed });
  }

  function togglePause() {
    if (paused) scoreboard.resumeAnimation();
    else scoreboard.pauseAnimation();
  }

  function skipAnimation() {
    if (!canSkip) return;
    scoreboard.skipAnimation();
    if (gameMode === 'hardcore') dispatch('skipUsed');
  }

  onDestroy(clearAutoTimer);
</script>

<main class="shell page game-page">
  <header class="page-header game-heading">
    <div><span class="eyebrow">ROUND {round} · JOGO {visibleGame.game}</span><h1>{series.opponent.year} {series.opponent.name}</h1><p>{gameComplete ? `Jogo ${visibleGame.game} encerrado.` : `Acompanhando o ${visibleGame.home === 'user' ? 'jogo em casa' : 'jogo fora de casa'}.`}</p></div>
    <div class:won={seriesRevealed && series.won} class="series-score"><small>SÉRIE</small><strong>{revealedUserWins}-{revealedOpponentWins}</strong></div>
  </header>

  <section class="simulation-controls" aria-label="Controles da simulação">
    <div class="mode-toggle"><span>Modo</span><button type="button" class:active={mode === 'automatic'} on:click={() => changeMode('automatic')}>Auto</button><button type="button" class:active={mode === 'manual'} on:click={() => changeMode('manual')}>Manual</button></div>
    <label class="speed-control"><span>Velocidade <strong>{speed} ms</strong></span><input type="range" min="25" max="200" step="25" bind:value={speed} on:input={changeSpeed} /></label>
    <div class="playback-actions">
      {#if mode === 'manual'}<button type="button" disabled={gameComplete} on:click={togglePause}>{paused ? 'Retomar' : 'Pausar'}</button>{/if}
      <button class="skip" type="button" disabled={!canSkip} on:click={skipAnimation}>Pular {gameMode === 'hardcore' ? `(${animationSkipsRemaining}/1)` : 'animação'}</button>
    </div>
  </section>

  <div class="progress-row">
    <nav class="game-progress" aria-label="Progresso da série">
      {#each series.games.slice(0, visibleGameIndex + 1) as game, index}<span class:active={index === visibleGameIndex} class:revealed={index < visibleGameIndex || (index === visibleGameIndex && gameComplete)} class:loss={(index < visibleGameIndex || (index === visibleGameIndex && gameComplete)) && game.winner === 'opponent'}>J{game.game}<b>{index < visibleGameIndex || (index === visibleGameIndex && gameComplete) ? (game.winner === 'user' ? 'W' : 'L') : '·'}</b></span>{/each}
    </nav>
    {#if gameMode === 'arcade' && powerUpsRemaining < 2}<span class="boost-status">ARCADE · {powerUpsRemaining} power-up restante</span>{/if}
  </div>

  <nav class="view-tabs" aria-label="Visualização da partida">
    <button class:active={activeView === 'score'} type="button" on:click={() => activeView = 'score'}>Placar</button>
    <button class:active={activeView === 'court'} type="button" on:click={() => activeView = 'court'}>Quadra</button>
    <button class:active={activeView === 'box'} type="button" on:click={() => activeView = 'box'}>Box score {gameComplete ? '' : '· bloqueado'}</button>
  </nav>

  <section class="game-card">
    <div class:hidden-view={activeView !== 'score'}>
      {#key visibleGameIndex}<AnimatedScoreboard bind:this={scoreboard} result={visibleGame} {speed} on:pause={() => paused = true} on:resume={() => paused = false} on:complete={handleComplete} />{/key}
      <div class="quarter-line">{#each visibleGame.quarters as quarter, index}<span><small>Q{index + 1}</small><strong>{gameComplete ? `${quarter.user}-${quarter.opponent}` : '—'}</strong></span>{/each}</div>
    </div>

    {#if activeView === 'court'}
      <div class="court-view"><Court {lineup} showDetails hideRatings={gameMode === 'hardcore'} /><p>Toque em Placar para acompanhar a animação. A simulação continua enquanto você consulta a formação.</p></div>
    {:else if activeView === 'box'}
      {#if gameComplete}
        <div class="box-reveal">
          <div class="box-heading"><div><span class="eyebrow">JOGO ENCERRADO</span><h2>Box score</h2></div><div class="box-toggle"><button class:active={boxTeam === 'user'} type="button" on:click={() => boxTeam = 'user'}>Seu time</button><button class:active={boxTeam === 'opponent'} type="button" on:click={() => boxTeam = 'opponent'}>Adversário</button></div></div>
          <BoxScore rows={boxTeam === 'user' ? visibleGame.boxScore : visibleGame.opponentBoxScore} hideRating={gameMode === 'hardcore'} />
        </div>
      {:else}<div class="locked-box"><strong>Box score bloqueado</strong><span>Disponível após o fim da partida.</span></div>{/if}
    {/if}
  </section>

  {#if gameComplete && !seriesRevealed && mode === 'manual'}
    <button class="primary finish" type="button" on:click={nextGame}>Próximo jogo · J{visibleGameIndex + 2} <span>→</span></button>
  {:else if seriesRevealed && series.won && !isFinalRound && mode === 'manual'}
    {#if rewardsEnabled && powerUpsRemaining > 0}
      <section class="reward-panel"><div><span class="eyebrow">SÉRIE VENCIDA · ARCADE</span><h2>Escolha um power-up</h2><p>O bônus vale para a próxima série. Restam {powerUpsRemaining} usos nesta run.</p></div><div class="reward-grid"><button type="button" on:click={() => dispatch('powerUp', 'swap')}><strong>Roubar estrela</strong><small>Recruta o melhor jogador do adversário derrotado.</small></button><button type="button" on:click={() => dispatch('powerUp', 'balanced')}><strong>Impulso +2</strong><small>+2 em ataque e defesa durante a próxima série.</small></button><button type="button" on:click={() => dispatch('powerUp', 'clutch')}><strong>Clutch +5</strong><small>+5 em clutch durante a próxima série.</small></button></div></section>
    {:else}
      <button class="primary finish" type="button" on:click={() => dispatch('continue')}>Próxima série <span>→</span></button>
    {/if}
  {:else if seriesRevealed && mode === 'manual'}
    <button class="primary finish" type="button" on:click={() => dispatch('finish')}>{series.won ? 'Ver campanha completa' : 'Ver resultado da eliminação'} <span>→</span></button>
  {/if}
</main>

<style>
  .game-page { padding-top: 2rem; }.game-heading { margin-bottom: 1rem; align-items: center; }.game-heading h1 { font-size: clamp(2rem, 5vw, 3.8rem); }.series-score { display: grid; justify-items: center; gap: .2rem; min-width: 8rem; padding: .75rem; background: var(--panel); border: 1px solid var(--red); border-radius: 1rem; }.series-score.won { border-color: var(--mint); }.series-score small { color: var(--muted); }.series-score strong { font: 900 2.5rem/1 var(--font-display); }
  .simulation-controls { display: grid; grid-template-columns: auto minmax(12rem, 1fr) auto; gap: .8rem; align-items: center; margin-bottom: .7rem; padding: .7rem; background: var(--panel); border: 1px solid var(--line); border-radius: .9rem; }.mode-toggle, .playback-actions { display: flex; gap: .35rem; align-items: center; }.mode-toggle > span, .speed-control > span { color: var(--muted); font-size: .68rem; font-weight: 800; text-transform: uppercase; }.mode-toggle button, .playback-actions button { min-height: 2.35rem; padding: .45rem .65rem; color: var(--muted); background: var(--panel-2); border: 1px solid var(--line); border-radius: .55rem; cursor: pointer; }.mode-toggle button.active { color: var(--bg); background: var(--mint); border-color: var(--mint); }.speed-control { display: grid; gap: .3rem; }.speed-control > span { display: flex; justify-content: space-between; }.speed-control strong { color: var(--cream); }.speed-control input { width: 100%; accent-color: var(--orange); }.playback-actions button { color: var(--cream); }.playback-actions button:disabled { cursor: default; opacity: .4; }
  .progress-row { display: flex; justify-content: space-between; gap: .7rem; align-items: center; }.game-progress { display: flex; gap: .4rem; overflow-x: auto; }.game-progress span { display: flex; gap: .35rem; align-items: center; padding: .5rem .65rem; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: .6rem; }.game-progress span.active { border-color: var(--orange); }.game-progress span.revealed b { color: var(--mint); }.game-progress span.loss b { color: var(--red); }.boost-status { color: var(--orange); font-size: .7rem; font-weight: 900; text-transform: uppercase; }
  .view-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; margin: .7rem 0; }.view-tabs button { padding: .65rem; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: .65rem; cursor: pointer; font-weight: 800; }.view-tabs button.active { color: var(--cream); border-color: var(--orange); background: color-mix(in srgb, var(--orange) 8%, var(--panel)); }
  .game-card { min-height: 18rem; padding: .85rem; background: var(--panel); border: 1px solid var(--line); border-radius: 1rem; }.hidden-view { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }.quarter-line { display: grid; grid-template-columns: repeat(4, 1fr); gap: .4rem; margin-top: .6rem; }.quarter-line span { display: flex; justify-content: center; gap: .45rem; padding: .5rem; background: var(--panel-2); border-radius: .5rem; }.quarter-line small { color: var(--muted); }.court-view { max-width: 760px; margin: 0 auto; }.court-view p { margin: .6rem 0 0; color: var(--muted); text-align: center; font-size: .78rem; }.box-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: end; }.box-heading h2 { margin: .3rem 0; font: 900 1.6rem/1 var(--font-display); text-transform: uppercase; }.box-toggle { display: flex; gap: .35rem; }.box-toggle button { padding: .5rem .65rem; color: var(--muted); background: var(--panel-2); border: 1px solid var(--line); border-radius: .55rem; cursor: pointer; }.box-toggle button.active { color: var(--bg); background: var(--mint); border-color: var(--mint); }.locked-box { min-height: 15rem; display: grid; place-content: center; gap: .35rem; color: var(--muted); text-align: center; border: 1px dashed var(--line); border-radius: .8rem; }.locked-box strong { color: var(--cream); }
  .reward-panel { margin-top: .8rem; padding: 1rem; background: var(--panel); border: 1px solid var(--orange); border-radius: 1rem; }.reward-panel h2 { margin: .3rem 0; font: 900 1.7rem/1 var(--font-display); text-transform: uppercase; }.reward-panel p { margin: 0; color: var(--muted); }.reward-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; margin-top: .8rem; }.reward-grid button { display: grid; gap: .35rem; padding: .85rem; color: var(--text); text-align: left; background: var(--panel-2); border: 1px solid var(--line); border-radius: .75rem; cursor: pointer; }.reward-grid button:hover { border-color: var(--orange); }.reward-grid small { color: var(--muted); line-height: 1.35; }.finish { margin: .8rem 0 0 auto; }
  @media (max-width: 720px) { .simulation-controls { grid-template-columns: 1fr; }.mode-toggle, .playback-actions { justify-content: stretch; }.mode-toggle > span { margin-right: auto; }.mode-toggle button, .playback-actions button { flex: 1; }.progress-row { align-items: stretch; flex-direction: column; }.view-tabs { position: sticky; top: .35rem; z-index: 3; }.game-card { min-height: 19rem; }.reward-grid { grid-template-columns: 1fr; }.finish { position: sticky; bottom: .5rem; z-index: 5; width: 100%; }.box-heading { align-items: stretch; flex-direction: column; }.box-toggle button { flex: 1; } }
</style>
