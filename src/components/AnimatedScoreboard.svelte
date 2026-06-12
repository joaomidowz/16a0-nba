<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { GameResult } from '../lib/types';

  export let result: GameResult;
  export let speed = 50;

  let currentUser = 0;
  let currentOpponent = 0;
  let activeQuarter = 0;
  let completed = false;
  let cancelled = false;
  const dispatch = createEventDispatcher<{ complete: void }>();

  const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

  async function animateTo(userTarget: number, opponentTarget: number) {
    while (!cancelled && (currentUser < userTarget || currentOpponent < opponentTarget)) {
      if (currentUser < userTarget) currentUser += 1;
      if (currentOpponent < opponentTarget) currentOpponent += 1;
      await wait(speed);
    }
  }

  onMount(() => {
    void (async () => {
      let userTarget = 0;
      let opponentTarget = 0;
      for (let index = 0; index < result.quarters.length; index += 1) {
        activeQuarter = index;
        userTarget += result.quarters[index].user;
        opponentTarget += result.quarters[index].opponent;
        await animateTo(userTarget, opponentTarget);
        if (!cancelled) await wait(Math.max(350, speed * 7));
      }
      if (!cancelled) {
        currentUser = result.userScore;
        currentOpponent = result.opponentScore;
        completed = true;
        dispatch('complete');
      }
    })();

    return () => { cancelled = true; };
  });
</script>

<div class="animated-scoreboard" aria-live="polite">
  <div><small>SEU TIME</small><strong>{currentUser}</strong></div>
  <div class="center">
    <span>{completed ? 'FINAL' : `Q${activeQuarter + 1}`}</span>
    <div class="quarters">
      {#each result.quarters as quarter, index}
        <i class:active={index === activeQuarter && !completed} class:done={index < activeQuarter || completed} title={`Q${index + 1}: ${quarter.user}-${quarter.opponent}`}>Q{index + 1}</i>
      {/each}
    </div>
  </div>
  <div><small>ADVERSÁRIO</small><strong>{currentOpponent}</strong></div>
</div>

<style>
  .animated-scoreboard { display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center; min-height: 12rem; padding: 1.2rem; text-align: center; background: radial-gradient(circle, rgba(240,118,54,.12), transparent 55%), #070a11; border: 1px solid var(--line); border-radius: 1rem; }
  .animated-scoreboard > div { display: grid; gap: .35rem; }
  small { color: var(--muted); font: 800 .7rem/1 var(--font-display); letter-spacing: .08em; }
  strong { color: var(--cream); font: 900 clamp(3.5rem, 10vw, 7rem)/1 var(--font-display); font-variant-numeric: tabular-nums; }
  .center > span { color: var(--orange); font: 900 1.2rem/1 var(--font-display); }
  .quarters { display: flex; gap: .3rem; }
  .quarters i { display: grid; place-content: center; width: 2rem; aspect-ratio: 1; color: var(--muted); border: 1px solid var(--line); border-radius: 50%; font: 800 .65rem/1 var(--font-display); font-style: normal; }
  .quarters i.active { color: var(--bg); background: var(--orange); border-color: var(--orange); transform: scale(1.12); }
  .quarters i.done { color: var(--bg); background: var(--mint); border-color: var(--mint); }
  @media (max-width: 560px) { .animated-scoreboard { grid-template-columns: 1fr 1fr; }.center { grid-column: 1 / -1; grid-row: 2; }.quarters { justify-content: center; } }
</style>
