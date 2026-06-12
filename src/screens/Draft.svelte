<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Court from '../components/Court.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import { calculateRatings } from '../lib/game';
  import type { Dataset, Player, Position, RunSetup } from '../lib/types';

  export let dataset: Dataset;
  export let setup: RunSetup;
  export let initialRoster: Player[] = [];
  const dispatch = createEventDispatcher<{ confirm: Player[]; back: void }>();
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

  let selected: Player[] = initialRoster.map((player) => ({ ...player }));
  let currentIndex = 0;
  let pendingPlayer: Player | null = null;
  let reviewing = initialRoster.length === 6;

  $: currentTeam = setup.draftTeams[currentIndex];
  $: currentPlayers = dataset.players.filter((player) => player.teamId === currentTeam?.id);
  $: chosenTeamIds = new Set(selected.map((player) => player.teamId));
  $: ratings = calculateRatings(selected);
  $: hasAllPositions = positions.every((position) => selected.some((player) => player.position === position));
  $: isComplete = selected.length === 6;

  function findNextTeam(start: number): number {
    for (let offset = 0; offset < setup.draftTeams.length; offset += 1) {
      const index = (start + offset) % setup.draftTeams.length;
      if (!chosenTeamIds.has(setup.draftTeams[index].id)) return index;
    }
    return currentIndex;
  }

  function choosePlayer() {
    if (!pendingPlayer || isComplete) return;
    selected = [...selected, pendingPlayer];
    pendingPlayer = null;
    if (selected.length === 6) reviewing = true;
    else currentIndex = findNextTeam(currentIndex + 1);
  }

  function skipTeam() {
    pendingPlayer = null;
    currentIndex = findNextTeam(currentIndex + 1);
  }

  function undoLastChoice() {
    const previous = selected.at(-1);
    if (!previous) return;
    selected = selected.slice(0, -1);
    currentIndex = setup.draftTeams.findIndex((team) => team.id === previous.teamId);
    pendingPlayer = previous;
    reviewing = false;
  }

  function suggest() {
    const usedTeams = new Set<string>();
    const suggested: Player[] = [];
    for (const position of positions) {
      const player = setup.draftTeams
        .flatMap((team) => dataset.players.filter((candidate) => candidate.teamId === team.id && candidate.position === position))
        .filter((candidate) => !usedTeams.has(candidate.teamId))
        .sort((a, b) => b.overall - a.overall)[0];
      if (player) {
        suggested.push(player);
        usedTeams.add(player.teamId);
      }
    }
    const sixth = setup.draftTeams
      .flatMap((team) => dataset.players.filter((candidate) => candidate.teamId === team.id))
      .filter((candidate) => !usedTeams.has(candidate.teamId))
      .sort((a, b) => b.overall - a.overall)[0];
    selected = sixth ? [...suggested, sixth] : suggested;
    pendingPlayer = null;
    reviewing = selected.length === 6;
  }

  function resetDraft() {
    selected = [];
    pendingPlayer = null;
    currentIndex = 0;
    reviewing = false;
  }
</script>

<main class="shell page draft-page">
  <header class="page-header">
    <div>
      <span class="eyebrow">STEP 02 · DRAFT</span>
      <h1>{reviewing ? 'Confirme seu elenco' : `Escolha ${selected.length + 1} de 6`}</h1>
      <p>{reviewing ? 'Revise as seis escolhas antes de definir o modo de simulação.' : 'Escolha um atleta desta equipe ou pule para analisar a próxima.'}</p>
    </div>
    <div class="header-actions"><button class="ghost" type="button" on:click={() => dispatch('back')}>Sair</button><button class="secondary" type="button" on:click={suggest}>Sugestão automática</button></div>
  </header>

  <div class="progress" aria-label={`${selected.length} de 6 escolhas concluídas`}>
    {#each Array(6) as _, index}<span class:done={index < selected.length}></span>{/each}
  </div>

  {#if !reviewing}
    <div class="focus-layout">
      <section class="team-stage">
        <header>
          <div><span class="tier tier-{currentTeam.tier.toLowerCase()}">{currentTeam.tier}</span><div><small>{currentTeam.type} · {currentIndex + 1}/{setup.draftTeams.length}</small><h2>{currentTeam.year} {currentTeam.name}</h2></div></div>
          <button class="ghost" type="button" on:click={skipTeam}>Pular equipe →</button>
        </header>
        <div class="single-team-cards">
          {#each currentPlayers as player (player.id)}
            <PlayerCard {player} selected={pendingPlayer?.id === player.id} on:toggle={() => pendingPlayer = pendingPlayer?.id === player.id ? null : player} />
          {/each}
        </div>
        <div class="stage-actions">
          <button class="ghost" type="button" disabled={selected.length === 0} on:click={undoLastChoice}>← Voltar à escolha anterior</button>
          <button class="primary" type="button" disabled={!pendingPlayer} on:click={choosePlayer}>Escolher {pendingPlayer?.name ?? 'jogador'} <span>→</span></button>
        </div>
      </section>

      <aside class="partial-roster">
        <span class="eyebrow">ELENCO PARCIAL</span>
        <div class="chosen-list">
          {#each Array(6) as _, index}
            <div class:filled={selected[index]}><span>{index + 1}</span><strong>{selected[index]?.name ?? 'Escolha pendente'}</strong><small>{selected[index]?.position ?? '--'}</small></div>
          {/each}
        </div>
      </aside>
    </div>
  {:else}
    <div class="review-layout">
      <section class="court-panel"><Court players={selected} /></section>
      <aside class="review-panel">
        <span class="eyebrow">RESUMO DO ELENCO</span>
        <div class="review-list">
          {#each selected as player, index}<div><span>{index < 5 ? player.position : '6TH'}</span><strong>{player.name}</strong><small>{player.overall} · {player.special}</small></div>{/each}
        </div>
        <div class="ratings">
          {#each [['OVR', ratings.overall], ['ATQ', ratings.attack], ['DEF', ratings.defense], ['AST', ratings.assist], ['CLU', ratings.clutch], ['IQ', ratings.iq]] as metric}
            <div><span>{metric[0]}</span><strong>{Math.round(Number(metric[1]))}</strong></div>
          {/each}
        </div>
        {#if !hasAllPositions}<p class="error" role="alert">O elenco precisa conter PG, SG, SF, PF e C. Volte e revise as escolhas.</p>{/if}
        <div class="review-actions"><button class="ghost" type="button" on:click={undoLastChoice}>Revisar última</button><button class="ghost" type="button" on:click={resetDraft}>Refazer draft</button></div>
        <button class="primary full" type="button" disabled={!hasAllPositions} on:click={() => dispatch('confirm', selected)}>Definir simulação <span>→</span></button>
      </aside>
    </div>
  {/if}
</main>

<style>
  .draft-page { max-width: 1080px; }
  .progress { display: grid; grid-template-columns: repeat(6, 1fr); gap: .4rem; margin: -1rem 0 1.25rem; }
  .progress span { height: .3rem; background: var(--line); border-radius: 999px; }.progress span.done { background: var(--mint); }
  .focus-layout, .review-layout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(18rem, .65fr); gap: 1rem; align-items: start; }
  .team-stage, .partial-roster, .court-panel, .review-panel { padding: 1.1rem; background: var(--panel); border: 1px solid var(--line); border-radius: 1rem; }
  .team-stage > header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1rem; }.team-stage > header > div { display: flex; gap: .8rem; align-items: center; }.team-stage h2 { margin: .15rem 0 0; font: 900 clamp(1.5rem, 4vw, 2.5rem)/1 var(--font-display); text-transform: uppercase; }.team-stage small { color: var(--muted); text-transform: uppercase; }
  .tier { display: grid; place-content: center; width: 2.4rem; aspect-ratio: 1; border-radius: .5rem; background: var(--line); font: 900 .9rem/1 var(--font-display); }.tier-s { color: #15100a; background: #facc15; }.tier-a { color: #08130f; background: var(--mint); }.tier-b { color: #190d09; background: var(--orange); }
  .single-team-cards { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }
  .stage-actions { display: flex; justify-content: space-between; gap: .75rem; margin-top: 1rem; }.stage-actions button { max-width: 60%; }
  .partial-roster { position: sticky; top: 1rem; }
  .chosen-list, .review-list { display: grid; gap: .45rem; margin-top: .8rem; }.chosen-list div, .review-list div { display: grid; grid-template-columns: 2rem 1fr auto; gap: .55rem; align-items: center; padding: .7rem; color: var(--muted); background: var(--panel-2); border: 1px dashed var(--line); border-radius: .65rem; }.chosen-list div.filled { color: var(--text); border-style: solid; border-color: var(--mint); }.chosen-list span, .review-list span { color: var(--orange); font-weight: 900; }.chosen-list small, .review-list small { color: var(--muted); }
  .ratings { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; margin: .8rem 0; }.ratings div { display: grid; gap: .2rem; padding: .55rem; text-align: center; background: var(--panel-2); border-radius: .55rem; }.ratings span { color: var(--muted); font: 800 .62rem/1 var(--font-display); }.ratings strong { color: var(--cream); font: 900 1.2rem/1 var(--font-display); }
  .review-actions { display: flex; gap: .5rem; margin-bottom: .7rem; }.review-actions button { flex: 1; }.error { color: #fecdd3; background: rgba(251,113,133,.12); padding: .7rem; border-radius: .6rem; font-size: .82rem; }
  @media (max-width: 780px) { .focus-layout, .review-layout { grid-template-columns: 1fr; }.partial-roster { position: static; }.single-team-cards { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: .5rem; }.single-team-cards :global(.player-card) { min-width: min(82vw, 22rem); scroll-snap-align: center; }.stage-actions { align-items: stretch; flex-direction: column-reverse; }.stage-actions button { width: 100%; max-width: none; }.team-stage > header { align-items: stretch; flex-direction: column; } }
</style>
