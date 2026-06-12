<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import RunSummary from '../components/RunSummary.svelte';
  import type { Player, RunSetup, RunSummary as Summary, SeriesResult, SimulationMode, SimulationSpeed } from '../lib/types';

  export let setup: RunSetup;
  export let series: SeriesResult[];
  export let summary: Summary;
  export let roster: Player[];
  export let simulationMode: SimulationMode;
  export let simulationSpeed: SimulationSpeed;
  let summaryElement: HTMLElement;
  let feedback = '';
  const dispatch = createEventDispatcher<{ restart: void }>();

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    feedback = 'Link copiado.';
  }

  async function generateImage() {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(summaryElement, { pixelRatio: 2, backgroundColor: '#0b0f19' });
    const link = document.createElement('a');
    link.download = `16a0-${setup.seed}.png`;
    link.href = dataUrl;
    link.click();
    feedback = 'Imagem gerada.';
  }
</script>

<main class="shell page result-page">
  <header class="page-header result-heading"><div><span class="eyebrow">RUN COMPLETE · {simulationMode === 'automatic' ? 'AUTOMÁTICA' : `MANUAL ${simulationSpeed}MS`}</span><h1>Resultado da campanha</h1><p>Abra cada rodada para comparar os jogadores e as estatísticas dos adversários.</p></div></header>
  <div bind:this={summaryElement}><RunSummary {setup} {series} {summary} {roster} /></div>
  <div class="share-actions">
    <button class="primary" type="button" on:click={generateImage}>Gerar imagem</button>
    <button class="secondary" type="button" on:click={copyLink}>Copiar link</button>
    <button class="ghost" type="button" on:click={() => dispatch('restart')}>Nova run</button>
  </div>
  <p class="feedback" aria-live="polite">{feedback}</p>
</main>

<style>
  .result-page { max-width: 1040px; padding-top: 2rem; }.result-heading { margin-bottom: 1rem; }.result-heading h1 { font-size: clamp(2.2rem, 6vw, 4rem); }.share-actions { margin-top: .8rem; }.feedback { min-height: 1.2rem; margin: .4rem 0; color: var(--mint); }
  @media (min-width: 900px) and (min-height: 720px) { .result-page { padding-bottom: 1rem; } }
</style>
