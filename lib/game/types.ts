export enum RealmType {
  Earth = 'EARTH',
  Galaxy = 'GALAXY',
  Universe = 'UNIVERSE',
}

export enum GameState {
  GameStart = 'GAME_START',
  AwakeningAvailable = 'AWAKENING_AVAILABLE',
  Awakening = 'AWAKENING',
  CareerObtained = 'CAREER_OBTAINED',
  StarterTowerGranted = 'STARTER_TOWER_GRANTED',
  Preparation = 'PREPARATION',
  PreparationComplete = 'PREPARATION_COMPLETE',
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

export type TowerId = 'EARTH_BASIC_AUTO_TURRET';
export type MaterialId = 'EARTH_BASIC_MATERIAL' | 'EARTH_STAR_CORE';
export type EnemyId = 'EARTH_GRUNT' | 'EARTH_RUNNER' | 'EARTH_TANK' | 'EARTH_BOSS';
export type TargetingMode = 'FIRST' | 'NEAREST' | 'LAST' | 'FARTHEST' | 'STRONGEST' | 'WEAKEST';
export type BattleState =
  | 'SETUP'
  | 'READY'
  | 'WAVE_STARTING'
  | 'WAVE_ACTIVE'
  | 'WAVE_CLEAR'
  | 'INTERMISSION'
  | 'BOSS_WARNING'
  | 'VICTORY'
  | 'DEFEAT'
  | 'RESULT'
  | 'EXITING';

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

export interface OwnedTowerProgress {
  towerID: TowerId;
  level: number;
  stars: number;
  unlocked: boolean;
  obtainedAt: string;
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
  starterTowerRewardClaimed: boolean;
  ownedTowers: OwnedTowerProgress[];
  materials: number;
  materialsById: Record<string, number>;
  currency: number;
  earthProgress: number;
  galaxyProgress: number;
  universeProgress: number;
  earthTutorialCleared: boolean;
  tutorialFirstClearRewardClaimed: boolean;
  tutorialClearCount: number;
  committedBattleRewardSessionIds: string[];
  firstGrowthUpgradeCompleted: boolean;
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

export interface TowerBaseStats {
  attack: number;
  defense: number;
  maxHP: number;
  attackSpeed: number;
  range: number;
  critChance: number;
  critDamage: number;
  accuracy: number;
  penetration: number;
}

export interface TowerData {
  id: TowerId;
  name: string;
  englishName: string;
  realm: RealmType;
  rarity: 'NORMAL';
  description: string;
  baseStats: TowerBaseStats;
  scaleAttackSpeedWithStars: boolean;
}

export interface FinalTowerStats extends TowerBaseStats {
  levelMultiplier: number;
  starMultiplier: number;
}

export interface EnemyData {
  id: EnemyId;
  name: string;
  maxHP: number;
  defense: number;
  speed: number;
  baseDamage: number;
  reward: number;
  boss: boolean;
}

export interface MaterialData {
  id: MaterialId;
  displayName: string;
  description: string;
  realm: RealmType;
  rarity: 'COMMON' | 'RARE';
  icon: string;
  category: 'TOWER_LEVEL' | 'TOWER_STAR';
  maxStack: number;
  tags: string[];
}

export interface MaterialReward {
  materialID: MaterialId;
  amount: number;
}

export interface RewardResult {
  dungeonID: string;
  battleSessionID: string;
  firstClear: boolean;
  materials: MaterialReward[];
}
