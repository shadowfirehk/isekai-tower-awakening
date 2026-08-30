import { MATERIAL_DATABASE } from './materials';
import { MaterialId, MaterialReward, PlayerSave } from './types';

export type InventoryResult = { ok: true; save: PlayerSave } | { ok: false; error: 'INVALID_MATERIAL' | 'INVALID_AMOUNT' | 'INSUFFICIENT_MATERIAL' | 'MATERIAL_OVERFLOW' };

function safeAmount(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

export const InventoryService = {
  getAmount(save: PlayerSave, materialID: MaterialId) {
    return Math.max(0, Math.floor(save.materialsById[materialID] ?? 0));
  },

  hasMaterial(save: PlayerSave, materialID: MaterialId, amount: number) {
    return safeAmount(amount) && this.getAmount(save, materialID) >= amount;
  },

  addMaterial(save: PlayerSave, materialID: MaterialId, amount: number): InventoryResult {
    const material = MATERIAL_DATABASE[materialID];
    if (!material) return { ok: false, error: 'INVALID_MATERIAL' };
    if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, error: 'INVALID_AMOUNT' };
    const nextAmount = this.getAmount(save, materialID) + amount;
    if (!Number.isSafeInteger(nextAmount) || nextAmount > material.maxStack) return { ok: false, error: 'MATERIAL_OVERFLOW' };
    return {
      ok: true,
      save: {
        ...save,
        materials: materialID === 'EARTH_BASIC_MATERIAL' ? nextAmount : save.materials,
        materialsById: { ...save.materialsById, [materialID]: nextAmount },
      },
    };
  },

  removeMaterial(save: PlayerSave, materialID: MaterialId, amount: number): InventoryResult {
    if (!MATERIAL_DATABASE[materialID]) return { ok: false, error: 'INVALID_MATERIAL' };
    if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, error: 'INVALID_AMOUNT' };
    const current = this.getAmount(save, materialID);
    if (current < amount) return { ok: false, error: 'INSUFFICIENT_MATERIAL' };
    const nextAmount = current - amount;
    return {
      ok: true,
      save: {
        ...save,
        materials: materialID === 'EARTH_BASIC_MATERIAL' ? nextAmount : save.materials,
        materialsById: { ...save.materialsById, [materialID]: nextAmount },
      },
    };
  },

  applyRewards(save: PlayerSave, rewards: MaterialReward[]): InventoryResult {
    let next = save;
    for (const reward of rewards) {
      const result = this.addMaterial(next, reward.materialID, reward.amount);
      if (!result.ok) return result;
      next = result.save;
    }
    return { ok: true, save: next };
  },

  spendAtomic(save: PlayerSave, costs: MaterialReward[]): InventoryResult {
    if (costs.some(cost => !this.hasMaterial(save, cost.materialID, cost.amount))) return { ok: false, error: 'INSUFFICIENT_MATERIAL' };
    let next = save;
    for (const cost of costs) {
      const result = this.removeMaterial(next, cost.materialID, cost.amount);
      if (!result.ok) return result;
      next = result.save;
    }
    return { ok: true, save: next };
  },
};
