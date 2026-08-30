export enum RealmType {
  Earth = 'EARTH',
  Galaxy = 'GALAXY',
  Universe = 'UNIVERSE',
}

export enum GameState {
  GameStart = 'GAME_START',
  Preparation = 'PREPARATION',
  AwakeningAvailable = 'AWAKENING_AVAILABLE',
  Awakening = 'AWAKENING',
  CareerObtained = 'CAREER_OBTAINED',
  TutorialAvailable = 'TUTORIAL_AVAILABLE',
  TutorialBattle = 'TUTORIAL_BATTLE',
  EarthProgress = 'EARTH_PROGRESS',
  GalaxyUnlocked = 'GALAXY_UNLOCKED',
  GalaxyProgress = 'GALAXY_PROGRESS',
  UniverseUnlocked = 'UNIVERSE_UNLOCKED',
  UniverseProgress = 'UNIVERSE_PROGRESS',
}

export type CareerId =
  | 'EARTH_WALL_GUARDIAN'
  | 'GALAXY_STARBURST_HUNTER'
  | 'UNIVERSE_CHAOS_LAW_MASTER';

export type StatModifierType = 'DEFENSE_PERCENT';

export interface StatModifier {
  type: StatModifierType;
  value: number;
  source: 'CAREER';
  sourceId: CareerId;
}

export interface CareerData {
  id: CareerId;
  displayName: string;
  englishName: string;
  realm: RealmType;
  description: string;
  classification: string;
  passiveName: string;
  passiveDescription: string;
  modifiers: StatModifier[];
  revealVisualId: string;
  tags: string[];
  enabled: boolean;
}

export interface PlayerSave {
  saveVersion: number;
  playerLevel: number;
  playerAge: number;
  preparationDay: number;
  currentGameState: GameState;
  awakeningUnlocked: boolean;
  awakeningCompleted: boolean;
  awakeningRevealAcknowledged: boolean;
  earthCareer: CareerId | null;
  galaxyCareer: CareerId | null;
  universeCareer: CareerId | null;
  earthCareerRngUsed: boolean;
  galaxyCareerRngUsed: boolean;
  universeCareerRngUsed: boolean;
  ownedTowers: string[];
  towerLevels: Record<string, number>;
  towerStars: Record<string, number>;
  materials: number;
  currency: number;
  earthProgress: number;
  galaxyProgress: number;
  universeProgress: number;
  saveCreatedAt: string;
  lastSaveAt: string;
}

export interface RngPoolEntry {
  careerId: CareerId;
  weight: number;
  enabled: boolean;
}

export interface RngPool {
  realm: RealmType;
  entries: RngPoolEntry[];
}
