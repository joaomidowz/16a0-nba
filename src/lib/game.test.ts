import dataset from '../data/dataset_16a0.json';
import { describe, expect, it } from 'vitest';
import { calculateRatings, createRunSetup, simulateSeries } from './game';
import type { Dataset } from './types';

const data = dataset as Dataset;

describe('game engine', () => {
  it('creates the same run from the same seed', () => {
    const setup = createRunSetup(data, '839201', 'champions');
    expect(setup).toEqual(createRunSetup(data, '839201', 'champions'));
    expect(setup.draftTeams).toHaveLength(12);
    expect(new Set(setup.draftTeams.map((team) => team.id)).size).toBe(12);
  });

  it('calculates a weighted rating for six players', () => {
    const ratings = calculateRatings(data.players.slice(0, 6));
    expect(ratings.total).toBeGreaterThan(70);
    expect(ratings.specials.length).toBeGreaterThan(0);
  });

  it('simulates a best-of-seven series deterministically', () => {
    const setup = createRunSetup(data, 'test-seed', 'random');
    const roster = setup.draftTeams.flatMap((team) => data.players.filter((player) => player.teamId === team.id)).slice(0, 6);
    const first = simulateSeries(roster, data, setup.opponents[0], 'test-seed', 0);
    const second = simulateSeries(roster, data, setup.opponents[0], 'test-seed', 0);
    expect(first).toEqual(second);
    expect(first.userWins === 4 || first.opponentWins === 4).toBe(true);
    expect(first.games.length).toBeGreaterThanOrEqual(4);
    expect(first.games.length).toBeLessThanOrEqual(7);
  });
});
