import { GameState, PlayerSave } from './types';

export const PREPARATION_REQUIRED_DAYS = 5;

export function canAwaken(save: PlayerSave): boolean {
  return save.awakeningUnlocked && !save.awakeningCompleted && !save.earthCareerRngUsed && !save.earthCareer;
}

export function advancePreparation(save: PlayerSave): PlayerSave {
  if (!save.awakeningCompleted || !save.starterTowerRewardClaimed || save.preparationDay >= PREPARATION_REQUIRED_DAYS) return save;
  const preparationDay = Math.min(PREPARATION_REQUIRED_DAYS, save.preparationDay + 1);
  return {
    ...save,
    preparationDay,
    currentGameState: preparationDay >= PREPARATION_REQUIRED_DAYS ? GameState.TutorialAvailable : GameState.Preparation,
  };
}

export function unlockAwakening(save: PlayerSave): PlayerSave {
  if (save.awakeningCompleted) return save;
  return { ...save, awakeningUnlocked: true, currentGameState: GameState.AwakeningAvailable };
}

export function canEnterTutorial(save: PlayerSave): boolean {
  return Boolean(save.earthCareer && save.starterTowerRewardClaimed && save.preparationDay >= PREPARATION_REQUIRED_DAYS);
}
