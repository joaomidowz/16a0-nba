import { describe, expect, it } from 'vitest';
import dataset from '../data/dataset_16a0.json';
import type { Dataset, Position } from './types';

const data = dataset as Dataset;
const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

describe('local dataset', () => {
  it('keeps exactly six players linked to every team', () => {
    for (const team of data.teams) {
      expect(data.players.filter((player) => player.teamId === team.id), team.id).toHaveLength(6);
    }
  });

  it('contains valid ratings and positions', () => {
    for (const player of data.players) {
      expect(positions).toContain(player.position);
      expect(player.overall).toBeGreaterThanOrEqual(70);
      expect(player.overall).toBeLessThanOrEqual(99);
      for (const rating of [player.attack, player.defense, player.assist, player.clutch, player.iq]) {
        expect(rating).toBeGreaterThanOrEqual(0);
        expect(rating).toBeLessThanOrEqual(99);
      }
    }
  });

  it('documents the current source-file size', () => {
    expect(data.teams).toHaveLength(49);
    expect(data.players).toHaveLength(294);
  });
});
