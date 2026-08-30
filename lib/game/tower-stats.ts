import { getCareerModifiers } from './passives';
import { FinalTowerStats, OwnedTowerProgress, PlayerSave, TowerData } from './types';

export const MAX_TOWER_STARS = 5;

export function levelMultiplier(level: number) {
  return 1 + (Math.max(1, level) - 1) * 0.05;
}

export function starMultiplier(stars: number) {
  return 1 + (Math.min(MAX_TOWER_STARS, Math.max(1, stars)) - 1) * 0.25;
}

export function calculateTowerStats(data: TowerData, progress: OwnedTowerProgress, save: PlayerSave): FinalTowerStats {
  const level = levelMultiplier(progress.level);
  const star = starMultiplier(progress.stars);
  const defenseBonus = getCareerModifiers(save)
    .filter(modifier => modifier.type === 'DEFENSE_PERCENT')
    .reduce((total, modifier) => total + modifier.value, 0);
  return {
    attack: data.baseStats.attack * level * star,
    defense: data.baseStats.defense * level * star * (1 + defenseBonus),
    maxHP: data.baseStats.maxHP * level * star,
    attackSpeed: data.baseStats.attackSpeed * (data.scaleAttackSpeedWithStars ? star : 1),
    range: data.baseStats.range * star,
    critChance: data.baseStats.critChance,
    critDamage: data.baseStats.critDamage,
    accuracy: data.baseStats.accuracy,
    penetration: data.baseStats.penetration * level * star,
    levelMultiplier: level,
    starMultiplier: star,
  };
}
