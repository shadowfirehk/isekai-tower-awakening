import { InventoryService } from './inventory-service';
import { PROGRESSION_CONFIG } from './progression-config';
import { SaveManager } from './save-manager';
import { calculateTowerStats } from './tower-stats';
import { getTowerById } from './towers';
import { FinalTowerStats, MaterialReward, OwnedTowerProgress, PlayerSave, TowerId } from './types';

export type UpgradeFailureReason =
  | 'TOWER_NOT_OWNED'
  | 'MAX_LEVEL'
  | 'MAX_STAR'
  | 'INSUFFICIENT_MATERIAL'
  | 'INVALID_TOWER_DATA'
  | 'SAVE_FAILED'
  | 'INVALID_UPGRADE_CONFIG';

export interface UpgradePreview {
  kind: 'LEVEL' | 'STAR';
  from: number;
  to: number;
  costs: MaterialReward[];
  currentStats: FinalTowerStats;
  projectedStats: FinalTowerStats;
}

type PersistResult = { ok: true; save: PlayerSave } | { ok: false; error: string };
type PersistFn = (save: PlayerSave) => PersistResult;
export type UpgradeResult =
  | { ok: true; save: PlayerSave; preview: UpgradePreview }
  | { ok: false; reason: UpgradeFailureReason; message: string };

function getContext(save: PlayerSave, towerID: TowerId) {
  const index = save.ownedTowers.findIndex(tower => tower.towerID === towerID && tower.unlocked);
  const progress = index >= 0 ? save.ownedTowers[index] : null;
  const data = getTowerById(towerID);
  return { index, progress, data };
}

function getLevelCosts(progress: OwnedTowerProgress): MaterialReward[] | null {
  const amount = PROGRESSION_CONFIG.levelCosts.NORMAL[progress.level - 1];
  return Number.isSafeInteger(amount) ? [{ materialID: 'EARTH_BASIC_MATERIAL', amount }] : null;
}

function getStarCosts(progress: OwnedTowerProgress): MaterialReward[] | null {
  return PROGRESSION_CONFIG.starCosts.NORMAL[progress.stars - 1] ?? null;
}

function makePreview(save: PlayerSave, towerID: TowerId, kind: 'LEVEL' | 'STAR'): UpgradePreview | null {
  const { progress, data } = getContext(save, towerID);
  if (!progress || !data) return null;
  const costs = kind === 'LEVEL' ? getLevelCosts(progress) : getStarCosts(progress);
  if (!costs) return null;
  const projected = { ...progress, [kind === 'LEVEL' ? 'level' : 'stars']: (kind === 'LEVEL' ? progress.level : progress.stars) + 1 };
  return {
    kind,
    from: kind === 'LEVEL' ? progress.level : progress.stars,
    to: (kind === 'LEVEL' ? progress.level : progress.stars) + 1,
    costs,
    currentStats: calculateTowerStats(data, progress, save),
    projectedStats: calculateTowerStats(data, projected, save),
  };
}

function failure(reason: UpgradeFailureReason, message: string): UpgradeResult {
  return { ok: false, reason, message };
}

export const TowerUpgradeService = {
  getLevelUpgradeCost(save: PlayerSave, towerID: TowerId) {
    const progress = getContext(save, towerID).progress;
    return progress ? getLevelCosts(progress) : null;
  },

  getStarUpgradeCost(save: PlayerSave, towerID: TowerId) {
    const progress = getContext(save, towerID).progress;
    return progress ? getStarCosts(progress) : null;
  },

  generateUpgradePreview(save: PlayerSave, towerID: TowerId, kind: 'LEVEL' | 'STAR') {
    return makePreview(save, towerID, kind);
  },

  canUpgradeLevel(save: PlayerSave, towerID: TowerId) {
    const { progress, data } = getContext(save, towerID);
    if (!progress) return { ok: false as const, reason: 'TOWER_NOT_OWNED' as const };
    if (!data) return { ok: false as const, reason: 'INVALID_TOWER_DATA' as const };
    if (progress.level >= PROGRESSION_CONFIG.maxTowerLevel) return { ok: false as const, reason: 'MAX_LEVEL' as const };
    const costs = getLevelCosts(progress);
    if (!costs) return { ok: false as const, reason: 'INVALID_UPGRADE_CONFIG' as const };
    if (costs.some(cost => !InventoryService.hasMaterial(save, cost.materialID, cost.amount))) return { ok: false as const, reason: 'INSUFFICIENT_MATERIAL' as const };
    return { ok: true as const };
  },

  canUpgradeStar(save: PlayerSave, towerID: TowerId) {
    const { progress, data } = getContext(save, towerID);
    if (!progress) return { ok: false as const, reason: 'TOWER_NOT_OWNED' as const };
    if (!data) return { ok: false as const, reason: 'INVALID_TOWER_DATA' as const };
    if (progress.stars >= PROGRESSION_CONFIG.maxTowerStars) return { ok: false as const, reason: 'MAX_STAR' as const };
    const costs = getStarCosts(progress);
    if (!costs) return { ok: false as const, reason: 'INVALID_UPGRADE_CONFIG' as const };
    if (costs.some(cost => !InventoryService.hasMaterial(save, cost.materialID, cost.amount))) return { ok: false as const, reason: 'INSUFFICIENT_MATERIAL' as const };
    return { ok: true as const };
  },

  upgradeLevel(save: PlayerSave, towerID: TowerId, persist: PersistFn = next => SaveManager.save(next)): UpgradeResult {
    const validation = this.canUpgradeLevel(save, towerID);
    if (!validation.ok) return failure(validation.reason, validation.reason === 'MAX_LEVEL' ? '炮台已達最高等級。' : validation.reason === 'INSUFFICIENT_MATERIAL' ? '地源碎片不足。' : '無法進行等級強化。');
    const { index, progress } = getContext(save, towerID);
    const preview = makePreview(save, towerID, 'LEVEL');
    if (!progress || !preview) return failure('INVALID_UPGRADE_CONFIG', '升級資料無效。');
    const spent = InventoryService.spendAtomic(save, preview.costs);
    if (!spent.ok) return failure('INSUFFICIENT_MATERIAL', '素材不足，未消耗任何資源。');
    const ownedTowers = [...spent.save.ownedTowers];
    ownedTowers[index] = { ...progress, level: progress.level + 1 };
    const saved = persist({ ...spent.save, ownedTowers, firstGrowthUpgradeCompleted: true });
    if (!saved.ok) return failure('SAVE_FAILED', saved.error);
    return { ok: true, save: saved.save, preview };
  },

  upgradeStar(save: PlayerSave, towerID: TowerId, persist: PersistFn = next => SaveManager.save(next)): UpgradeResult {
    const validation = this.canUpgradeStar(save, towerID);
    if (!validation.ok) return failure(validation.reason, validation.reason === 'MAX_STAR' ? '炮台已達最高星級。' : validation.reason === 'INSUFFICIENT_MATERIAL' ? '升星素材不足。' : '無法進行星級突破。');
    const { index, progress } = getContext(save, towerID);
    const preview = makePreview(save, towerID, 'STAR');
    if (!progress || !preview) return failure('INVALID_UPGRADE_CONFIG', '升星資料無效。');
    const spent = InventoryService.spendAtomic(save, preview.costs);
    if (!spent.ok) return failure('INSUFFICIENT_MATERIAL', '素材不足，未消耗任何資源。');
    const ownedTowers = [...spent.save.ownedTowers];
    ownedTowers[index] = { ...progress, stars: progress.stars + 1 };
    const saved = persist({ ...spent.save, ownedTowers, firstGrowthUpgradeCompleted: true });
    if (!saved.ok) return failure('SAVE_FAILED', saved.error);
    return { ok: true, save: saved.save, preview };
  },
};
