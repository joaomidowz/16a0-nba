<script lang="ts">
  import { onMount } from 'svelte';
  import Game from './screens/Game.svelte';
  import Home from './screens/Home.svelte';
  import Draft from './screens/Draft.svelte';
  import Result from './screens/Result.svelte';
  import SimulationSetup from './screens/SimulationSetup.svelte';
  import { applyReward, createRunSetup, simulateSeries, summarizeRun } from './lib/game';
  import type { Locale } from './lib/i18n';
  import type { Dataset, GameMode, Player, RunSetup, Screen, SeriesResult, SimulationMode, SimulationSpeed } from './lib/types';

  let screen: Screen = 'home';
  let locale: Locale = 'pt';
  let dataset: Dataset | null = null;
  let setup: RunSetup | null = null;
  let roster: Player[] = [];
  let seriesResults: SeriesResult[] = [];
  let currentSeries: SeriesResult | null = null;
  let simulationMode: SimulationMode = 'manual';
  let simulationSpeed: SimulationSpeed = 50;
  let loading = false;

  $: summary = setup ? summarizeRun(seriesResults, roster) : null;

  async function loadDataset(): Promise<Dataset> {
    if (dataset) return dataset;
    const module = await import('./data/dataset_16a0.json');
    dataset = module.default as Dataset;
    return dataset;
  }

  function makeSeed(mode: GameMode): string {
    if (mode === 'daily') return new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return String(values[0] % 1_000_000).padStart(6, '0');
  }

  async function startRun(mode: GameMode, suppliedSeed?: string) {
    loading = true;
    const loaded = await loadDataset();
    const seed = suppliedSeed ?? makeSeed(mode);
    setup = createRunSetup(loaded, seed, mode);
    roster = [];
    seriesResults = [];
    currentSeries = null;
    const url = new URL(window.location.href);
    url.searchParams.set('s', seed);
    url.searchParams.set('m', mode);
    history.replaceState({}, '', url);
    screen = 'draft';
    loading = false;
  }

  function playSeries(index: number, defenseBonus = 0) {
    if (!dataset || !setup) return;
    currentSeries = simulateSeries(roster, dataset, setup.opponents[index], setup.seed, index, defenseBonus);
    seriesResults = [...seriesResults, currentSeries];
    screen = 'game';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function confirmRoster(players: Player[]) {
    roster = players.map((player) => ({ ...player }));
    seriesResults = [];
    screen = 'simulation-setup';
  }

  function startSimulation(mode: SimulationMode, speed: SimulationSpeed) {
    simulationMode = mode;
    simulationSpeed = speed;
    const url = new URL(window.location.href);
    url.searchParams.set('auto', mode === 'automatic' ? '1' : '0');
    url.searchParams.set('speed', String(speed));
    history.replaceState({}, '', url);

    if (mode === 'automatic') simulateAutomaticRun();
    else {
      seriesResults = [];
      playSeries(0);
    }
  }

  function simulateAutomaticRun() {
    if (!dataset || !setup) return;
    let automaticRoster = roster.map((player) => ({ ...player }));
    const results: SeriesResult[] = [];
    for (let index = 0; index < setup.opponents.length; index += 1) {
      const result = simulateSeries(automaticRoster, dataset, setup.opponents[index], setup.seed, index);
      results.push(result);
      if (!result.won) break;
      const defeatedPlayers = dataset.players.filter((player) => player.teamId === result.opponent.id);
      automaticRoster = applyReward(automaticRoster, defeatedPlayers, 'training');
    }
    roster = automaticRoster;
    seriesResults = results;
    currentSeries = results.at(-1) ?? null;
    screen = 'result';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function takeReward(reward: 'swap' | 'training' | 'defense') {
    if (!dataset || !currentSeries || !setup) return;
    const defeatedPlayers = dataset.players.filter((player) => player.teamId === currentSeries!.opponent.id);
    roster = applyReward(roster, defeatedPlayers, reward);
    const nextIndex = seriesResults.length;
    playSeries(nextIndex, reward === 'defense' ? 2 : 0);
  }

  function showResult() {
    screen = 'result';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function restart() {
    const url = new URL(window.location.href);
    url.search = '';
    history.replaceState({}, '', url);
    setup = null;
    roster = [];
    seriesResults = [];
    currentSeries = null;
    simulationMode = 'manual';
    simulationSpeed = 50;
    screen = 'home';
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('s');
    const mode = params.get('m') as GameMode | null;
    const automatic = params.get('auto');
    const speed = Number(params.get('speed'));
    if (automatic === '1' || automatic === '0') simulationMode = automatic === '1' ? 'automatic' : 'manual';
    if ([25, 50, 90].includes(speed)) simulationSpeed = speed as SimulationSpeed;
    if (seed && mode && ['random', 'champions', 'underdog', 'daily'].includes(mode)) startRun(mode, seed);
  });
</script>

<div class="app-frame">
  <div class="topbar shell">
    <button class="brand" type="button" on:click={restart} aria-label="Voltar ao início">16<span>-</span>0</button>
    <div class="locale" aria-label="Idioma">
      <button type="button" class:active={locale === 'pt'} on:click={() => locale = 'pt'}>PT</button>
      <button type="button" class:active={locale === 'en'} on:click={() => locale = 'en'}>EN</button>
    </div>
  </div>

  {#if loading}
    <main class="loading"><div class="ball"></div><p>Sorteando eras e adversários...</p></main>
  {:else if screen === 'home'}
    <Home {locale} on:start={(event) => startRun(event.detail.mode)} />
  {:else if screen === 'draft' && dataset && setup}
    <Draft {dataset} {setup} initialRoster={roster} on:confirm={(event) => confirmRoster(event.detail)} on:back={restart} />
  {:else if screen === 'simulation-setup'}
    <SimulationSetup {roster} initialMode={simulationMode} initialSpeed={simulationSpeed} on:start={(event) => startSimulation(event.detail.mode, event.detail.speed)} on:back={() => screen = 'draft'} />
  {:else if screen === 'game' && currentSeries && setup}
    {#key currentSeries.opponent.id}
      <Game series={currentSeries} round={seriesResults.length} speed={simulationSpeed} isFinalRound={seriesResults.length === setup.opponents.length} on:reward={(event) => takeReward(event.detail)} on:finish={showResult} />
    {/key}
  {:else if screen === 'result' && setup && summary}
    <Result {setup} series={seriesResults} {summary} {simulationMode} {simulationSpeed} on:restart={restart} />
  {/if}
</div>
