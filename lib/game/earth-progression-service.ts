import { getEarthTier, getNextEarthTier } from './earth-tiers';
import { InventoryService } from './inventory-service';
import { SaveManager } from './save-manager';
import { grantTower, TOWER_CATALOG } from './towers';
import { EarthTierId, GameState, MaterialReward, PlayerSave, RewardResult, TowerId } from './types';

type PersistResult={ok:true;save:PlayerSave}|{ok:false;error:string};
type PersistFn=(save:PlayerSave)=>PersistResult;
export interface EarthRewardResult extends RewardResult { towerGranted:TowerId|null; nextTierUnlocked:EarthTierId|null; earthCompleted:boolean; }
export type EarthCommitResult={ok:true;save:PlayerSave;reward:EarthRewardResult;duplicate:boolean}|{ok:false;error:string;message:string};

function totalEarthPower(save:PlayerSave) {
  return Math.round(save.ownedTowers.reduce((total,owned)=>{
    const data=TOWER_CATALOG[owned.towerID];
    return total+(data?.baseStats.attack ?? 0)*(1+(owned.level-1)*.05)*(1+(owned.stars-1)*.25);
  },0));
}

export const EarthProgressionService={
  canEnter(save:PlayerSave,tierID:EarthTierId) {
    if (!save.earthTutorialCleared) return {ok:false as const,error:'請先完成新手試煉。'};
    if (!save.earthRegion.tierProgress[tierID]?.unlocked) return {ok:false as const,error:'此階級尚未解鎖，必須依序通關。'};
    if (!save.earthLoadout.length) return {ok:false as const,error:'請先編成至少一座地球炮塔。'};
    const invalid=save.earthLoadout.some(id=>!save.ownedTowers.some(t=>t.towerID===id&&t.unlocked)||TOWER_CATALOG[id]?.realm!=='EARTH');
    if (invalid) return {ok:false as const,error:'編成包含未持有或非地球炮塔。'};
    return {ok:true as const};
  },
  setLoadout(save:PlayerSave,towerIDs:TowerId[],persist:PersistFn=next=>SaveManager.save(next)) {
    const unique=[...new Set(towerIDs)];
    if (unique.length<1||unique.length>3) return {ok:false as const,error:'編成必須包含 1 至 3 種炮塔。'};
    if (unique.some(id=>!save.ownedTowers.some(t=>t.towerID===id&&t.unlocked)||TOWER_CATALOG[id]?.realm!=='EARTH')) return {ok:false as const,error:'只能編入已持有的地球炮塔。'};
    return persist({...save,earthLoadout:unique});
  },
  recordBestWave(save:PlayerSave,tierID:EarthTierId,wave:number,persist:PersistFn=next=>SaveManager.save(next)) {
    const tierProgress={...save.earthRegion.tierProgress,[tierID]:{...save.earthRegion.tierProgress[tierID],bestWave:Math.max(save.earthRegion.tierProgress[tierID].bestWave,Math.min(25,Math.max(0,Math.floor(wave))))}};
    return persist({...save,earthRegion:{...save.earthRegion,tierProgress}});
  },
  commitVictory(save:PlayerSave,tierID:EarthTierId,battleSessionID:string,persist:PersistFn=next=>SaveManager.save(next)):EarthCommitResult {
    if (!battleSessionID) return {ok:false,error:'INVALID_SESSION',message:'戰鬥場次識別無效。'};
    const config=getEarthTier(tierID);
    if (!config||!save.earthRegion.tierProgress[tierID]?.unlocked) return {ok:false,error:'TIER_LOCKED',message:'此階級尚未合法解鎖。'};
    if (save.committedBattleRewardSessionIds.includes(battleSessionID)) return {ok:true,save,duplicate:true,reward:{dungeonID:`EARTH_${tierID}_DUNGEON`,battleSessionID,firstClear:false,materials:[],towerGranted:null,nextTierUnlocked:null,earthCompleted:save.earthRegion.earthCompleted}};
    const previous=save.earthRegion.tierProgress[tierID];
    const firstClear=!previous.firstClearRewardClaimed;
    const materials:MaterialReward[]=[{materialID:config.materialID,amount:config.standardReward}];
    if (firstClear) materials.push({materialID:config.materialID,amount:config.standardReward*2},{materialID:'EARTH_STAR_CORE',amount:1});
    const inventory=InventoryService.applyRewards(save,materials);
    if (!inventory.ok) return {ok:false,error:'INVENTORY_ERROR',message:`素材發放失敗：${inventory.error}`};
    const nextTier=getNextEarthTier(tierID);
    let nextSave=inventory.save;
    const towerGranted=firstClear ? config.towerReward : null;
    if (towerGranted) nextSave=grantTower(nextSave,towerGranted);
    const tierProgress={...nextSave.earthRegion.tierProgress};
    tierProgress[tierID]={...previous,unlocked:true,cleared:true,clearCount:previous.clearCount+1,bestWave:25,bossDefeated:true,firstClearRewardClaimed:true,tierTowerRewardClaimed:true};
    if (nextTier) tierProgress[nextTier]={...tierProgress[nextTier],unlocked:true};
    const earthCompleted=tierID==='SOVEREIGN' || nextSave.earthRegion.earthCompleted;
    nextSave={...nextSave,currentGameState:GameState.EarthProgress,earthProgress:Math.max(nextSave.earthProgress,config.order+2),
      committedBattleRewardSessionIds:[...nextSave.committedBattleRewardSessionIds,battleSessionID].slice(-100),
      earthRegion:{...nextSave.earthRegion,highestUnlockedTier:nextTier??tierID,highestClearedTier:tierID,tierProgress,earthCompleted,earthCompletionRewardClaimed:earthCompleted||nextSave.earthRegion.earthCompletionRewardClaimed,completionBadge:earthCompleted?'EARTH SOVEREIGN':nextSave.earthRegion.completionBadge,totalEarthPower:0}};
    nextSave={...nextSave,earthRegion:{...nextSave.earthRegion,totalEarthPower:totalEarthPower(nextSave)}};
    const saved=persist(nextSave);
    if (!saved.ok) return {ok:false,error:'SAVE_FAILED',message:saved.error};
    return {ok:true,save:saved.save,duplicate:false,reward:{dungeonID:`EARTH_${tierID}_DUNGEON`,battleSessionID,firstClear,materials,towerGranted,nextTierUnlocked:firstClear?nextTier:null,earthCompleted}};
  },
};
