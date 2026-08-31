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

export const EARTH_TIER_IDS = [
  'NORMAL',
  'RARE',
  'SCARCE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
  'SECRET',
  'KING',
  'EMPEROR',
  'VENERABLE',
  'SAINT',
  'SOVEREIGN',
] as const;
export type EarthTierId = (typeof EARTH_TIER_IDS)[number];

export type TowerId =
  | 'EARTH_BASIC_AUTO_TURRET'
  | 'EARTH_RAPID_FIRE_TURRET'
  | 'EARTH_ARMOR_PIERCING_TURRET'
  | 'EARTH_BLAST_TURRET'
  | 'EARTH_THUNDER_TURRET'
  | 'EARTH_DIVINE_JUDGMENT_TURRET'
  | 'EARTH_PHANTOM_TURRET'
  | 'EARTH_KING_AUTHORITY_TURRET'
  | 'EARTH_EMPEROR_ANNIHILATION_TURRET'
  | 'EARTH_VENERABLE_TURRET'
  | 'EARTH_SAINT_DOMAIN_TURRET'
  | 'EARTH_SOVEREIGN_END_TURRET';
export type MaterialId =
  | 'EARTH_BASIC_MATERIAL'
  | 'EARTH_NORMAL_MATERIAL'
  | 'EARTH_RARE_MATERIAL'
  | 'EARTH_SCARCE_MATERIAL'
  | 'EARTH_EPIC_MATERIAL'
  | 'EARTH_LEGENDARY_MATERIAL'
  | 'EARTH_MYTHIC_MATERIAL'
  | 'EARTH_SECRET_MATERIAL'
  | 'EARTH_KING_MATERIAL'
  | 'EARTH_EMPEROR_MATERIAL'
  | 'EARTH_VENERABLE_MATERIAL'
  | 'EARTH_SAINT_MATERIAL'
  | 'EARTH_SOVEREIGN_MATERIAL'
  | 'EARTH_STAR_CORE';
export type EnemyId =
  | 'EARTH_GRUNT'
  | 'EARTH_RUNNER'
  | 'EARTH_TANK'
  | 'EARTH_ELITE'
  | 'EARTH_SHIELDED'
  | 'EARTH_REGENERATOR'
  | 'EARTH_SUPPORT'
  | 'EARTH_BOSS';
export type TargetingMode =
  | 'FIRST'
  | 'NEAREST'
  | 'LAST'
  | 'FARTHEST'
  | 'STRONGEST'
  | 'WEAKEST';
export type BattleState =
  | 'SETUP'
  | 'READY'
  | 'WAVE_STARTING'
  | 'WAVE_ACTIVE'
  | 'WAVE_CLEAR'
  | 'INTERMISSION'
  | 'BLESSING_CHOICE'
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

export interface EarthTierProgress {
  unlocked: boolean;
  cleared: boolean;
  clearCount: number;
  bestWave: number;
  bossDefeated: boolean;
  firstClearRewardClaimed: boolean;
  milestoneRewardsClaimed: string[];
  tierTowerRewardClaimed: boolean;
}

export interface EarthProgressData {
  highestUnlockedTier: EarthTierId | null;
  highestClearedTier: EarthTierId | null;
  totalEarthPower: number;
  tutorialCleared: boolean;
  tierProgress: Record<EarthTierId, EarthTierProgress>;
  earthCompleted: boolean;
  earthCompletionRewardClaimed: boolean;
  completionBadge: string | null;
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
  earthRegion: EarthProgressData;
  earthLoadout: TowerId[];
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
  rarity: EarthTierId;
  tierID: EarthTierId;
  description: string;
  baseStats: TowerBaseStats;
  scaleAttackSpeedWithStars: boolean;
  roleTags: string[];
  attackPattern: 'SINGLE' | 'AOE' | 'CHAIN';
  maxTargets: number;
  bossDamageMultiplier: number;
  artwork: string;
  artIndex: number;
  roleIcon: string;
  revealVFXID: string;
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
  archetype:
    | 'GRUNT'
    | 'RUNNER'
    | 'TANK'
    | 'ELITE'
    | 'SHIELDED'
    | 'REGENERATING'
    | 'SUPPORT'
    | 'BOSS';
  shieldPercent?: number;
  regenerationPercent?: number;
  elite?: boolean;
  supportAura?: number;
  portrait: string;
  cardArtwork: string;
  battlePrefab: string;
  silhouette: string;
  icon: string;
  hitVFX: string;
  deathVFX: string;
  spawnVFX: string;
  baseReachVFX: string;
  animationProfile: string;
  visualScale: number;
  visualFamily: string;
  tierVisualVariant: EarthTierId | 'TUTORIAL';
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
