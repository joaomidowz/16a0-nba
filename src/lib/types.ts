export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type LineupSlot = Position | 'Six';
export type Tier = 'S' | 'A' | 'B';
export type GameMode = 'random' | 'champions' | 'underdog' | 'arcade' | 'hardcore' | 'daily';
export type SimulationMode = 'automatic' | 'manual';
export type SimulationSpeed = number;
export type PowerUp = 'swap' | 'balanced' | 'clutch';
export type Screen = 'home' | 'draft' | 'simulation-setup' | 'game' | 'result';

export interface RunBoost {
  attack: number;
  defense: number;
  clutch: number;
}

export interface Team {
  id: string;
  name: string;
  year: number;
  tier: Tier;
  type: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position: Position;
  overall: number;
  attack: number;
  defense: number;
  assist: number;
  clutch: number;
  iq: number;
  special: string;
}

export function isLegend(player: Player): boolean {
  return player.overall >= 95;
}

export type Lineup = Record<LineupSlot, Player | null>;

export interface Dataset {
  teams: Team[];
  players: Player[];
}

export interface Ratings {
  overall: number;
  attack: number;
  defense: number;
  assist: number;
  clutch: number;
  iq: number;
  total: number;
  specials: string[];
}

export interface QuarterScore {
  user: number;
  opponent: number;
}

export interface PlayerBoxScore {
  playerId: string;
  name: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  rating: number;
}

export interface GameResult {
  game: number;
  home: 'user' | 'opponent';
  quarters: QuarterScore[];
  userScore: number;
  opponentScore: number;
  winner: 'user' | 'opponent';
  boxScore: PlayerBoxScore[];
  opponentBoxScore: PlayerBoxScore[];
}

export interface SeriesResult {
  opponent: Team;
  opponentPlayers: Player[];
  userWins: number;
  opponentWins: number;
  games: GameResult[];
  won: boolean;
}

export interface RunSetup {
  seed: string;
  mode: GameMode;
  opponents: Team[];
  draftTeams: Team[];
}

export interface RunSummary {
  champion: boolean;
  wins: number;
  losses: number;
  mvp: PlayerBoxScore | null;
  averagePoints: number;
  biggestWin: number;
  closestGame: number;
  clutchPlayer: Player | null;
  verdict: string;
}
