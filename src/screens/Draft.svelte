<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Court from '../components/Court.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import { calculateRatings } from '../lib/game';
  import type { Dataset, Lineup, LineupSlot, Player, Position, RunSetup } from '../lib/types';

  export let dataset: Dataset;
  export let setup: RunSetup;
  export let initialLineup: Lineup;

  const dispatch = createEventDispatcher<{ confirm: Lineup; back: void }>();
  const slots: LineupSlot[] = ['PG', 'SG', 'SF', 'PF', 'C', 'Six'];
  const adjacent: Record<Position, Position[]> = {
    PG: ['PG', 'SG'],
    SG: ['SG', 'PG', 'SF'],
    SF: ['SF', 'SG', 'PF'],
    PF: ['PF', 'SF', 'C'],
    C: ['C', 'PF'],
  };

  let lineup: Lineup = { ...initialLineup };
  let currentIndex = 0;
  let selectedPlayer: Player | null = null;
  let reviewing = slots.every((slot) => lineup[slot]);
  let history: { player: Player; slot: LineupSlot; teamIndex: number }[] = [];

  $: selected = slots.map((slot) => lineup[slot]).filter((player): player is Player => Boolean(player));
  $: currentTeam = setup.draftTeams[currentIndex];
  $: currentPlayers = dataset.players.filter((player) => player.teamId === currentTeam?.id);
  $: chosenTeamIds = new Set(selected.map((player) => player.teamId));
  $: ratings = calculateRatings(selected);
  $: nextNeeded = slots.find((slot) => !lineup[slot]) ?? null;
  $: isComplete = slots.every((slot) => lineup[slot]);
  $: allowedSlots = selectedPlayer ? [...adjacent[selectedPlayer.position], 'Six'] as LineupSlot[] : [];

  function findNextTeam(start: number): number {
    for (let offset = 0; offset < setup.draftTeams.length; offset += 1) {
      const index = (start + offset) % setup.draftTeams.length;
      if (!chosenTeamIds.has(setup.draftTeams[index].id)) return index;
    }
    return currentIndex;
  }

  function openPositionPanel(player: Player) {
    selectedPlayer = selectedPlayer?.id === player.id ? null : player;
  }

  function assignPosition(slot: LineupSlot) {
    if (!selectedPlayer || lineup[slot] || !allowedSlots.includes(slot)) return;
    lineup = { ...lineup, [slot]: selectedPlayer };
    history = [...history, { player: selectedPlayer, slot, teamIndex: currentIndex }];
    selectedPlayer = null;
    if (slots.every((item) => lineup[item])) reviewing = true;
    else currentIndex = findNextTeam(currentIndex + 1);
  }

  function skipTeam() {
    selectedPlayer = null;
    currentIndex = findNextTeam(currentIndex + 1);
  }

  function removeSlot(slot: LineupSlot) {
    const removed = lineup[slot];
    if (!removed) return;
    lineup = { ...lineup, [slot]: null };
    history = history.filter((entry) => entry.player.id !== removed.id);
    currentIndex = setup.draftTeams.findIndex((team) => team.id === removed.teamId);
    selectedPlayer = removed;
    reviewing = false;
  }

  function undoLastChoice() {
    const previous = history.at(-1);
    if (!previous) return;
    lineup = { ...lineup, [previous.slot]: null };
    history = history.slice(0, -1);
    currentIndex = previous.teamIndex;
    selectedPlayer = previous.player;
    reviewing = false;
  }

  function suggest() {
    const usedTeams = new Set<string>();
    const nextLineup: Lineup = { PG: null, SG: null, SF: null, PF: null, C: null, Six: null };
    const nextHistory: typeof history = [];

    for (const slot of slots.filter((item): item is Position => item !== 'Six')) {
      const player = setup.draftTeams
        .flatMap((team) => dataset.players.filter((candidate) => candidate.teamId === team.id && adjacent[candidate.position].includes(slot)))
        .filter((candidate) => !usedTeams.has(candidate.teamId))
        .sort((a, b) => b.overall - a.overall)[0];
      if (player) {
        nextLineup[slot] = player;
        usedTeams.add(player.teamId);
        nextHistory.push({ player, slot, teamIndex: setup.draftTeams.findIndex((team) => team.id === player.teamId) });
      }
    }

    const sixth = setup.draftTeams
      .flatMap((team) => dataset.players.filter((candidate) => candidate.teamId === team.id))
      .filter((candidate) => !usedTeams.has(candidate.teamId))
      .sort((a, b) => b.overall - a.overall)[0];
    if (sixth) {
      nextLineup.Six = sixth;
      nextHistory.push({ player: sixth, slot: 'Six', teamIndex: setup.draftTeams.findIndex((team) => team.id === sixth.teamId) });
    }

    lineup = nextLineup;
    history = nextHistory;
    selectedPlayer = null;
    reviewing = slots.every((slot) => lineup[slot]);
  }

  function resetDraft() {
    lineup = { PG: null, SG: null, SF: null, PF: null, C: null, Six: null };
    history = [];
    selectedPlayer = null;
    currentIndex = 0;
    reviewing = false;
  }
</script>

<main class="shell page draft-page">
  <header class="page-header">
    <div>
      <span class="eyebrow">STEP 02 · DRAFT</span>
      <h1>{reviewing ? 'Confirme seu elenco' : `Escolha ${selected.length + 1} de 6`}</h1>
      <p>{reviewing ? 'Revise jogadores e posições antes de definir a simulação.' : 'Escolha um atleta, atribua uma vaga na quadra ou pule para a próxima equipe.'}</p>
    </div>
    <div class="header-actions"><button class="ghost" type="button" on:click={() => dispatch('back')}>Sair</button><button class="secondary" type="button" on:click={suggest}>Sugestão automática</button></div>
  </header>

  <div class="progress" aria-label={`${selected.length} de 6 escolhas concluídas`}>
    {#each Array(6) as _, index}<span class:done={index < selected.length}></span>{/each}
  </div>

  <div class="draft-grid">
    <section class="team-stage">
      {#if !reviewing}
        <header>
          <div><span class="tier tier-{currentTeam.tier.toLowerCase()}">{currentTeam.tier}</span><div><small>{currentTeam.type} · {currentIndex + 1}/{setup.draftTeams.length}</small><h2>{currentTeam.year} {currentTeam.name}</h2></div></div>
          <button class="ghost" type="button" on:click={skipTeam}>Pular equipe →</button>
        </header>

        <div class="single-team-cards">
          {#each currentPlayers as player (player.id)}
            <PlayerCard {player} selected={selectedPlayer?.id === player.id} on:toggle={() => openPositionPanel(player)} />
          {/each}
        </div>

        {#if selectedPlayer}
          <section class="position-panel" aria-labelledby="position-title">
            <div><span class="eyebrow">DEFINIR VAGA</span><h3 id="position-title">Onde {selectedPlayer.name} vai jogar?</h3><p>Posição primária: {selectedPlayer.position}. Também aceitamos uma posição adjacente ou sexto homem.</p></div>
            <div class="position-options">
              {#each slots as slot}
                <button type="button" disabled={!allowedSlots.includes(slot) || Boolean(lineup[slot])} class:recommended={slot === nextNeeded} on:click={() => assignPosition(slot)}>
                  <strong>{slot === 'Six' ? '6TH' : slot}</strong><small>{lineup[slot] ? 'Ocupada' : allowedSlots.includes(slot) ? 'Disponível' : 'Incompatível'}</small>
                </button>
              {/each}
            </div>
            <button class="ghost cancel" type="button" on:click={() => selectedPlayer = null}>Cancelar</button>
          </section>
        {/if}

        <div class="stage-actions"><button class="ghost" type="button" disabled={history.length === 0} on:click={undoLastChoice}>← Voltar à escolha anterior</button><button class="ghost" type="button" on:click={resetDraft}>Refazer draft</button></div>
      {:else}
        <div class="review-copy"><span class="eyebrow">FORMAÇÃO COMPLETA</span><h2>Pronto para os playoffs</h2><p>As posições abaixo serão usadas na apresentação da campanha. O motor continua avaliando os seis atletas em conjunto.</p></div>
        <div class="ratings">
          {#each [['OVR', ratings.overall], ['ATQ', ratings.attack], ['DEF', ratings.defense], ['AST', ratings.assist], ['CLU', ratings.clutch], ['IQ', ratings.iq]] as metric}
            <div><span>{metric[0]}</span><strong>{Math.round(Number(metric[1]))}</strong></div>
          {/each}
        </div>
        <div class="review-actions"><button class="ghost" type="button" on:click={undoLastChoice}>Revisar última</button><button class="ghost" type="button" on:click={resetDraft}>Refazer draft</button></div>
        <button class="primary full" type="button" on:click={() => dispatch('confirm', lineup)}>Definir simulação <span>→</span></button>
      {/if}
    </section>

    <aside class="lineup-panel">
      <span class="eyebrow">QUADRA · {selected.length}/6</span>
      <Court {lineup} activeSlot={reviewing ? null : nextNeeded} compact />
      <div class="chosen-list">
        {#each slots as slot}
          <div class:filled={lineup[slot]} class:active={nextNeeded === slot && !reviewing}>
            <span>{slot === 'Six' ? '6TH' : slot}</span>
            <strong>{lineup[slot]?.name ?? 'Vaga livre'}</strong>
            {#if lineup[slot]}<button type="button" aria-label={`Remover ${lineup[slot]?.name}`} on:click={() => removeSlot(slot)}>Remover</button>{:else}<small>{nextNeeded === slot ? 'Recomendada' : 'Livre'}</small>{/if}
          </div>
        {/each}
      </div>
    </aside>
  </div>
</main>

<style>
  .draft-page { max-width: 1120px; }.progress { display: grid; grid-template-columns: repeat(6, 1fr); gap: .4rem; margin: -1rem 0 1.25rem; }.progress span { height: .3rem; background: var(--line); border-radius: 999px; }.progress span.done { background: var(--mint); }
  .draft-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(20rem, .75fr); gap: 1rem; align-items: start; }.team-stage, .lineup-panel { padding: 1.1rem; background: var(--panel); border: 1px solid var(--line); border-radius: 1rem; }.lineup-panel { position: sticky; top: 1rem; }
  .team-stage > header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1rem; }.team-stage > header > div { display: flex; gap: .8rem; align-items: center; }.team-stage h2, .review-copy h2 { margin: .15rem 0 0; font: 900 clamp(1.5rem, 4vw, 2.5rem)/1 var(--font-display); text-transform: uppercase; }.team-stage small, .review-copy p { color: var(--muted); }.tier { display: grid; place-content: center; width: 2.4rem; aspect-ratio: 1; border-radius: .5rem; font: 900 .9rem/1 var(--font-display); }.tier-s { color: #15100a; background: #facc15; }.tier-a { color: #08130f; background: var(--mint); }.tier-b { color: #190d09; background: var(--orange); }
  .single-team-cards { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }.position-panel { margin-top: .8rem; padding: 1rem; background: #0d1320; border: 1px solid var(--orange); border-radius: .9rem; animation: reveal .2s ease both; }.position-panel h3 { margin: .3rem 0; font: 900 1.35rem/1 var(--font-display); text-transform: uppercase; }.position-panel p { margin: 0; color: var(--muted); font-size: .82rem; }.position-options { display: grid; grid-template-columns: repeat(6, 1fr); gap: .4rem; margin-top: .8rem; }.position-options button { display: grid; gap: .2rem; padding: .65rem .3rem; color: var(--text); background: var(--panel-2); border: 1px solid var(--line); border-radius: .6rem; cursor: pointer; }.position-options button:disabled { cursor: not-allowed; opacity: .35; }.position-options button.recommended:not(:disabled) { border-color: var(--cream); animation: pulse-option 1.1s infinite; }.position-options small { font-size: .58rem; }.cancel { margin-top: .6rem; }
  .stage-actions, .review-actions { display: flex; gap: .5rem; margin-top: .8rem; }.stage-actions button, .review-actions button { flex: 1; }.ratings { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; margin: 1rem 0; }.ratings div { display: grid; gap: .2rem; padding: .7rem; text-align: center; background: var(--panel-2); border-radius: .55rem; }.ratings span { color: var(--muted); font: 800 .62rem/1 var(--font-display); }.ratings strong { color: var(--cream); font: 900 1.35rem/1 var(--font-display); }
  .lineup-panel > .eyebrow { display: block; margin-bottom: .65rem; }.chosen-list { display: grid; gap: .35rem; margin-top: .65rem; }.chosen-list div { display: grid; grid-template-columns: 2.3rem 1fr auto; gap: .45rem; align-items: center; padding: .55rem; color: var(--muted); background: var(--panel-2); border: 1px dashed var(--line); border-radius: .6rem; }.chosen-list div.filled { color: var(--text); border-style: solid; border-color: var(--mint); }.chosen-list div.active { border-color: var(--cream); }.chosen-list span { color: var(--orange); font-weight: 900; }.chosen-list button { padding: .3rem; color: var(--red); background: none; border: 0; cursor: pointer; font-size: .65rem; }.chosen-list small { font-size: .65rem; }
  @keyframes pulse-option { 50% { box-shadow: 0 0 .8rem rgba(240,118,54,.55); } } @keyframes reveal { from { opacity: 0; transform: translateY(.35rem); } }
  @media (max-width: 840px) { .draft-grid { grid-template-columns: 1fr; }.lineup-panel { position: static; grid-row: 1; }.single-team-cards { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: .45rem; }.single-team-cards :global(.player-card) { min-width: min(82vw, 22rem); scroll-snap-align: center; }.position-options { grid-template-columns: repeat(3, 1fr); }.team-stage > header { align-items: stretch; flex-direction: column; } }
</style>
