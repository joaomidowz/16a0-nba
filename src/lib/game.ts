import { createRandom, randomBetween, shuffle } from './random';
import type {
  Dataset,
  GameMode,
  GameResult,
  Player,
  PlayerBoxScore,
  Ratings,
  RunSetup,
  RunSummary,
  SeriesResult,
  Team,
} from './types';

const tierBonus = { S: 4, A: 1.5, B: -1.5 } as const;

function average(players: Player[], field: keyof Pick<Player, 'overall' | 'attack' | 'defense' | 'assist' | 'clutch' | 'iq'>): number {
  return players.reduce((sum, player) => sum + player[field], 0) / players.length;
}

function specialCount(players: Player[], special: string): number {
  return players.filter((player) => player.special === special).length;
}

export function calculateRatings(players: Player[], fourthQuarter = false, temporaryDefense = 0): Ratings {
  if (players.length === 0) {
    return { overall: 0, attack: 0, defense: 0, assist: 0, clutch: 0, iq: 0, total: 0, specials: [] };
  }

  const attack = average(players, 'attack')
    + specialCount(players, 'Two-Way Star')
    + specialCount(players, 'Microwave Scorer') * 1.5
    + specialCount(players, 'Sharpshooter')
    + specialCount(players, 'Slasher')
    + specialCount(players, 'Post Dominator')
    + (fourthQuarter ? specialCount(players, 'Clutch Killer') * 3 : 0);
  const defense = average(players, 'defense')
    + specialCount(players, 'Rim Protector') * 3
    + specialCount(players, 'Lockdown Defender') * 2.5
    + specialCount(players, 'Two-Way Star')
    + temporaryDefense;
  const assist = average(players, 'assist') + specialCount(players, 'Floor General') * 2;
  const clutch = average(players, 'clutch') + specialCount(players, 'Playoff Riser') * 1.5;
  const iq = average(players, 'iq') + specialCount(players, 'Veteran IQ') * 2;
  const total = attack * 0.35 + defense * 0.25 + assist * 0.15 + clutch * 0.15 + iq * 0.1;

  return {
    overall: average(players, 'overall'),
    attack,
    defense,
    assist,
    clutch,
    iq,
    total,
    specials: [...new Set(players.map((player) => player.special))],
  };
}

function teamPool(dataset: Dataset, mode: GameMode): Team[] {
  if (mode === 'champions') {
    return dataset.teams.filter((team) => team.type.toLowerCase().includes('champion'));
  }
  if (mode === 'underdog') {
    return dataset.teams.filter((team) => team.tier === 'S' || team.tier === 'A');
  }
  return dataset.teams;
}

export function createRunSetup(dataset: Dataset, seed: string, mode: GameMode): RunSetup {
  const random = createRandom(`${seed}:${mode}:setup`);
  const opponents = shuffle(teamPool(dataset, mode), random).slice(0, 4);
  const draftTeams = mode === 'underdog'
    ? shuffle(dataset.teams.filter((team) => team.tier === 'B'), random).slice(0, 12)
    : shuffle(dataset.teams, random).slice(0, 12);

  return { seed, mode, opponents, draftTeams };
}

function buildBoxScore(players: Player[], score: number, random: () => number): PlayerBoxScore[] {
  const attackTotal = players.reduce((sum, player) => sum + player.attack, 0);
  let assignedPoints = 0;

  return players.map((player, index) => {
    const points = index === players.length - 1
      ? Math.max(0, score - assignedPoints)
      : Math.max(2, Math.round(score * (player.attack / attackTotal) * randomBetween(random, 0.84, 1.16)));
    assignedPoints += points;
    const rebounds = Math.max(1, Math.round(((player.position === 'C' || player.position === 'PF') ? 7 : 3) + (player.defense - 75) / 8 + randomBetween(random, -2, 2)));
    const assists = Math.max(0, Math.round(player.assist / 12 + randomBetween(random, -2, 2)));
    const steals = Math.max(0, Math.round((player.defense - 68) / 18 + randomBetween(random, -0.8, 1.2)));
    const blocks = Math.max(0, Math.round(((player.position === 'C' || player.position === 'PF') ? 1.2 : 0.2) + (player.defense - 72) / 22 + randomBetween(random, -0.6, 0.8)));
    const rating = Math.min(10, Math.max(4, Number((5.5 + points / 18 + rebounds / 20 + assists / 15 + steals / 10 + blocks / 10 + randomBetween(random, -0.5, 0.5)).toFixed(1))));
    return { playerId: player.id, name: player.name, points, rebounds, assists, steals, blocks, rating };
  });
}

function simulateGame(
  roster: Player[],
  opponentPlayers: Player[],
  opponent: Team,
  game: number,
  random: () => number,
  temporaryDefense: number,
): GameResult {
  const home: 'user' | 'opponent' = game % 2 === 0 ? 'user' : 'opponent';
  const quarters = Array.from({ length: 4 }, (_, quarterIndex) => {
    const userRatings = calculateRatings(roster, quarterIndex === 3, temporaryDefense);
    const opponentRatings = calculateRatings(opponentPlayers, quarterIndex === 3);
    const homeEdge = home === 'user' ? 1.5 : -1.5;
    const matchup = (userRatings.attack - opponentRatings.defense) * 0.08 + (userRatings.total - opponentRatings.total) * 0.11;
    const opponentMatchup = (opponentRatings.attack - userRatings.defense) * 0.08 + (opponentRatings.total - userRatings.total) * 0.11 + tierBonus[opponent.tier] * 0.35;
    const user = Math.max(16, Math.round(25 + matchup + homeEdge + randomBetween(random, -5.5, 5.5)));
    const opponentScore = Math.max(16, Math.round(25 + opponentMatchup - homeEdge + randomBetween(random, -5.5, 5.5)));
    return { user, opponent: opponentScore };
  });

  let userScore = quarters.reduce((sum, quarter) => sum + quarter.user, 0);
  let opponentScore = quarters.reduce((sum, quarter) => sum + quarter.opponent, 0);
  if (userScore === opponentScore) {
    if (random() > 0.5) userScore += Math.round(randomBetween(random, 5, 12));
    else opponentScore += Math.round(randomBetween(random, 5, 12));
  }

  return {
    game,
    home,
    quarters,
    userScore,
    opponentScore,
    winner: userScore > opponentScore ? 'user' : 'opponent',
    boxScore: buildBoxScore(roster, userScore, random),
  };
}

export function simulateSeries(
  roster: Player[],
  dataset: Dataset,
  opponent: Team,
  seed: string,
  seriesIndex: number,
  temporaryDefense = 0,
): SeriesResult {
  const random = createRandom(`${seed}:series:${seriesIndex}`);
  const opponentPlayers = dataset.players.filter((player) => player.teamId === opponent.id);
  const games: GameResult[] = [];
  let userWins = 0;
  let opponentWins = 0;

  while (userWins < 4 && opponentWins < 4) {
    const result = simulateGame(roster, opponentPlayers, opponent, games.length + 1, random, temporaryDefense);
    games.push(result);
    if (result.winner === 'user') userWins += 1;
    else opponentWins += 1;
  }

  return { opponent, userWins, opponentWins, games, won: userWins === 4 };
}

export function applyReward(roster: Player[], defeatedPlayers: Player[], reward: 'swap' | 'training' | 'defense'): Player[] {
  if (reward === 'defense') return roster;
  if (reward === 'training') {
    const weakest = [...roster].sort((a, b) => a.overall - b.overall)[0];
    return roster.map((player) => player.id === weakest.id
      ? { ...player, overall: Math.min(99, player.overall + 2), attack: Math.min(99, player.attack + 2), defense: Math.min(99, player.defense + 2) }
      : player);
  }

  const recruit = [...defeatedPlayers].sort((a, b) => b.overall - a.overall)[0];
  const samePosition = roster
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.position === recruit.position)
    .sort((a, b) => a.player.overall - b.player.overall)[0];
  const replaceIndex = samePosition?.index ?? [...roster].map((player, index) => ({ player, index })).sort((a, b) => a.player.overall - b.player.overall)[0].index;
  return roster.map((player, index) => index === replaceIndex ? recruit : player);
}

export function summarizeRun(series: SeriesResult[], roster: Player[]): RunSummary {
  const games = series.flatMap((item) => item.games);
  const wins = games.filter((game) => game.winner === 'user').length;
  const losses = games.length - wins;
  const performances = games.flatMap((game) => game.boxScore);
  const byPlayer = new Map<string, PlayerBoxScore[]>();
  performances.forEach((performance) => byPlayer.set(performance.playerId, [...(byPlayer.get(performance.playerId) ?? []), performance]));
  const mvp = [...byPlayer.values()]
    .map((items) => ({
      ...items[0],
      rating: Number((items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1)),
      points: Number((items.reduce((sum, item) => sum + item.points, 0) / items.length).toFixed(1)),
    }))
    .sort((a, b) => b.rating - a.rating)[0] ?? null;
  const margins = games.map((game) => Math.abs(game.userScore - game.opponentScore));
  const champion = series.length === 4 && series.every((item) => item.won);
  const verdict = champion
    ? losses === 0 ? 'Campanha perfeita' : losses <= 4 ? 'Campeão convincente' : 'Campeão sofrido'
    : series.length >= 4 ? 'Eliminado na final' : series.length === 3 ? 'Eliminado na final de conferência' : 'Eliminado antes da final';

  return {
    champion,
    wins,
    losses,
    mvp,
    averagePoints: games.length ? Number((games.reduce((sum, game) => sum + game.userScore, 0) / games.length).toFixed(1)) : 0,
    biggestWin: games.length ? Math.max(...games.map((game) => game.userScore - game.opponentScore)) : 0,
    closestGame: margins.length ? Math.min(...margins) : 0,
    clutchPlayer: [...roster].sort((a, b) => b.clutch - a.clutch)[0] ?? null,
    verdict,
  };
}
