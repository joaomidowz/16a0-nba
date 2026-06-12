<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Court from '../components/Court.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import { calculateRatings } from '../lib/game';
  import { isLegend, type Dataset, type Lineup, type LineupSlot, type Player, type Position, type RunSetup } from '../lib/types';

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
  let skipsUsed = 0;

  $: selected = slots.map((slot) => lineup[slot]).filter((player): player is Player => Boolean(player));
  $: currentTeam = setup.draftTeams[currentIndex];
  $: currentPlayers = dataset.players.filter((player) => player.teamId === currentTeam?.id);
  $: chosenTeamIds = new Set(selected.map((player) => player.teamId));
  $: ratings = calculateRatings(selected);
  $: nextNeeded = slots.find((slot) => !lineup[slot]) ?? null;
  $: allowedSlots = selectedPlayer ? [...adjacent[selectedPlayer.position], 'Six'] as LineupSlot[] : [];
  $: skipLimit = setup.mode === 'hardcore' ? 1 : 2;
  $: skipsRemaining = Math.max(0, skipLimit - skipsUsed);
  $: hideRatings = setup.mode === 'hardcore';

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
    selectedPlayer = null;
    if (slots.every((item) => lineup[item])) reviewing = true;
    else currentIndex = findNextTeam(currentIndex + 1);
  }

  function skipTeam() {
    if (skipsRemaining === 0) return;
    selectedPlayer = null;
    skipsUsed += 1;
    currentIndex = findNextTeam(currentIndex + 1);
  }

</script>

<main class="shell page draft-page">
  <header class="page-header">
    <div>
      <span class="eyebrow">STEP 02 · DRAFT</span>
      <h1>{reviewing ? 'Confirme seu elenco' : `Escolha ${selected.length + 1} de 6`}</h1>
      <p>{reviewing ? 'Revise jogadores e posições antes de definir a simulação.' : 'Escolha um atleta, atribua uma vaga na quadra ou pule para a próxima equipe.'}</p>
    </div>
    <div class="header-actions"><button class="ghost" type="button" on:click={() => dispatch('back')}>Sair</button></div>
  </header>

  <div class="progress" aria-label={`${selected.length} de 6 escolhas concluídas`}>
    {#each Array(6) as _, index}<span class:done={index < selected.length}></span>{/each}
  </div>

  <div class="draft-grid">
    <section class="team-stage">
      {#if !reviewing}
        <header>
          <div><span class="tier tier-{currentTeam.tier.toLowerCase()}">{currentTeam.tier}</span><div><small>{currentTeam.type} · {currentIndex + 1}/{setup.draftTeams.length}</small><h2>{currentTeam.year} {currentTeam.name}</h2></div></div>
          <button class="ghost skip-team" type="button" disabled={skipsRemaining === 0} on:click={skipTeam}>Pular equipe ({skipsRemaining}/{skipLimit}) →</button>
        </header>

        <div class="single-team-cards">
          {#each currentPlayers as player (player.id)}
            <PlayerCard {player} hideOverall={hideRatings} selected={selectedPlayer?.id === player.id} on:toggle={() => openPositionPanel(player)} />
          {/each}
        </div>

        {#if selectedPlayer}
          <section class="position-panel desktop-position-panel" aria-labelledby="desktop-position-title">
            <div><span class="eyebrow">DEFINIR VAGA</span><h3 id="desktop-position-title">Onde {selectedPlayer.name} vai jogar?</h3><p>Posição primária: {selectedPlayer.position}. Escolha uma vaga disponível.</p></div>
            <div class="position-options">
              {#each slots as slot}
                <button type="button" disabled={!allowedSlots.includes(slot) || Boolean(lineup[slot])} class:recommended={slot === nextNeeded} on:click={() => assignPosition(slot)}>
                  <strong>{slot === 'Six' ? '6TH' : slot}</strong><small>{lineup[slot] ? 'Ocupada' : allowedSlots.includes(slot) ? 'Disponível' : 'Incompatível'}</small>
                </button>
              {/each}
            </div>
            <button class="ghost cancel" type="button" on:click={() => selectedPlayer = null}>Cancelar</button>
          </section>

          <section class="position-panel mobile-position-panel" aria-labelledby="mobile-position-title">
            <div><span class="eyebrow">DEFINIR VAGA</span><h3 id="mobile-position-title">Onde {selectedPlayer.name} vai jogar?</h3><p>Posição primária: {selectedPlayer.position}. Escolha uma vaga disponível.</p></div>
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
      {:else}
        <div class="review-copy"><span class="eyebrow">FORMAÇÃO COMPLETA</span><h2>Pronto para os playoffs</h2><p>As posições abaixo serão usadas na apresentação da campanha. O motor continua avaliando os seis atletas em conjunto.</p></div>
        {#if hideRatings}
          <div class="hidden-ratings"><span>HARDCORE</span><strong>Notas ocultas</strong><small>Confie nas posições e habilidades especiais do elenco.</small></div>
        {:else}
          <div class="ratings">
            {#each [['OVR', ratings.overall], ['ATQ', ratings.attack], ['DEF', ratings.defense], ['AST', ratings.assist], ['CLU', ratings.clutch], ['IQ', ratings.iq]] as metric}
              <div><span>{metric[0]}</span><strong>{Math.round(Number(metric[1]))}</strong></div>
            {/each}
          </div>
        {/if}
        <button class="primary full" type="button" on:click={() => dispatch('confirm', lineup)}>Definir simulação <span>→</span></button>
      {/if}
    </section>

    <aside class="lineup-panel">
      <span class="eyebrow">QUADRA · {selected.length}/6</span>
      <Court {lineup} activeSlot={reviewing ? null : nextNeeded} compact />
      <div class="chosen-list">
        {#each slots as slot}
          <div class:filled={lineup[slot]} class:legend={Boolean(lineup[slot] && isLegend(lineup[slot]))} class:active={nextNeeded === slot && !reviewing}>
            <span>{slot === 'Six' ? '6TH' : slot}</span>
            <strong>{lineup[slot]?.name ?? 'Vaga livre'}</strong>
            {#if lineup[slot]}<small>Confirmado</small>{:else}<small>{nextNeeded === slot ? 'Recomendada' : 'Livre'}</small>{/if}
          </div>
        {/each}
      </div>
    </aside>
  </div>
</main>

<style>
  .draft-page { max-width: 1120px; }.progress { display: grid; grid-template-columns: repeat(6, 1fr); gap: .4rem; margin: -1rem 0 1.25rem; }.progress span { height: .3rem; background: var(--line); border-radius: 999px; }.progress span.done { background: var(--mint); }
  .draft-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(20rem, .75fr); gap: 1rem; align-items: start; }.team-stage, .lineup-panel { min-width: 0; padding: 1.1rem; background: var(--panel); border: 1px solid var(--line); border-radius: 1rem; }.lineup-panel { position: sticky; top: 1rem; }
  .team-stage > header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1rem; }.team-stage > header > div { display: flex; gap: .8rem; align-items: center; }.team-stage h2, .review-copy h2 { margin: .15rem 0 0; font: 900 clamp(1.5rem, 4vw, 2.5rem)/1 var(--font-display); text-transform: uppercase; }.team-stage small, .review-copy p { color: var(--muted); }.tier { display: grid; place-content: center; width: 2.4rem; aspect-ratio: 1; border-radius: .5rem; font: 900 .9rem/1 var(--font-display); }.tier-s { color: #15100a; background: #facc15; }.tier-a { color: #08130f; background: var(--mint); }.tier-b { color: #190d09; background: var(--orange); }
  .single-team-cards { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }.position-panel { margin-top: .8rem; padding: 1rem; background: #0d1320; border: 1px solid var(--orange); border-radius: .9rem; animation: reveal .2s ease both; }.position-panel h3 { margin: .3rem 0; font: 900 1.35rem/1 var(--font-display); text-transform: uppercase; }.position-panel p { margin: 0; color: var(--muted); font-size: .82rem; }.position-options { display: grid; grid-template-columns: repeat(6, 1fr); gap: .4rem; margin-top: .8rem; }.position-options button { display: grid; gap: .2rem; min-width: 0; padding: .65rem .3rem; color: var(--text); background: var(--panel-2); border: 1px solid var(--line); border-radius: .6rem; cursor: pointer; }.position-options button:disabled { cursor: not-allowed; opacity: .35; }.position-options button.recommended:not(:disabled) { border-color: var(--cream); animation: pulse-option 1.1s infinite; }.position-options small { font-size: .58rem; }.cancel { margin-top: .6rem; }.mobile-position-panel { display: none; }
  .ratings { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; margin: 1rem 0; }.ratings div { display: grid; gap: .2rem; padding: .7rem; text-align: center; background: var(--panel-2); border-radius: .55rem; }.ratings span { color: var(--muted); font: 800 .62rem/1 var(--font-display); }.ratings strong { color: var(--cream); font: 900 1.35rem/1 var(--font-display); }
  .hidden-ratings { display: grid; gap: .25rem; margin: 1rem 0; padding: 1rem; text-align: center; background: var(--panel-2); border: 1px dashed var(--orange); border-radius: .7rem; }.hidden-ratings span { color: var(--orange); font: 900 .7rem/1 var(--font-display); }.hidden-ratings small { color: var(--muted); }.skip-team:disabled { opacity: .4; cursor: not-allowed; }
  .lineup-panel > .eyebrow { display: block; margin-bottom: .65rem; }.chosen-list { display: grid; gap: .35rem; margin-top: .65rem; }.chosen-list div { display: grid; grid-template-columns: 2.3rem 1fr auto; gap: .45rem; align-items: center; padding: .55rem; color: var(--muted); background: var(--panel-2); border: 1px dashed var(--line); border-radius: .6rem; }.chosen-list div.filled { color: var(--text); border-style: solid; border-color: var(--mint); }.chosen-list div.legend { border-color: #d6a928; box-shadow: inset 0 0 0 1px rgba(250, 204, 21, .18); }.chosen-list div.active { border-color: var(--cream); }.chosen-list span { color: var(--orange); font-weight: 900; }.chosen-list small { font-size: .65rem; }
  @keyframes pulse-option { 50% { box-shadow: 0 0 .8rem rgba(240,118,54,.55); } } @keyframes reveal { from { opacity: 0; transform: translateY(.35rem); } }
  @media (max-width: 840px) { .draft-grid { grid-template-columns: minmax(0, 1fr); }.team-stage { grid-row: 1; }.lineup-panel { position: static; grid-row: 2; }.single-team-cards { grid-template-columns: 1fr; overflow: visible; }.single-team-cards :global(.player-card) { min-width: 0; }.desktop-position-panel { display: none; }.mobile-position-panel { display: block; }.position-options { grid-template-columns: repeat(3, 1fr); }.team-stage > header { align-items: stretch; flex-direction: column; }.team-stage > header .skip-team { color: var(--cream); background: var(--panel-2); } }
  @media (max-width: 540px) { .team-stage, .lineup-panel { padding: .8rem; }.mobile-position-panel { position: sticky; top: .5rem; z-index: 6; margin-inline: -.15rem; padding: .8rem; box-shadow: 0 .75rem 2rem rgba(0,0,0,.45); }.mobile-position-panel h3 { font-size: 1.1rem; }.chosen-list div { grid-template-columns: 2.2rem minmax(0, 1fr) auto; } }
</style>
