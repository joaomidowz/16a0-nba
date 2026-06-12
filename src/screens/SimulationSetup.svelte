<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GameMode, Player, SimulationMode, SimulationSpeed } from '../lib/types';

  export let roster: Player[];
  export let initialMode: SimulationMode = 'manual';
  export let initialSpeed: SimulationSpeed = 50;
  export let gameMode: GameMode;
  let mode: SimulationMode = initialMode;
  let speed: SimulationSpeed = initialSpeed;
  let rewardsEnabled = gameMode === 'arcade';
  $: hideRatings = gameMode === 'hardcore';
  const dispatch = createEventDispatcher<{ start: { mode: SimulationMode; speed: SimulationSpeed; rewardsEnabled: boolean }; back: void }>();
</script>

<main class="shell page simulation-page">
  <header class="page-header">
    <div><span class="eyebrow">STEP 03 · SIMULAÇÃO</span><h1>Como você quer assistir?</h1><p>Os resultados são calculados pelo mesmo seed. Você escolhe apenas como eles serão revelados.</p></div>
    <button class="ghost" type="button" on:click={() => dispatch('back')}>Voltar ao elenco</button>
  </header>

  <section class="simulation-grid">
    <button type="button" class:active={mode === 'automatic'} on:click={() => mode = 'automatic'}>
      <span>AUTO</span><strong>Simulação automática</strong><small>Exibe os jogos e avança sozinho entre quartos, partidas e séries.</small>
    </button>
    <button type="button" class:active={mode === 'manual'} on:click={() => mode = 'manual'}>
      <span>LIVE</span><strong>Simulação manual</strong><small>Acompanhe a animação completa e avance somente ao fim de cada jogo.</small>
    </button>
  </section>

  {#if mode === 'manual'}
    <section class="speed-panel">
      <div><span class="eyebrow">VELOCIDADE</span><h2>Ritmo da animação</h2></div>
      <div class="speed-options">
        {#each [{ value: 150, label: 'Lenta' }, { value: 75, label: 'Normal' }, { value: 25, label: 'Rápida' }] as option}
          <button type="button" class:active={speed === option.value} on:click={() => speed = option.value as SimulationSpeed}>{option.label}<small>{option.value} ms</small></button>
        {/each}
      </div>
    </section>
  {/if}

  <section class="rewards-option" class:enabled={rewardsEnabled}>
    <div><span class="eyebrow">RECOMPENSAS</span><strong>{gameMode === 'arcade' ? 'Power-ups entre séries' : 'Sem vantagens nesta run'}</strong><small>{gameMode === 'arcade' ? 'Até dois usos durante a campanha. Você pode desativar para uma run limpa.' : 'Bônus ficam reservados ao modo Arcade.'}</small></div>
    {#if gameMode === 'arcade'}<label><input type="checkbox" bind:checked={rewardsEnabled} /> Ativar</label>{/if}
  </section>

  <section class="roster-strip" aria-label="Elenco confirmado">
    {#each roster as player}<div><span>{player.position}</span><strong>{player.name}</strong><small>{hideRatings ? player.special : `${player.overall} OVR`}</small></div>{/each}
  </section>

  <button class="primary launch" type="button" on:click={() => dispatch('start', { mode, speed, rewardsEnabled })}>Iniciar campanha <span>→</span></button>
</main>

<style>
  .simulation-page { max-width: 980px; }
  .simulation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .simulation-grid > button { min-height: 14rem; display: grid; align-content: end; gap: .55rem; padding: 1.25rem; color: var(--text); text-align: left; background: var(--panel); border: 1px solid var(--line); border-radius: 1rem; cursor: pointer; }
  .simulation-grid > button:hover, .simulation-grid > button.active { border-color: var(--orange); background: color-mix(in srgb, var(--orange) 9%, var(--panel)); }
  .simulation-grid span { color: var(--orange); font: 900 .75rem/1 var(--font-display); letter-spacing: .1em; }
  .simulation-grid strong { font: 900 1.5rem/1 var(--font-display); text-transform: uppercase; }
  .simulation-grid small { color: var(--muted); line-height: 1.5; }
  .speed-panel { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-top: 1rem; padding: 1.1rem; background: var(--panel); border: 1px solid var(--line); border-radius: 1rem; }
  .speed-panel h2 { margin: .3rem 0 0; font: 900 1.4rem/1 var(--font-display); text-transform: uppercase; }
  .speed-options { display: flex; gap: .45rem; }
  .speed-options button { display: grid; gap: .2rem; min-width: 6rem; padding: .65rem; color: var(--text); background: var(--panel-2); border: 1px solid var(--line); border-radius: .65rem; cursor: pointer; }
  .speed-options button.active { border-color: var(--mint); }.speed-options small { color: var(--muted); }
  .roster-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: .5rem; margin-top: 1rem; }
  .roster-strip div { display: grid; gap: .25rem; min-width: 0; padding: .7rem; background: var(--panel); border: 1px solid var(--line); border-radius: .7rem; }
  .roster-strip span { color: var(--orange); font-weight: 900; }.roster-strip strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: .8rem; }.roster-strip small { color: var(--muted); }
  .rewards-option { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-top: 1rem; padding: 1rem; background: var(--panel); border: 1px solid var(--line); border-radius: 1rem; }.rewards-option.enabled { border-color: var(--orange); }.rewards-option > div { display: grid; gap: .3rem; }.rewards-option small { color: var(--muted); }.rewards-option label { display: flex; gap: .45rem; align-items: center; font-weight: 800; }.rewards-option input { width: 1.15rem; height: 1.15rem; accent-color: var(--orange); }
  .launch { margin: 1rem 0 0 auto; }
  @media (max-width: 720px) { .simulation-grid { grid-template-columns: 1fr; }.simulation-grid > button { min-height: 10rem; }.speed-panel, .rewards-option { align-items: stretch; flex-direction: column; }.speed-options { width: 100%; }.speed-options button { flex: 1; min-width: 0; }.roster-strip { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }.roster-strip div { min-width: 9rem; scroll-snap-align: start; }.launch { position: sticky; bottom: .5rem; z-index: 4; width: 100%; } }
</style>
