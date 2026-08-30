import { InventoryService } from './inventory-service';
import { PROGRESSION_CONFIG } from './progression-config';
import { SaveManager } from './save-manager';
import { GameState, PlayerSave, RewardResult } from './types';

type PersistResult = { ok: true; save: PlayerSave } | { ok: false; error: string };
type PersistFn = (save: PlayerSave) => PersistResult;

export type RewardCommitResult =
  | { ok: true; save: PlayerSave; reward: RewardResult; duplicate: boolean }
  | { ok: false; error: 'INVALID_SESSION' | 'INVENTORY_ERROR' | 'SAVE_FAILED'; message: string };

export const RewardService = {
  commitTutorialVictory(
    save: PlayerSave,
    battleSessionID: string,
    persist: PersistFn = next => SaveManager.save(next),
  ): RewardCommitResult {
    if (!battleSessionID) return { ok: false, error: 'INVALID_SESSION', message: '戰鬥場次識別無效。' };
    const duplicate = save.committedBattleRewardSessionIds.includes(battleSessionID);
    if (duplicate) {
      return { ok: true, save, duplicate: true, reward: { dungeonID: 'EARTH_TUTORIAL_001', battleSessionID, firstClear: false, materials: [] } };
    }
    const firstClear = !save.tutorialFirstClearRewardClaimed;
    const materials = [
      ...PROGRESSION_CONFIG.tutorialRewards.standard,
      ...(firstClear ? PROGRESSION_CONFIG.tutorialRewards.firstClearBonus : []),
    ];
    const inventory = InventoryService.applyRewards(save, materials);
    if (!inventory.ok) return { ok: false, error: 'INVENTORY_ERROR', message: `素材發放失敗：${inventory.error}` };
    const next: PlayerSave = {
      ...inventory.save,
      currentGameState: GameState.EarthProgress,
      earthTutorialCleared: true,
      tutorialFirstClearRewardClaimed: true,
      tutorialClearCount: save.tutorialClearCount + 1,
      earthProgress: Math.max(1, save.earthProgress),
      committedBattleRewardSessionIds: [...save.committedBattleRewardSessionIds, battleSessionID].slice(-50),
    };
    const saved = persist(next);
    if (!saved.ok) return { ok: false, error: 'SAVE_FAILED', message: saved.error };
    return {
      ok: true,
      save: saved.save,
      duplicate: false,
      reward: { dungeonID: 'EARTH_TUTORIAL_001', battleSessionID, firstClear, materials },
    };
  },
};
