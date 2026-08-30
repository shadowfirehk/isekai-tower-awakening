import { getCareerById } from './careers';
import { PlayerSave, StatModifier } from './types';

export function getCareerModifiers(save: PlayerSave): StatModifier[] {
  return [save.earthCareer, save.galaxyCareer, save.universeCareer]
    .flatMap(id => getCareerById(id)?.modifiers ?? []);
}

export function getDefenseMultiplier(save: PlayerSave): number {
  const bonus = getCareerModifiers(save)
    .filter(modifier => modifier.type === 'DEFENSE_PERCENT')
    .reduce((sum, modifier) => sum + modifier.value, 0);
  return 1 + bonus;
}
