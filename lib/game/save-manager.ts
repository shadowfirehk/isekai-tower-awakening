import { isCareerId } from './careers';
import { CareerId, GameState, PlayerSave } from './types';

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'rng-isekai-tower-player-save';
const LEGACY_SAVE_KEY = 'rng-isekai-tower-save-v1';
const LEGACY_PENDING_KEY = 'rng-isekai-tower-pending-v1';

export function createNewSave(now = new Date().toISOString()): PlayerSave {
  return {
    saveVersion: SAVE_VERSION,
    playerLevel: 1,
    playerAge: 17,
    preparationDay: 0,
    currentGameState: GameState.Preparation,
    awakeningUnlocked: false,
    awakeningCompleted: false,
    awakeningRevealAcknowledged: false,
    earthCareer: null,
    galaxyCareer: null,
    universeCareer: null,
    earthCareerRngUsed: false,
    galaxyCareerRngUsed: false,
    universeCareerRngUsed: false,
    ownedTowers: [],
    towerLevels: {},
    towerStars: {},
    materials: 0,
    currency: 18200,
    earthProgress: 0,
    galaxyProgress: 0,
    universeProgress: 0,
    saveCreatedAt: now,
    lastSaveAt: now,
  };
}

function normalizeCareer(value: unknown): CareerId | null {
  return isCareerId(value) ? value : null;
}

function normalizeSave(raw: Partial<PlayerSave>): PlayerSave {
  const base = createNewSave(typeof raw.saveCreatedAt === 'string' ? raw.saveCreatedAt : undefined);
  const preparationDay = Math.max(0, Math.min(5, Number(raw.preparationDay ?? base.preparationDay)));
  const earthCareer = normalizeCareer(raw.earthCareer);
  const awakeningCompleted = Boolean(raw.awakeningCompleted || earthCareer);
  const earthCareerRngUsed = Boolean(raw.earthCareerRngUsed || earthCareer);
  return {
    ...base,
    ...raw,
    saveVersion: SAVE_VERSION,
    playerLevel: Math.max(1, Number(raw.playerLevel ?? base.playerLevel)),
    playerAge: Math.max(17, Number(raw.playerAge ?? base.playerAge)),
    preparationDay,
    awakeningUnlocked: Boolean(raw.awakeningUnlocked || preparationDay >= 5 || awakeningCompleted),
    awakeningCompleted,
    awakeningRevealAcknowledged: Boolean(raw.awakeningRevealAcknowledged),
    earthCareer,
    galaxyCareer: normalizeCareer(raw.galaxyCareer),
    universeCareer: normalizeCareer(raw.universeCareer),
    earthCareerRngUsed,
    galaxyCareerRngUsed: Boolean(raw.galaxyCareerRngUsed),
    universeCareerRngUsed: Boolean(raw.universeCareerRngUsed),
    ownedTowers: Array.isArray(raw.ownedTowers) ? raw.ownedTowers.filter((value): value is string => typeof value === 'string') : [],
    towerLevels: raw.towerLevels && typeof raw.towerLevels === 'object' ? raw.towerLevels : {},
    towerStars: raw.towerStars && typeof raw.towerStars === 'object' ? raw.towerStars : {},
    materials: Math.max(0, Number(raw.materials ?? 0)),
    currency: Math.max(0, Number(raw.currency ?? 18200)),
    earthProgress: Math.max(0, Number(raw.earthProgress ?? 0)),
    galaxyProgress: Math.max(0, Number(raw.galaxyProgress ?? 0)),
    universeProgress: Math.max(0, Number(raw.universeProgress ?? 0)),
    saveCreatedAt: typeof raw.saveCreatedAt === 'string' ? raw.saveCreatedAt : base.saveCreatedAt,
    lastSaveAt: typeof raw.lastSaveAt === 'string' ? raw.lastSaveAt : base.lastSaveAt,
    currentGameState: Object.values(GameState).includes(raw.currentGameState as GameState)
      ? raw.currentGameState as GameState
      : (awakeningCompleted ? GameState.CareerObtained : preparationDay >= 5 ? GameState.AwakeningAvailable : GameState.Preparation),
  };
}

function migrateLegacy(): PlayerSave | null {
  const legacyCareer = localStorage.getItem(LEGACY_SAVE_KEY);
  const legacyPending = localStorage.getItem(LEGACY_PENDING_KEY);
  if (!legacyCareer && !legacyPending) return null;
  const save = createNewSave();
  save.preparationDay = 5;
  save.awakeningUnlocked = true;
  save.awakeningCompleted = true;
  save.earthCareerRngUsed = true;
  save.earthCareer = 'EARTH_WALL_GUARDIAN';
  save.awakeningRevealAcknowledged = Boolean(legacyCareer);
  save.currentGameState = legacyCareer ? GameState.TutorialAvailable : GameState.CareerObtained;
  return save;
}

export const SaveManager = {
  load(): { save: PlayerSave; warning?: string } {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const migrated = migrateLegacy();
      const save = migrated ?? createNewSave();
      this.save(save);
      return { save, warning: migrated ? '已將舊版存檔升級至 Phase 2。' : undefined };
    }
    try {
      return { save: normalizeSave(JSON.parse(raw) as Partial<PlayerSave>) };
    } catch (error) {
      console.error('[SaveManager] Corrupted save data. A safe new save was created.', error);
      const save = createNewSave();
      this.save(save);
      return { save, warning: '偵測到損壞存檔，已建立安全的新存檔。' };
    }
  },

  save(save: PlayerSave): { ok: true; save: PlayerSave } | { ok: false; error: string } {
    const updated = { ...normalizeSave(save), lastSaveAt: new Date().toISOString() };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
      return { ok: true, save: updated };
    } catch (error) {
      console.error('[SaveManager] Save failed.', error);
      return { ok: false, error: '無法寫入永久存檔，覺醒已安全取消。' };
    }
  },

  reset(): PlayerSave {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
    localStorage.removeItem(LEGACY_PENDING_KEY);
    const save = createNewSave();
    this.save(save);
    return save;
  },
};
