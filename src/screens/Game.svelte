<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AnimatedScoreboard from '../components/AnimatedScoreboard.svelte';
  import BoxScore from '../components/BoxScore.svelte';
  import type { SeriesResult, SimulationSpeed } from '../lib/types';

  export let series: SeriesResult;
  export let round: number;
  export let speed: SimulationSpeed = 50;
  export let isFinalRound = false;

  let visibleGameIndex = 0;
  let gameComplete = false;
  const dispatch = createEventDispatcher<{ reward: 'swap' | 'training' | 'defense'; finish: void }>();

  $: visibleGame = series.games[visibleGameIndex];
  $: revealedGames = series.games.slice(0, visibleGameIndex + (gameComplete ? 1 : 0));
  $: revealedUserWins = revealedGames.filter((game) => game.winner === 'user').length;
  $: revealedOpponentWins = revealedGames.length - revealedUserWins;
  $: seriesRevealed = gameComplete && visibleGameIndex === series.games.length - 1;

  function nextGame() {
    visibleGameIndex += 1;
    gameComplete = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<main class="shell page">
  <header class="page-header game-heading">
    <div><span class="eyebrow">ROUND {round} · JOGO {visibleGame.game} DE {series.games.length}</span><h1>{series.opponent.year} {series.opponent.name}</h1><p>{gameComplete ? `Jogo ${visibleGame.game} encerrado.` : `Acompanhando o ${visibleGame.home === 'user' ? 'jogo em casa' : 'jogo fora de casa'}.`}</p></div>
    <div class:won={seriesRevealed && series.won} class="series-score"><small>SÉRIE</small><strong>{revealedUserWins}-{revealedOpponentWins}</strong></div>
  </header>

  <nav class="game-progress" aria-label="Progresso da série">
    {#each series.games as game, index}
      <span class:active={index === visibleGameIndex} class:revealed={index < visibleGameIndex || (index === visibleGameIndex && gameComplete)}>J{game.game}<b>{index < visibleGameIndex || (index === visibleGameIndex && gameComplete) ? (game.winner === 'user' ? 'W' : 'L') : '·'}</b></span>
    {/each}
  </nav>

  <section class="game-card">
    {#key visibleGameIndex}
      <AnimatedScoreboard result={visibleGame} {speed} on:complete={() => gameComplete = true} />
    {/key}

    {#if gameComplete}
      <div class="box-reveal"><span class="eyebrow">JOGO ENCERRADO</span><h2>Box score · Seu Time</h2><BoxScore rows={visibleGame.boxScore} /></div>
    {:else}
      <div class="locked-box"><span>Box score disponível após o fim da partida</span></div>
    {/if}
  </section>

  {#if gameComplete && !seriesRevealed}
    <button class="primary finish" type="button" on:click={nextGame}>Avançar para o jogo {visibleGameIndex + 2} <span>→</span></button>
  {:else if seriesRevealed && series.won && !isFinalRound}
    <section class="reward-panel">
      <div><span class="eyebrow">SÉRIE VENCIDA · RECOMPENSA</span><h2>Escolha uma vantagem</h2><p>A recompensa será aplicada antes da próxima série.</p></div>
      <div class="reward-grid">
        <button type="button" on:click={() => dispatch('reward', 'swap')}><strong>Recrutar estrela</strong><small>Troca o jogador mais fraco por destaque do adversário.</small></button>
        <button type="button" on:click={() => dispatch('reward', 'training')}><strong>Treino intensivo</strong><small>+2 ataque, defesa e overall para o atleta mais fraco.</small></button>
        <button type="button" on:click={() => dispatch('reward', 'defense')}><strong>Muralha defensiva</strong><small>+2 defesa para toda a próxima série.</small></button>
      </div>
    </section>
  {:else if seriesRevealed}
    <button class="primary finish" type="button" on:click={() => dispatch('finish')}>{series.won ? 'Ver campanha completa' : 'Ver resultado da eliminação'} <span>→</span></button>
  {/if}
</main>

<style>
  .game-progress { display: flex; gap: .5rem; margin-bottom: 1rem; overflow-x: auto; }.game-progress span { display: flex; gap: .45rem; align-items: center; padding: .65rem .8rem; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: .65rem; }.game-progress span.active { border-color: var(--orange); }.game-progress span.revealed b { color: var(--mint); }.game-progress b { color: var(--muted); }
  .box-reveal { animation: reveal .3s ease both; }.box-reveal h2 { margin: .5rem 0; }.locked-box { display: grid; place-content: center; min-height: 12rem; color: var(--muted); border: 1px dashed var(--line); border-radius: .8rem; margin-top: 1rem; }
  @keyframes reveal { from { opacity: 0; transform: translateY(.5rem); } }
</style>
