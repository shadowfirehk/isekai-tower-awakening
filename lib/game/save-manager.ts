import { isCareerId } from './careers';
import { MATERIAL_DATABASE } from './materials';
import { TOWER_CATALOG } from './towers';
import { CareerId, EarthProgressData, EarthTierId, EarthTierProgress, EARTH_TIER_IDS, GameState, OwnedTowerProgress, PlayerSave, TowerId } from './types';

export const SAVE_VERSION = 6;
export const SAVE_KEY = 'rng-isekai-tower-player-save';
const LEGACY_SAVE_KEY = 'rng-isekai-tower-save-v1';
const LEGACY_PENDING_KEY = 'rng-isekai-tower-pending-v1';
const STARTER_TOWER: TowerId = 'EARTH_BASIC_AUTO_TURRET';
const VALID_TOWERS = new Set<TowerId>(Object.keys(TOWER_CATALOG) as TowerId[]);

function emptyTierProgress(unlocked = false): EarthTierProgress {
  return { unlocked, cleared:false, clearCount:0, bestWave:0, bossDefeated:false, firstClearRewardClaimed:false, milestoneRewardsClaimed:[], tierTowerRewardClaimed:false };
}

export function createEarthProgress(tutorialCleared = false): EarthProgressData {
  return {
    highestUnlockedTier:tutorialCleared ? 'NORMAL' : null, highestClearedTier:null, totalEarthPower:0, tutorialCleared,
    tierProgress:Object.fromEntries(EARTH_TIER_IDS.map(id => [id,emptyTierProgress(tutorialCleared && id === 'NORMAL')])) as Record<EarthTierId,EarthTierProgress>,
    earthCompleted:false, earthCompletionRewardClaimed:false, completionBadge:null,
  };
}

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
    earthRegion: createEarthProgress(false),
    earthLoadout: [],
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
    if (!towerID || !VALID_TOWERS.has(towerID as TowerId) || result.some(tower => tower.towerID === towerID)) continue;
    const detail = typeof entry === 'object' && entry ? entry as Partial<OwnedTowerProgress> : {};
    result.push({
      towerID: towerID as TowerId,
      level: Math.max(1, Math.floor(Number(detail.level ?? legacyLevels[towerID] ?? 1))),
      stars: Math.min(5, Math.max(1, Math.floor(Number(detail.stars ?? legacyStars[towerID] ?? 1)))),
      unlocked: detail.unlocked !== false,
      obtainedAt: typeof detail.obtainedAt === 'string' ? detail.obtainedAt : now,
    });
  }
  return result;
}

function normalizeEarthProgress(raw: unknown, tutorialCleared: boolean): EarthProgressData {
  const source = raw && typeof raw === 'object' ? raw as Partial<EarthProgressData> : {};
  const tiers = source.tierProgress && typeof source.tierProgress === 'object' ? source.tierProgress : {} as EarthProgressData['tierProgress'];
  const tierProgress = Object.fromEntries(EARTH_TIER_IDS.map((id,index) => {
    const entry = tiers[id] && typeof tiers[id] === 'object' ? tiers[id] as Partial<EarthTierProgress> : {};
    const cleared = Boolean(entry.cleared);
    return [id, {
      unlocked:Boolean(entry.unlocked || (tutorialCleared && index === 0)), cleared,
      clearCount:Math.max(cleared ? 1 : 0,Math.floor(Number(entry.clearCount ?? 0))),
      bestWave:Math.min(25,Math.max(cleared ? 25 : 0,Math.floor(Number(entry.bestWave ?? 0)))),
      bossDefeated:Boolean(entry.bossDefeated || cleared), firstClearRewardClaimed:Boolean(entry.firstClearRewardClaimed || cleared),
      milestoneRewardsClaimed:Array.isArray(entry.milestoneRewardsClaimed) ? entry.milestoneRewardsClaimed.filter((value):value is string => typeof value === 'string') : [],
      tierTowerRewardClaimed:Boolean(entry.tierTowerRewardClaimed || cleared),
    }];
  })) as Record<EarthTierId,EarthTierProgress>;
  // Rebuild the legal contiguous route; a save can never jump across a locked tier.
  let highestUnlockedTier: EarthTierId | null = tutorialCleared ? 'NORMAL' : null;
  let highestClearedTier: EarthTierId | null = null;
  if (tutorialCleared) tierProgress.NORMAL.unlocked = true;
  for (let i=0;i<EARTH_TIER_IDS.length;i++) {
    const id=EARTH_TIER_IDS[i];
    if (!tierProgress[id].unlocked) break;
    highestUnlockedTier=id;
    if (!tierProgress[id].cleared) break;
    highestClearedTier=id;
    const next=EARTH_TIER_IDS[i+1];
    if (next) tierProgress[next].unlocked=true;
  }
  const earthCompleted=Boolean(source.earthCompleted || tierProgress.SOVEREIGN.cleared);
  return {
    highestUnlockedTier,highestClearedTier,totalEarthPower:Math.max(0,Math.floor(Number(source.totalEarthPower ?? 0))),
    tutorialCleared,tierProgress,earthCompleted,
    earthCompletionRewardClaimed:Boolean(source.earthCompletionRewardClaimed || earthCompleted),
    completionBadge:earthCompleted ? (typeof source.completionBadge === 'string' ? source.completionBadge : 'EARTH SOVEREIGN') : null,
  };
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
  const materialsById = Object.fromEntries(Object.keys(MATERIAL_DATABASE).map(id => [id,Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(Number(rawInventory[id] ?? 0))))]));
  materialsById.EARTH_BASIC_MATERIAL=basicMaterial;
  materialsById.EARTH_STAR_CORE=starCore;
  const earthRegion=normalizeEarthProgress(input.earthRegion,earthTutorialCleared);
  const rawLoadout=Array.isArray(input.earthLoadout) ? input.earthLoadout : [];
  const earthLoadout=rawLoadout.filter((id):id is TowerId => typeof id === 'string' && VALID_TOWERS.has(id as TowerId) && ownedTowers.some(tower => tower.towerID === id)).filter((id,index,array)=>array.indexOf(id)===index).slice(0,3);
  if (earthLoadout.length===0 && ownedTowers.some(tower=>tower.towerID===STARTER_TOWER)) earthLoadout.push(STARTER_TOWER);
  earthRegion.totalEarthPower=Math.round(ownedTowers.reduce((total,tower)=>total+TOWER_CATALOG[tower.towerID].baseStats.attack*(1+(tower.level-1)*.05)*(1+(tower.stars-1)*.25),0));
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
    earthRegion,
    earthLoadout,
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
      return { save, warning: migrated ? '已將舊版存檔升級至 Phase 6。' : undefined };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<PlayerSave> & Record<string, unknown>;
      const save = normalizeSave(parsed);
      if (Number(parsed.saveVersion) !== SAVE_VERSION) this.save(save);
      return { save, warning: Number(parsed.saveVersion) !== SAVE_VERSION ? '永久存檔已安全升級至 Phase 6，地球進度已建立。' : undefined };
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
