import { canAwaken } from './progression';
import { RNGManager } from './rng-manager';
import { SaveManager } from './save-manager';
import { grantStarterTower } from './towers';
import { GameState, PlayerSave, RealmType } from './types';

type AwakeningResult = { ok: true; save: PlayerSave } | { ok: false; error: string };

export const AwakeningController = {
  beginEarthAwakening(save: PlayerSave): AwakeningResult {
    if (!canAwaken(save)) return { ok: false, error: '目前無法進行地球職業覺醒。' };
    const result = RNGManager.rollCareer(RealmType.Earth, save);
    if (!result.ok) return result;
    const pendingSave: PlayerSave = {
      ...save,
      currentGameState: GameState.CareerObtained,
      awakeningCompleted: true,
      awakeningRevealAcknowledged: false,
      earthCareerRngUsed: true,
      earthCareer: result.careerId,
    };
    const persisted = SaveManager.save(pendingSave);
    if (!persisted.ok) return persisted;
    return { ok: true, save: persisted.save };
  },

  acknowledgeReveal(save: PlayerSave): AwakeningResult {
    if (!save.earthCareer || !save.earthCareerRngUsed) return { ok: false, error: '找不到已保存的覺醒結果。' };
    const rewarded = grantStarterTower(save);
    const persisted = SaveManager.save({
      ...rewarded,
      awakeningRevealAcknowledged: true,
      preparationDay: Math.max(1, rewarded.preparationDay),
      currentGameState: GameState.Preparation,
    });
    if (!persisted.ok) return persisted;
    return { ok: true, save: persisted.save };
  },
};
