import dataset from '../data/dataset_16a0.json';
import { describe, expect, it } from 'vitest';
import { applyPowerUp, calculateRatings, createRunSetup, simulateSeries } from './game';
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
    expect(first.opponentPlayers).toHaveLength(6);
    expect(first.games[0].opponentBoxScore).toHaveLength(6);
  });

  it('uses only tier S opponents in hardcore mode', () => {
    const setup = createRunSetup(data, 'hard-mode', 'hardcore');
    expect(setup.opponents).toHaveLength(4);
    expect(setup.opponents.every((team) => team.tier === 'S')).toBe(true);
  });

  it('applies arcade power-ups without mutating the source roster', () => {
    const setup = createRunSetup(data, 'arcade-mode', 'arcade');
    const roster = setup.draftTeams.flatMap((team) => data.players.filter((player) => player.teamId === team.id)).slice(0, 6);
    const defeated = data.players.filter((player) => player.teamId === setup.opponents[0].id);
    expect(applyPowerUp(roster, defeated, 'balanced').boost).toEqual({ attack: 2, defense: 2, clutch: 0 });
    expect(applyPowerUp(roster, defeated, 'clutch').boost.clutch).toBe(5);
    expect(roster).toHaveLength(6);
  });
});
