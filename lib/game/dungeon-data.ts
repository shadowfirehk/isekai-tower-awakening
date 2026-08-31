import { getEarthTier } from './earth-tiers';
import { EarthTierId, EnemyData, EnemyId, RealmType } from './types';
import { ENEMY_VISUAL_PROFILES } from './visual-config';

function art(
  id: EnemyId,
): Pick<
  EnemyData,
  | 'portrait'
  | 'cardArtwork'
  | 'battlePrefab'
  | 'silhouette'
  | 'icon'
  | 'hitVFX'
  | 'deathVFX'
  | 'spawnVFX'
  | 'baseReachVFX'
  | 'animationProfile'
  | 'visualScale'
  | 'visualFamily'
  | 'tierVisualVariant'
> {
  const profile = ENEMY_VISUAL_PROFILES[id];
  return {
    portrait: '/assets/earth-enemy-boss-atlas.png',
    cardArtwork: '/assets/earth-enemy-boss-atlas.png',
    battlePrefab: profile.id,
    silhouette: profile.silhouette,
    icon: profile.role,
    hitVFX: profile.hitVFX,
    deathVFX: profile.deathVFX,
    spawnVFX: profile.spawnVFX,
    baseReachVFX: profile.baseReachVFX,
    animationProfile: profile.movementAnimation,
    visualScale: profile.visualScale,
    visualFamily: profile.visualFamily,
    tierVisualVariant: 'TUTORIAL',
  };
}

export const ENEMY_CATALOG: Record<EnemyId, EnemyData> = {
  EARTH_GRUNT: {
    id: 'EARTH_GRUNT',
    name: '裂隙行者',
    maxHP: 80,
    defense: 10,
    speed: 0.07,
    baseDamage: 1,
    reward: 2,
    boss: false,
    archetype: 'GRUNT',
    ...art('EARTH_GRUNT'),
  },
  EARTH_RUNNER: {
    id: 'EARTH_RUNNER',
    name: '疾行獵獸',
    maxHP: 58,
    defense: 4,
    speed: 0.105,
    baseDamage: 1,
    reward: 3,
    boss: false,
    archetype: 'RUNNER',
    ...art('EARTH_RUNNER'),
  },
  EARTH_TANK: {
    id: 'EARTH_TANK',
    name: '岩甲巨獸',
    maxHP: 260,
    defense: 35,
    speed: 0.043,
    baseDamage: 1,
    reward: 6,
    boss: false,
    archetype: 'TANK',
    ...art('EARTH_TANK'),
  },
  EARTH_ELITE: {
    id: 'EARTH_ELITE',
    name: '地脈菁英',
    maxHP: 180,
    defense: 22,
    speed: 0.06,
    baseDamage: 2,
    reward: 8,
    boss: false,
    archetype: 'ELITE',
    elite: true,
    ...art('EARTH_ELITE'),
  },
  EARTH_SHIELDED: {
    id: 'EARTH_SHIELDED',
    name: '晶盾守衛',
    maxHP: 210,
    defense: 26,
    speed: 0.052,
    baseDamage: 2,
    reward: 9,
    boss: false,
    archetype: 'SHIELDED',
    shieldPercent: 0.55,
    ...art('EARTH_SHIELDED'),
  },
  EARTH_REGENERATOR: {
    id: 'EARTH_REGENERATOR',
    name: '再生古獸',
    maxHP: 225,
    defense: 18,
    speed: 0.055,
    baseDamage: 2,
    reward: 10,
    boss: false,
    archetype: 'REGENERATING',
    regenerationPercent: 0.025,
    ...art('EARTH_REGENERATOR'),
  },
  EARTH_SUPPORT: {
    id: 'EARTH_SUPPORT',
    name: '地脈祭司',
    maxHP: 145,
    defense: 14,
    speed: 0.058,
    baseDamage: 2,
    reward: 10,
    boss: false,
    archetype: 'SUPPORT',
    supportAura: 0.2,
    ...art('EARTH_SUPPORT'),
  },
  EARTH_BOSS: {
    id: 'EARTH_BOSS',
    name: '地脈破壞者',
    maxHP: 650,
    defense: 28,
    speed: 0.032,
    baseDamage: 5,
    reward: 25,
    boss: true,
    archetype: 'BOSS',
    ...art('EARTH_BOSS'),
  },
};

export interface WaveGroup {
  enemyId: EnemyId;
  count: number;
  interval: number;
}
export interface WaveData {
  wave: number;
  boss: boolean;
  bossMultiplier: number;
  groups: WaveGroup[];
}
const BOSS_MULTIPLIERS = [1, 1.5, 2.2, 3, 4];

export function createWaves(tierOrder = -1): WaveData[] {
  return Array.from({ length: 25 }, (_, index) => {
    const wave = index + 1,
      boss = wave % 5 === 0,
      act = Math.ceil(wave / 5),
      groups: WaveGroup[] = [];
    const density = 1.6 + act * 0.9;
    const count = (base: number) => Math.max(1, Math.ceil(base * density));
    const interval = (base: number) =>
      base * (wave <= 4 ? 0.55 : wave <= 9 ? 0.68 : wave <= 14 ? 0.76 : 0.82);
    if (boss) {
      groups.push({
        enemyId: tierOrder >= 4 ? 'EARTH_ELITE' : 'EARTH_GRUNT',
        count: count(2 + act),
        interval: interval(0.45),
      });
      if (tierOrder >= 5)
        groups.push({
          enemyId: tierOrder % 2 ? 'EARTH_REGENERATOR' : 'EARTH_SHIELDED',
          count: count(Math.max(1, act - 2)),
          interval: interval(0.55),
        });
      groups.push({ enemyId: 'EARTH_BOSS', count: 1, interval: 0 });
    } else {
      groups.push({
        enemyId: 'EARTH_GRUNT',
        count: count(3 + act + (wave % 3)),
        interval: interval(0.5),
      });
      if (wave >= 6)
        groups.push({
          enemyId: 'EARTH_RUNNER',
          count: count(1 + Math.floor(act / 2)),
          interval: interval(0.36),
        });
      if (wave >= 11)
        groups.push({
          enemyId: tierOrder >= 2 ? 'EARTH_ELITE' : 'EARTH_TANK',
          count: count(Math.max(1, act - 1)),
          interval: interval(0.7),
        });
      if (wave >= 16 && tierOrder >= 3)
        groups.push({
          enemyId: tierOrder % 2 ? 'EARTH_REGENERATOR' : 'EARTH_SHIELDED',
          count: count(1 + Math.floor(tierOrder / 5)),
          interval: interval(0.72),
        });
      if (wave >= 21 && tierOrder >= 6)
        groups.push({
          enemyId: 'EARTH_SUPPORT',
          count: count(1),
          interval: interval(0.65),
        });
    }
    return {
      wave,
      boss,
      bossMultiplier: boss ? BOSS_MULTIPLIERS[act - 1] : 1,
      groups,
    };
  });
}

export interface DungeonConfig {
  id: string;
  name: string;
  englishName: string;
  realm: RealmType;
  tierID: EarthTierId | null;
  tierOrder: number;
  totalWaves: number;
  startingBaseHP: number;
  deploymentCap: number;
  hpMultiplier: number;
  defenseMultiplier: number;
  speedMultiplier: number;
  bossName: string;
  bossTrait: string;
  waves: WaveData[];
}
export const TUTORIAL_WAVES = createWaves(-1);
export const EARTH_TUTORIAL_DUNGEON: DungeonConfig = {
  id: 'EARTH_TUTORIAL_001',
  name: '新手試煉',
  englishName: 'TUTORIAL DUNGEON',
  realm: RealmType.Earth,
  tierID: null,
  tierOrder: -1,
  totalWaves: 25,
  startingBaseHP: 20,
  deploymentCap: 3,
  hpMultiplier: 1,
  defenseMultiplier: 1,
  speedMultiplier: 1,
  bossName: '地脈破壞者',
  bossTrait: '重甲',
  waves: TUTORIAL_WAVES,
};
export function getEarthDungeon(tierID: EarthTierId): DungeonConfig {
  const tier = getEarthTier(tierID);
  return {
    id: `EARTH_${tierID}_DUNGEON`,
    name: tier.dungeonName,
    englishName: `${tierID} EARTH TRIAL`,
    realm: RealmType.Earth,
    tierID,
    tierOrder: tier.order,
    totalWaves: 25,
    startingBaseHP: 20,
    deploymentCap: tier.deploymentCap,
    hpMultiplier: tier.hpMultiplier,
    defenseMultiplier: tier.defenseMultiplier,
    speedMultiplier: tier.speedMultiplier,
    bossName: tier.bossName,
    bossTrait: tier.bossTrait,
    waves: createWaves(tier.order),
  };
}
