import { EnemyData, EnemyId, RealmType } from './types';

export const EARTH_MATERIAL_ID = 'EARTH_BASIC_MATERIAL';

export const ENEMY_CATALOG: Record<EnemyId, EnemyData> = {
  EARTH_GRUNT: { id: 'EARTH_GRUNT', name: '裂隙行者', maxHP: 80, defense: 10, speed: 0.07, baseDamage: 1, reward: 2, boss: false },
  EARTH_RUNNER: { id: 'EARTH_RUNNER', name: '疾行獵獸', maxHP: 58, defense: 4, speed: 0.105, baseDamage: 1, reward: 3, boss: false },
  EARTH_TANK: { id: 'EARTH_TANK', name: '岩甲巨獸', maxHP: 260, defense: 35, speed: 0.043, baseDamage: 1, reward: 6, boss: false },
  EARTH_BOSS: { id: 'EARTH_BOSS', name: '地脈破壞者', maxHP: 650, defense: 28, speed: 0.032, baseDamage: 5, reward: 25, boss: true },
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

export const TUTORIAL_WAVES: WaveData[] = Array.from({ length: 25 }, (_, index) => {
  const wave = index + 1;
  const boss = wave % 5 === 0;
  const tier = Math.ceil(wave / 5);
  const groups: WaveGroup[] = [];
  if (boss) {
    groups.push({ enemyId: 'EARTH_GRUNT', count: 2 + tier, interval: 0.55 });
    if (tier >= 2) groups.push({ enemyId: 'EARTH_RUNNER', count: tier, interval: 0.42 });
    groups.push({ enemyId: 'EARTH_BOSS', count: 1, interval: 0 });
  } else {
    groups.push({ enemyId: 'EARTH_GRUNT', count: 3 + tier + (wave % 3), interval: 0.55 });
    if (wave >= 6) groups.push({ enemyId: 'EARTH_RUNNER', count: 1 + Math.floor(tier / 2), interval: 0.4 });
    if (wave >= 11) groups.push({ enemyId: 'EARTH_TANK', count: Math.max(1, tier - 1), interval: 0.8 });
  }
  return { wave, boss, bossMultiplier: boss ? BOSS_MULTIPLIERS[tier - 1] : 1, groups };
});

export const EARTH_TUTORIAL_DUNGEON = {
  id: 'EARTH_TUTORIAL_001',
  name: '新手試煉',
  englishName: 'TUTORIAL DUNGEON',
  realm: RealmType.Earth,
  totalWaves: 25,
  startingBaseHP: 20,
  deploymentCap: 3,
  firstClearReward: { materialId: EARTH_MATERIAL_ID, amount: 100 },
  waves: TUTORIAL_WAVES,
} as const;
