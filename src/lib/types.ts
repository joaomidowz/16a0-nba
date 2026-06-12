export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type Tier = 'S' | 'A' | 'B';
export type GameMode = 'random' | 'champions' | 'underdog' | 'daily';
export type SimulationMode = 'automatic' | 'manual';
export type SimulationSpeed = 25 | 50 | 90;
export type Screen = 'home' | 'draft' | 'simulation-setup' | 'game' | 'result';

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
}

export interface SeriesResult {
  opponent: Team;
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
