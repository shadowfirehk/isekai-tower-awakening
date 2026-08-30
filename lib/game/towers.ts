import { PlayerSave, RealmType, TowerData, TowerId } from './types';

export const STARTER_TOWER_ID: TowerId = 'EARTH_BASIC_AUTO_TURRET';

export const TOWER_CATALOG: Record<TowerId, TowerData> = {
  EARTH_BASIC_AUTO_TURRET: {
    id: 'EARTH_BASIC_AUTO_TURRET',
    name: '大地自動炮塔',
    englishName: 'EARTH AUTO TURRET',
    realm: RealmType.Earth,
    rarity: 'NORMAL',
    description: '由地球核心驅動的基礎自動炮塔，會優先攻擊最接近終點的敵人。',
    baseStats: {
      attack: 100,
      defense: 50,
      maxHP: 500,
      attackSpeed: 1,
      range: 6,
      critChance: 0.05,
      critDamage: 1.5,
      accuracy: 1,
      penetration: 0,
    },
    scaleAttackSpeedWithStars: false,
  },
};

export function getTowerById(id: TowerId | null | undefined): TowerData | null {
  return id ? TOWER_CATALOG[id] ?? null : null;
}

export function grantStarterTower(save: PlayerSave, now = new Date().toISOString()): PlayerSave {
  if (save.starterTowerRewardClaimed) return save;
  const owned = save.ownedTowers.some(tower => tower.towerID === STARTER_TOWER_ID);
  return {
    ...save,
    starterTowerRewardClaimed: true,
    ownedTowers: owned
      ? save.ownedTowers
      : [...save.ownedTowers, { towerID: STARTER_TOWER_ID, level: 1, stars: 1, unlocked: true, obtainedAt: now }],
  };
}

export function getOwnedTower(save: PlayerSave, towerId: TowerId) {
  return save.ownedTowers.find(tower => tower.towerID === towerId && tower.unlocked) ?? null;
}
