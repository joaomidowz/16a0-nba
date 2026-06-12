<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import AnimatedScoreboard from '../components/AnimatedScoreboard.svelte';
  import BoxScore from '../components/BoxScore.svelte';
  import type { SeriesResult, SimulationMode, SimulationSpeed } from '../lib/types';

  export let series: SeriesResult;
  export let round: number;
  export let mode: SimulationMode = 'manual';
  export let speed: SimulationSpeed = 50;
  export let isFinalRound = false;

  let visibleGameIndex = 0;
  let gameComplete = false;
  let quarterPaused = false;
  let scoreboard: { resumeQuarter: () => void; skipAnimation: () => void };
  let autoTimer: ReturnType<typeof setTimeout> | null = null;
  const dispatch = createEventDispatcher<{
    config: { mode: SimulationMode; speed: SimulationSpeed };
    autoContinue: void;
    reward: 'swap' | 'training' | 'defense';
    finish: void;
  }>();

  $: visibleGame = series.games[visibleGameIndex];
  $: revealedGames = series.games.slice(0, visibleGameIndex + (gameComplete ? 1 : 0));
  $: revealedUserWins = revealedGames.filter((game) => game.winner === 'user').length;
  $: revealedOpponentWins = revealedGames.length - revealedUserWins;
  $: seriesRevealed = gameComplete && visibleGameIndex === series.games.length - 1;

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
    }, 1400);
  }

  function handleComplete() {
    gameComplete = true;
    quarterPaused = false;
    scheduleAutoAdvance();
  }

  function nextGame() {
    clearAutoTimer();
    visibleGameIndex += 1;
    gameComplete = false;
    quarterPaused = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function changeMode(nextMode: SimulationMode) {
    mode = nextMode;
    quarterPaused = false;
    dispatch('config', { mode, speed });
    if (mode === 'automatic') scheduleAutoAdvance();
    else clearAutoTimer();
  }

  function changeSpeed() {
    dispatch('config', { mode, speed });
  }

  function nextQuarter() {
    quarterPaused = false;
    scoreboard.resumeQuarter();
  }

  function skipAnimation() {
    scoreboard.skipAnimation();
  }

  onDestroy(clearAutoTimer);
</script>

<main class="shell page">
  <header class="page-header game-heading">
    <div><span class="eyebrow">ROUND {round} · JOGO {visibleGame.game} DE {series.games.length}</span><h1>{series.opponent.year} {series.opponent.name}</h1><p>{gameComplete ? `Jogo ${visibleGame.game} encerrado.` : `Acompanhando o ${visibleGame.home === 'user' ? 'jogo em casa' : 'jogo fora de casa'}.`}</p></div>
    <div class:won={seriesRevealed && series.won} class="series-score"><small>SÉRIE</small><strong>{revealedUserWins}-{revealedOpponentWins}</strong></div>
  </header>

  <section class="simulation-controls" aria-label="Controles da simulação">
    <div class="mode-toggle">
      <span>Modo</span>
      <button type="button" class:active={mode === 'automatic'} aria-pressed={mode === 'automatic'} on:click={() => changeMode('automatic')}>Automático</button>
      <button type="button" class:active={mode === 'manual'} aria-pressed={mode === 'manual'} on:click={() => changeMode('manual')}>Manual</button>
    </div>
    <label class="speed-control">
      <span>Velocidade <strong>{speed} ms</strong></span>
      <input type="range" min="25" max="200" step="25" bind:value={speed} on:input={changeSpeed} />
    </label>
    <button class="skip" type="button" disabled={gameComplete} on:click={skipAnimation}>Pular animação</button>
  </section>

  <nav class="game-progress" aria-label="Progresso da série">
    {#each series.games as game, index}
      <span class:active={index === visibleGameIndex} class:revealed={index < visibleGameIndex || (index === visibleGameIndex && gameComplete)}>J{game.game}<b>{index < visibleGameIndex || (index === visibleGameIndex && gameComplete) ? (game.winner === 'user' ? 'W' : 'L') : '·'}</b></span>
    {/each}
  </nav>

  <section class="game-card">
    {#key visibleGameIndex}
      <AnimatedScoreboard bind:this={scoreboard} result={visibleGame} {speed} {mode} on:pause={() => quarterPaused = true} on:resume={() => quarterPaused = false} on:complete={handleComplete} />
    {/key}

    {#if quarterPaused && !gameComplete && mode === 'manual'}
      <div class="quarter-break"><div><span class="eyebrow">FIM DO QUARTO</span><strong>O placar está preservado</strong></div><button class="primary" type="button" on:click={nextQuarter}>Próximo quarto <span>→</span></button></div>
    {/if}

    {#if gameComplete}
      <div class="box-reveal"><span class="eyebrow">JOGO ENCERRADO</span><h2>Box score · Seu Time</h2><BoxScore rows={visibleGame.boxScore} /></div>
    {:else}
      <div class="locked-box"><span>Box score disponível após o fim da partida</span></div>
    {/if}
  </section>

  {#if gameComplete && !seriesRevealed && mode === 'manual'}
    <button class="primary finish" type="button" on:click={nextGame}>Avançar para o jogo {visibleGameIndex + 2} <span>→</span></button>
  {:else if seriesRevealed && series.won && !isFinalRound && mode === 'manual'}
    <section class="reward-panel">
      <div><span class="eyebrow">SÉRIE VENCIDA · RECOMPENSA</span><h2>Escolha uma vantagem</h2><p>A recompensa será aplicada antes da próxima série.</p></div>
      <div class="reward-grid">
        <button type="button" on:click={() => dispatch('reward', 'swap')}><strong>Recrutar estrela</strong><small>Troca o jogador mais fraco por destaque do adversário.</small></button>
        <button type="button" on:click={() => dispatch('reward', 'training')}><strong>Treino intensivo</strong><small>+2 ataque, defesa e overall para o atleta mais fraco.</small></button>
        <button type="button" on:click={() => dispatch('reward', 'defense')}><strong>Muralha defensiva</strong><small>+2 defesa para toda a próxima série.</small></button>
      </div>
    </section>
  {:else if seriesRevealed && mode === 'manual'}
    <button class="primary finish" type="button" on:click={() => dispatch('finish')}>{series.won ? 'Ver campanha completa' : 'Ver resultado da eliminação'} <span>→</span></button>
  {/if}
</main>

<style>
  .simulation-controls { display: grid; grid-template-columns: auto minmax(14rem, 1fr) auto; gap: 1rem; align-items: center; margin-bottom: 1rem; padding: .8rem; background: var(--panel); border: 1px solid var(--line); border-radius: .9rem; }.mode-toggle { display: flex; gap: .35rem; align-items: center; }.mode-toggle > span, .speed-control > span { color: var(--muted); font-size: .72rem; font-weight: 800; text-transform: uppercase; }.mode-toggle button, .skip { padding: .55rem .7rem; color: var(--muted); background: var(--panel-2); border: 1px solid var(--line); border-radius: .55rem; cursor: pointer; }.mode-toggle button.active { color: var(--bg); background: var(--mint); border-color: var(--mint); }.speed-control { display: grid; gap: .35rem; }.speed-control > span { display: flex; justify-content: space-between; }.speed-control strong { color: var(--cream); }.speed-control input { width: 100%; accent-color: var(--orange); }.skip { color: var(--cream); }.skip:disabled { cursor: default; opacity: .4; }
  .game-progress { display: flex; gap: .5rem; margin-bottom: 1rem; overflow-x: auto; }.game-progress span { display: flex; gap: .45rem; align-items: center; padding: .65rem .8rem; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: .65rem; }.game-progress span.active { border-color: var(--orange); }.game-progress span.revealed b { color: var(--mint); }.game-progress b { color: var(--muted); }
  .quarter-break { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-top: 1rem; padding: .8rem; background: color-mix(in srgb, var(--orange) 10%, var(--panel-2)); border: 1px solid var(--orange); border-radius: .8rem; }.quarter-break div { display: grid; gap: .25rem; }.box-reveal { animation: reveal .3s ease both; }.box-reveal h2 { margin: .5rem 0; }.locked-box { display: grid; place-content: center; min-height: 12rem; color: var(--muted); border: 1px dashed var(--line); border-radius: .8rem; margin-top: 1rem; } @keyframes reveal { from { opacity: 0; transform: translateY(.5rem); } }
  @media (max-width: 720px) { .simulation-controls { grid-template-columns: 1fr; }.mode-toggle { flex-wrap: wrap; }.mode-toggle > span { width: 100%; }.quarter-break { align-items: stretch; flex-direction: column; } }
</style>
