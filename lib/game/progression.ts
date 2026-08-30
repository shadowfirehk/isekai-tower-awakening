import { GameState, PlayerSave } from './types';

export const PREPARATION_REQUIRED_DAYS = 5;

export function canAwaken(save: PlayerSave): boolean {
  return save.awakeningUnlocked && !save.awakeningCompleted && !save.earthCareerRngUsed && !save.earthCareer;
}

export function advancePreparation(save: PlayerSave): PlayerSave {
  if (save.awakeningCompleted) return save;
  const preparationDay = Math.min(PREPARATION_REQUIRED_DAYS, save.preparationDay + 1);
  const awakeningUnlocked = preparationDay >= PREPARATION_REQUIRED_DAYS;
  return {
    ...save,
    preparationDay,
    awakeningUnlocked,
    currentGameState: awakeningUnlocked ? GameState.AwakeningAvailable : GameState.Preparation,
  };
}

export function unlockAwakening(save: PlayerSave): PlayerSave {
  if (save.awakeningCompleted) return save;
  return { ...save, preparationDay: PREPARATION_REQUIRED_DAYS, awakeningUnlocked: true, currentGameState: GameState.AwakeningAvailable };
}
