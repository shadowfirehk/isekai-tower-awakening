import { getEarthTier } from './earth-tiers';
import { InventoryService } from './inventory-service';
import { PROGRESSION_CONFIG } from './progression-config';
import { SaveManager } from './save-manager';
import type { EarthTierId, MaterialReward, PlayerSave } from './types';

type Persist = (save:PlayerSave)=>{ok:true;save:PlayerSave}|{ok:false;error:string};
export function partialRewardRatio(clearedWaves:number) {
  return clearedWaves >= 20 ? 0.7 : clearedWaves >= 15 ? 0.5 : clearedWaves >= 10 ? 0.35 : clearedWaves >= 5 ? 0.2 : 0;
}
export function repeatMaterials(tier?:EarthTierId):MaterialReward[] {
  if(!tier) return PROGRESSION_CONFIG.tutorialRewards.standard.map(r=>({...r}));
  const data=getEarthTier(tier);
  return [{materialID:data.materialID,amount:data.standardReward}];
}
function grant(save:PlayerSave,session:string,materials:MaterialReward[],persist:Persist) {
  if(!session) return {ok:false as const,error:'場次識別無效'};
  if(save.committedBattleRewardSessionIds.includes(session)) return {ok:true as const,save,materials:[],duplicate:true};
  const result=InventoryService.applyRewards(save,materials);
  if(!result.ok) return {ok:false as const,error:'素材發放失敗'};
  const saved=persist({...result.save,committedBattleRewardSessionIds:[...save.committedBattleRewardSessionIds,session].slice(-100)});
  if(!saved.ok) return saved;
  return {ok:true as const,save:saved.save,materials,duplicate:false};
}
export const RunRewardService = {
  partial(save:PlayerSave,tier:EarthTierId|undefined,session:string,clearedWaves:number,persist:Persist=SaveManager.save) {
    if(tier && !save.earthRegion.tierProgress[tier]?.unlocked) return {ok:false as const,error:'階級尚未解鎖'};
    const ratio=partialRewardRatio(clearedWaves);
    const materials=repeatMaterials(tier).map(r=>({...r,amount:Math.floor(r.amount*ratio)})).filter(r=>r.amount>0);
    const next = tier ? {...save,earthRegion:{...save.earthRegion,tierProgress:{...save.earthRegion.tierProgress,[tier]:{...save.earthRegion.tierProgress[tier],bestWave:Math.max(save.earthRegion.tierProgress[tier].bestWave,clearedWaves)}}}} : save;
    return grant(next,session,materials,persist);
  },
  canSweep(save:PlayerSave,tier?:EarthTierId) {
    if(!tier) return save.earthTutorialCleared;
    const data=getEarthTier(tier),progress=save.earthRegion.tierProgress[tier];
    return progress.cleared && progress.firstClearRewardClaimed && data.order<=4;
  },
  sweep(save:PlayerSave,tier:EarthTierId|undefined,session:string,persist:Persist=SaveManager.save) {
    if(!this.canSweep(save,tier)) return {ok:false as const,error:'掃蕩只開放已手動通關的新手與普通至傳說階；高階挑戰需實戰。'};
    return grant(save,session,repeatMaterials(tier),persist);
  },
};
