<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { messages, type Locale } from '../lib/i18n';
  import type { GameMode } from '../lib/types';

  export let locale: Locale = 'pt';
  let mode: GameMode = 'random';
  const dispatch = createEventDispatcher<{ start: { mode: GameMode } }>();
  $: copy = messages[locale];

  const modes: { id: GameMode; icon: string; description: Record<Locale, string> }[] = [
    { id: 'random', icon: '01', description: { pt: 'Quatro adversários de qualquer era.', en: 'Four opponents from any era.' } },
    { id: 'champions', icon: '02', description: { pt: 'Somente equipes que levantaram o troféu.', en: 'Only teams that lifted the trophy.' } },
    { id: 'underdog', icon: '03', description: { pt: 'Elenco tier B contra gigantes históricos.', en: 'Tier B roster against historic giants.' } },
    { id: 'daily', icon: '04', description: { pt: 'A mesma run para todos hoje.', en: 'The same run for everyone today.' } },
  ];
</script>

<main class="home shell">
  <div class="hero-copy">
    <span class="eyebrow">{copy.eyebrow}</span>
    <h1>16<span>-</span>0</h1>
    <h2>{copy.title}</h2>
    <p>{copy.subtitle}</p>
    <div class="facts" aria-label="Formato da campanha"><span>4 séries</span><span>16 vitórias</span><span>0 derrotas</span></div>
  </div>

  <section class="mode-panel" aria-labelledby="mode-title">
    <div class="panel-heading"><span>STEP 01</span><h3 id="mode-title">Escolha o desafio</h3></div>
    <div class="modes">
      {#each modes as item}
        <button type="button" class:active={mode === item.id} aria-pressed={mode === item.id} on:click={() => mode = item.id}>
          <span>{item.icon}</span>
          <strong>{copy[item.id]}</strong>
          <small>{item.description[locale]}</small>
        </button>
      {/each}
    </div>
    <button class="primary" type="button" on:click={() => dispatch('start', { mode })}>{copy.start}<span>→</span></button>
  </section>
</main>
