import { isCareerId } from './careers';
import { CareerId, GameState, OwnedTowerProgress, PlayerSave, TowerId } from './types';

export const SAVE_VERSION = 5;
export const SAVE_KEY = 'rng-isekai-tower-player-save';
const LEGACY_SAVE_KEY = 'rng-isekai-tower-save-v1';
const LEGACY_PENDING_KEY = 'rng-isekai-tower-pending-v1';
const STARTER_TOWER: TowerId = 'EARTH_BASIC_AUTO_TURRET';

export function createNewSave(now = new Date().toISOString()): PlayerSave {
  return {
    saveVersion: SAVE_VERSION,
    playerLevel: 1,
    playerAge: 17,
    preparationDay: 0,
    currentGameState: GameState.AwakeningAvailable,
    awakeningUnlocked: true,
    awakeningCompleted: false,
    awakeningRevealAcknowledged: false,
    earthCareer: null,
    galaxyCareer: null,
    universeCareer: null,
    earthCareerRngUsed: false,
    galaxyCareerRngUsed: false,
    universeCareerRngUsed: false,
    starterTowerRewardClaimed: false,
    ownedTowers: [],
    materials: 0,
    materialsById: {},
    currency: 18200,
    earthProgress: 0,
    galaxyProgress: 0,
    universeProgress: 0,
    earthTutorialCleared: false,
    tutorialFirstClearRewardClaimed: false,
    tutorialClearCount: 0,
    committedBattleRewardSessionIds: [],
    firstGrowthUpgradeCompleted: false,
    saveCreatedAt: now,
    lastSaveAt: now,
  };
}

function normalizeCareer(value: unknown): CareerId | null {
  return isCareerId(value) ? value : null;
}

function normalizeOwnedTowers(raw: Record<string, unknown>, now: string): OwnedTowerProgress[] {
  const source = Array.isArray(raw.ownedTowers) ? raw.ownedTowers : [];
  const legacyLevels = raw.towerLevels && typeof raw.towerLevels === 'object' ? raw.towerLevels as Record<string, number> : {};
  const legacyStars = raw.towerStars && typeof raw.towerStars === 'object' ? raw.towerStars as Record<string, number> : {};
  const result: OwnedTowerProgress[] = [];
  for (const entry of source) {
    const towerID = typeof entry === 'string' ? entry : (entry as Partial<OwnedTowerProgress>)?.towerID;
    if (towerID !== STARTER_TOWER || result.some(tower => tower.towerID === towerID)) continue;
    const detail = typeof entry === 'object' && entry ? entry as Partial<OwnedTowerProgress> : {};
    result.push({
      towerID,
      level: Math.max(1, Math.floor(Number(detail.level ?? legacyLevels[towerID] ?? 1))),
      stars: Math.min(5, Math.max(1, Math.floor(Number(detail.stars ?? legacyStars[towerID] ?? 1)))),
      unlocked: detail.unlocked !== false,
      obtainedAt: typeof detail.obtainedAt === 'string' ? detail.obtainedAt : now,
    });
  }
  return result;
}

function normalizeSave(input: Partial<PlayerSave>): PlayerSave {
  const raw = input as Record<string, unknown>;
  const base = createNewSave(typeof input.saveCreatedAt === 'string' ? input.saveCreatedAt : undefined);
  const oldVersion = Number(input.saveVersion ?? 1);
  const earthCareer = normalizeCareer(input.earthCareer);
  const awakeningCompleted = Boolean(input.awakeningCompleted || earthCareer);
  const acknowledged = Boolean(input.awakeningRevealAcknowledged);
  const preparationDay = earthCareer
    ? Math.min(5, Math.max(acknowledged ? 1 : 0, Math.floor(Number(input.preparationDay ?? 0))))
    : 0;
  const now = base.saveCreatedAt;
  let ownedTowers = normalizeOwnedTowers(raw, now);
  const legacyCareerCompleted = oldVersion < SAVE_VERSION && Boolean(earthCareer && acknowledged);
  const starterTowerRewardClaimed = Boolean(input.starterTowerRewardClaimed || legacyCareerCompleted);
  if (starterTowerRewardClaimed && !ownedTowers.some(tower => tower.towerID === STARTER_TOWER)) {
    ownedTowers = [...ownedTowers, { towerID: STARTER_TOWER, level: 1, stars: 1, unlocked: true, obtainedAt: now }];
  }
  const tutorialFirstClearRewardClaimed = Boolean(input.tutorialFirstClearRewardClaimed);
  const earthTutorialCleared = Boolean(input.earthTutorialCleared || tutorialFirstClearRewardClaimed);
  const rawInventory = input.materialsById && typeof input.materialsById === 'object' ? input.materialsById as Record<string, number> : {};
  let basicMaterial = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(Number(rawInventory.EARTH_BASIC_MATERIAL ?? input.materials ?? 0))));
  let starCore = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(Number(rawInventory.EARTH_STAR_CORE ?? 0))));
  if (oldVersion < SAVE_VERSION && tutorialFirstClearRewardClaimed) {
    basicMaterial = Math.max(150, basicMaterial);
    starCore = Math.max(1, starCore);
  }
  const materialsById = { EARTH_BASIC_MATERIAL: basicMaterial, EARTH_STAR_CORE: starCore };
  let currentGameState = GameState.AwakeningAvailable;
  if (earthTutorialCleared) currentGameState = GameState.EarthProgress;
  else if (earthCareer && !acknowledged) currentGameState = GameState.CareerObtained;
  else if (earthCareer && starterTowerRewardClaimed && preparationDay >= 5) currentGameState = GameState.TutorialAvailable;
  else if (earthCareer && starterTowerRewardClaimed) currentGameState = GameState.Preparation;

  return {
    ...base,
    saveVersion: SAVE_VERSION,
    playerLevel: Math.max(1, Number(input.playerLevel ?? base.playerLevel)),
    playerAge: Math.max(17, Number(input.playerAge ?? base.playerAge)),
    preparationDay,
    currentGameState,
    awakeningUnlocked: !awakeningCompleted,
    awakeningCompleted,
    awakeningRevealAcknowledged: acknowledged,
    earthCareer,
    galaxyCareer: normalizeCareer(input.galaxyCareer),
    universeCareer: normalizeCareer(input.universeCareer),
    earthCareerRngUsed: Boolean(input.earthCareerRngUsed || earthCareer),
    galaxyCareerRngUsed: Boolean(input.galaxyCareerRngUsed),
    universeCareerRngUsed: Boolean(input.universeCareerRngUsed),
    starterTowerRewardClaimed,
    ownedTowers,
    materials: basicMaterial,
    materialsById,
    currency: Math.max(0, Number(input.currency ?? 18200)),
    earthProgress: Math.max(0, Number(input.earthProgress ?? 0)),
    galaxyProgress: Math.max(0, Number(input.galaxyProgress ?? 0)),
    universeProgress: Math.max(0, Number(input.universeProgress ?? 0)),
    earthTutorialCleared,
    tutorialFirstClearRewardClaimed,
    tutorialClearCount: Math.max(0, Math.floor(Number(input.tutorialClearCount ?? (earthTutorialCleared ? 1 : 0)))),
    committedBattleRewardSessionIds: Array.isArray(input.committedBattleRewardSessionIds)
      ? input.committedBattleRewardSessionIds.filter((id): id is string => typeof id === 'string').slice(-50)
      : [],
    firstGrowthUpgradeCompleted: Boolean(input.firstGrowthUpgradeCompleted || ownedTowers.some(tower => tower.level > 1 || tower.stars > 1)),
    saveCreatedAt: typeof input.saveCreatedAt === 'string' ? input.saveCreatedAt : base.saveCreatedAt,
    lastSaveAt: typeof input.lastSaveAt === 'string' ? input.lastSaveAt : base.lastSaveAt,
  };
}

function migrateLegacy(): PlayerSave | null {
  const legacyCareer = localStorage.getItem(LEGACY_SAVE_KEY);
  const legacyPending = localStorage.getItem(LEGACY_PENDING_KEY);
  if (!legacyCareer && !legacyPending) return null;
  const save = createNewSave();
  save.awakeningCompleted = true;
  save.earthCareerRngUsed = true;
  save.earthCareer = 'EARTH_WALL_GUARDIAN';
  save.awakeningRevealAcknowledged = Boolean(legacyCareer);
  save.currentGameState = GameState.CareerObtained;
  return normalizeSave(save);
}

export const SaveManager = {
  load(): { save: PlayerSave; warning?: string } {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const migrated = migrateLegacy();
      const save = migrated ?? createNewSave();
      this.save(save);
      return { save, warning: migrated ? '已將舊版存檔升級至 Phase 5。' : undefined };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<PlayerSave> & Record<string, unknown>;
      const save = normalizeSave(parsed);
      if (Number(parsed.saveVersion) !== SAVE_VERSION) this.save(save);
      return { save, warning: Number(parsed.saveVersion) !== SAVE_VERSION ? '永久存檔已安全升級至 Phase 5，已補發成長素材。' : undefined };
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
      return { ok: false, error: '無法寫入永久存檔，操作已安全取消。' };
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
