import { EARTH_MATERIAL_ID, EARTH_TUTORIAL_DUNGEON } from './dungeon-data';
import { GameState, PlayerSave } from './types';

export function applyTutorialVictory(save: PlayerSave): { save: PlayerSave; rewardGranted: boolean } {
  const rewardGranted = !save.tutorialFirstClearRewardClaimed;
  const amount = rewardGranted ? EARTH_TUTORIAL_DUNGEON.firstClearReward.amount : 0;
  return {
    rewardGranted,
    save: {
      ...save,
      currentGameState: GameState.EarthProgress,
      earthTutorialCleared: true,
      tutorialFirstClearRewardClaimed: true,
      tutorialClearCount: save.tutorialClearCount + 1,
      earthProgress: Math.max(1, save.earthProgress),
      materials: save.materials + amount,
      materialsById: {
        ...save.materialsById,
        [EARTH_MATERIAL_ID]: (save.materialsById[EARTH_MATERIAL_ID] ?? 0) + amount,
      },
    },
  };
}
