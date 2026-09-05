import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { BattleEngine } from '../lib/game/battle-engine';
import { BUILD_PRESETS, BATTLE_BLESSINGS, GOLDEN_BLESSING_IDS, MapTopology } from '../lib/game/battle-depth';
import { EARTH_TUTORIAL_DUNGEON, getEarthDungeon, DungeonConfig } from '../lib/game/dungeon-data';
import { createNewSave } from '../lib/game/save-manager';
import { TOWER_CATALOG } from '../lib/game/towers';
import { getBattleBranches } from '../lib/game/battle-economy';
import { BattleBlessingManager } from '../lib/game/battle-blessing-manager';
import { RunRewardService } from '../lib/game/run-reward-service';
import { EarthProgressionService } from '../lib/game/earth-progression-service';
import { getBattleWaypoints } from '../lib/game/battle-readability';
import type { PlayerSave, TowerId } from '../lib/game/types';
import { tutorialTraining } from '../lib/game/tutorial-training';

function saveFor(towers:TowerId[]=BUILD_PRESETS[0].towers):PlayerSave {
  const save=createNewSave();
  return {...save,earthCareer:'EARTH_WALL_GUARDIAN',awakeningCompleted:true,starterTowerRewardClaimed:true,
    earthLoadout:towers,ownedTowers:Object.keys(TOWER_CATALOG).map(id=>({towerID:id as TowerId,level:1,stars:1,unlocked:true,obtainedAt:'TEST'}))};
}
const save=saveFor(), persist=(s:PlayerSave)=>({ok:true as const,save:s});
const gates:string[]=[];
function check(name:string,fn:()=>void) {fn();gates.push(name);console.log('PASS',name);}
check('Seven slots, three types, independent copies and exact sell refund',()=>{
  const e=new BattleEngine(save);e.debugAddGold(5000);
  for(let i=0;i<7;i++) assert(e.deploy(i,BUILD_PRESETS[0].towers[i%3]).ok);
  assert.equal(e.snapshot().deployed.length,7);
  assert(!e.deploy(7,BUILD_PRESETS[0].towers[0]).ok);
  assert(!e.deploy(0.5,BUILD_PRESETS[0].towers[0]).ok);
  const t=e.snapshot().deployed[0]; assert(e.upgradeTower(t.runtimeId).ok);
  const updated=e.snapshot().deployed[0],before=e.snapshot().battleGold;
  assert(e.sellTower(t.runtimeId).ok);assert.equal(e.snapshot().battleGold-before,Math.floor(updated.investedGold*.7));
  assert(!e.sellTower(t.runtimeId).ok);
  assert(e.deploy(0,BUILD_PRESETS[0].towers[0]).ok);
});
check('Upgrade branch validation and run reset',()=>{
  const e=new BattleEngine(save);e.debugAddGold(5000);assert(e.deploy(2,BUILD_PRESETS[0].towers[0]).ok);
  const t=e.snapshot().deployed[0];assert(e.upgradeTower(t.runtimeId).ok);
  const gold=e.snapshot().battleGold;assert(!e.upgradeTower(t.runtimeId,'invalid').ok);assert.equal(e.snapshot().battleGold,gold);
  assert(e.upgradeTower(t.runtimeId,getBattleBranches(t.towerId,3)[0].branchID).ok);
  assert(e.upgradeTower(t.runtimeId).ok);assert(e.upgradeTower(t.runtimeId,getBattleBranches(t.towerId,5)[1].branchID).ok);
  assert.equal(e.snapshot().deployed[0].battleLevel,5);assert(!e.upgradeTower(t.runtimeId).ok);
  const retry=new BattleEngine(save);retry.setRetryCount(1);
  assert.equal(retry.snapshot().battleGold,300);assert.equal(retry.snapshot().deployed.length,0);assert.equal(retry.snapshot().activeBlessings.length,0);
  assert.equal(retry.snapshot().metrics.retryCount,1);assert(!('battleGold' in save));
});
check('Blessing categories, fifteen-item benchmark pool and exhaustion',()=>{
  const offer=BattleBlessingManager.offer(42,BUILD_PRESETS[1].towers,BUILD_PRESETS[1].towers,[],[],{benchmark:true,career:save.earthCareer});
  assert.equal(offer.options.length,3);assert.equal(new Set(offer.options.map(b=>b.classification)).size,3);
  assert(offer.options.every(b=>GOLDEN_BLESSING_IDS.includes(b.blessingID)));
  const full=BATTLE_BLESSINGS.map(b=>({blessingID:b.blessingID,stacks:b.maxStacks}));
  assert.equal(BattleBlessingManager.offer(42,[],[],full).options.length,0);
  let active: {blessingID:string;stacks:number}[]=[];
  for(let i=0;i<3;i++){const r=BattleBlessingManager.select(active,'B_CHAIN_SPREAD');assert(r.ok);if(r.ok)active=r.active;}
  assert.equal(BattleBlessingManager.displayName(active[0]),'天雷領域');
  assert(!BattleBlessingManager.select(active,'B_CHAIN_SPREAD').ok);
});
check('Partial materials, no unlock, duplicate receipts and sweep restrictions',()=>{
  for(const [wave,expected] of [[4,0],[5,10],[10,17],[15,25],[20,35]]){
    const r=RunRewardService.partial(save,undefined,'partial-'+wave,wave,persist);assert(r.ok);
    if(r.ok){assert.equal(r.materials[0]?.amount??0,expected);assert(!r.save.earthTutorialCleared);
      const duplicate=RunRewardService.partial(r.save,undefined,'partial-'+wave,wave,persist);assert(duplicate.ok);if(duplicate.ok)assert.equal(duplicate.materials.length,0);}
  }
  assert(!RunRewardService.sweep(save,undefined,'bad',persist).ok);
  const cleared={...save,earthTutorialCleared:true};
  const r=RunRewardService.sweep(cleared,undefined,'sweep',persist);assert(r.ok);
  if(r.ok){assert.equal(r.materials[0].amount,50);assert.equal(r.save.earthRegion.highestUnlockedTier,null);}
  assert(!RunRewardService.sweep(cleared,'SOVEREIGN','bad2',persist).ok);
  const low={...save,earthTutorialCleared:true,earthRegion:{...save.earthRegion,tierProgress:{...save.earthRegion.tierProgress,NORMAL:{...save.earthRegion.tierProgress.NORMAL,unlocked:true}}}};
  assert(EarthProgressionService.canEnter(low,'NORMAL').ok);
});
check('Central objective and distinct reusable routes',()=>{
  for(const map of ['WINDING','MERGE','PARALLEL','CORE_SIEGE'] as MapTopology[]) assert.equal(getBattleWaypoints(map).length,5);
  assert.deepEqual(getBattleWaypoints('CORE_SIEGE').at(-1),{x:50,y:50});
  assert.notDeepEqual(getBattleWaypoints('CORE_SIEGE')[0],getBattleWaypoints('CORE_SIEGE',1)[0]);
});

check('All five playable training exercises can satisfy their objectives',()=>{
  for(let day=1;day<=5;day++) {
    const config=tutorialTraining(day), e=new BattleEngine(save,config,123);
    assert(e.deploy(2,config.trainingLoadout![0]).ok);e.start();let windowUsed=false;
    for(let tick=0;tick<4000;tick++) {
      const s=e.snapshot(),tower=s.deployed[0];
      if(['VICTORY','DEFEAT'].includes(s.state))break;
      if(day===3&&s.metrics.goldEarned>0&&s.metrics.upgradePurchases===0)e.upgradeTower(tower.runtimeId);
      const vulnerable=s.enemies.some(enemy=>enemy.statuses.includes('VULNERABLE'));
      if(day>=4&&(day===4||vulnerable)&&s.enemies.length) {
        const result=e.activateTowerSkill(tower.runtimeId);if(result.ok&&vulnerable)windowUsed=true;
      }
      e.tick(.1);
    }
    const s=e.snapshot();assert.equal(s.state,'VICTORY',`Day ${day} must be completable`);
    assert(s.totalKills>0);if(day===3)assert(s.metrics.upgradePurchases>0&&s.metrics.goldEarned>0);
    if(day>=4)assert(s.metrics.skillUses>0);if(day===5)assert(windowUsed);
    console.log('TRAINING',day,Math.round(s.metrics.runDuration));
  }
});

type Strategy='wide'|'tall'|'hybrid';
function simulate(presetIndex:number,strategy:Strategy,topology:MapTopology,seed:number,power=1) {
  const preset=BUILD_PRESETS[presetIndex], player=saveFor(preset.towers);
  // Scale enemy durability inversely: compares identical tactics at 80/100/120% attack power without mutating saves.
  const config:DungeonConfig={...EARTH_TUTORIAL_DUNGEON,trainingLoadout:preset.towers,topology,hpMultiplier:1/power};
  const engine=new BattleEngine(player,config,seed);
  const order=topology==='CORE_SIEGE'?[0,4,1,5,2,3,6]:topology==='PARALLEL'?[0,1,4,5,2,3,6]:[2,3,0,1,4,5,6];
  const choices: string[]=[];let lastDecision=-30,units=0;
  // Initial purchase is a player decision; choose an affordable member of the selected loadout.
  const initial=preset.towers.find(id=>(engine.snapshot().buildCosts[id]??Infinity)<=engine.snapshot().battleGold)!;
  assert(engine.deploy(order[units++],initial).ok);engine.start();
  for(let tick=0;tick<25000;tick++){
    let s=engine.snapshot();
    if(['VICTORY','DEFEAT'].includes(s.state)) break;
    if(s.state==='BLESSING_CHOICE'){
      const option=s.blessingOptions[(seed+choices.length)%s.blessingOptions.length];
      assert(option);engine.chooseBlessing(option.blessingID);choices.push(option.blessingID);
    }
    if(['WAVE_ACTIVE','INTERMISSION','READY'].includes(s.state)&&s.metrics.runDuration-lastDecision>=22){
      const targetCount=strategy==='wide'?Math.min(7,2+Math.floor(s.wave/4)):strategy==='tall'?Math.min(4,2+Math.floor(s.wave/8)):Math.min(5,2+Math.floor(s.wave/5));
      let purchased=false;
      if(s.deployed.length<targetCount){
        const desired=preset.towers[units%3];
        const type=(s.wave<=5&&s.battleGold<(s.buildCosts[desired]??Infinity)?preset.towers.find(id=>(s.buildCosts[id]??Infinity)<=s.battleGold):desired)??desired;
        if(s.battleGold>=(s.buildCosts[type]??Infinity)){purchased=engine.deploy(order[units],type).ok;if(purchased)units++;}
      }
      if(!purchased && (s.deployed.length>=targetCount || s.wave>8)){
        const cap=strategy==='wide'?2:strategy==='tall'?5:4;
        const sorted=[...s.deployed].sort((a,b)=>strategy==='tall'?b.battleLevel-a.battleLevel:a.battleLevel-b.battleLevel);
        const tower=sorted.find(t=>t.battleLevel<cap&&s.battleGold>=t.nextUpgradeCost);
        if(tower){const target=tower.battleLevel+1;const branch=target===3||target===5?getBattleBranches(tower.towerId,target)[seed%2].branchID:undefined;purchased=engine.upgradeTower(tower.runtimeId,branch).ok;}
      }
      if(purchased)lastDecision=s.metrics.runDuration;
    }
    s=engine.snapshot();
    const vulnerable=s.enemies.some(e=>e.boss&&e.statuses.includes('VULNERABLE'));
    if(s.state==='WAVE_ACTIVE') {
      for(const t of s.deployed) if(t.skillCooldown===0&&(vulnerable||s.enemies.length>=5)) engine.activateTowerSkill(t.runtimeId);
      if(s.overdriveReady&&(vulnerable||s.enemies.length>=8)&&s.deployed.length)engine.activateOverdrive([...s.deployed].sort((a,b)=>b.stats.attack-a.stats.attack)[0].runtimeId);
      if(s.enemies.some(e=>e.progress>.92))engine.activateCareerSkill();
    }
    engine.tick(.12);
  }
  const end=engine.snapshot();
  return {preset:preset.name,strategy,map:topology,seed,power,result:end.state,wave:end.wave,choices,hint:end.defeatHint,metrics:end.metrics};
}
const runs:ReturnType<typeof simulate>[]=[];
const maps:MapTopology[]=['WINDING','MERGE','PARALLEL','CORE_SIEGE'];
for(const strategy of ['wide','tall','hybrid'] as Strategy[]) for(let preset=0;preset<5;preset++) for(const map of maps){
  const run=simulate(preset,strategy,map,37+preset);runs.push(run);
  console.log('RUN',run.preset,strategy,map,run.result,run.wave,Math.round(run.metrics.runDuration));
}
for(const power of [.8,1.2])for(let preset=0;preset<4;preset++)runs.push(simulate(preset,'hybrid','MERGE',97+preset,power));
for(let seed=1;seed<=5;seed++)runs.push(simulate(0,'hybrid','MERGE',seed));
const mean=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
const winRate=(items:typeof runs)=>items.length?items.filter(r=>r.result==='VICTORY').length/items.length:0;
const checkpoints=[5,10,15,20,25].map(wave=>({wave,samples:runs.filter(r=>r.metrics.economyByWave[wave]).length,
  towerCount:mean(runs.flatMap(r=>r.metrics.economyByWave[wave]?[r.metrics.economyByWave[wave]!.towerCount]:[])),
  battleLevel:mean(runs.flatMap(r=>r.metrics.economyByWave[wave]?[r.metrics.economyByWave[wave]!.averageBattleLevel]:[]))}));
const report={generatedAt:new Date().toISOString(),method:'Deterministic engine simulations. Automated tactical pilot, not human playtest data. Purchases every 22 simulated seconds; manual skill policy uses groups or vulnerability windows.',gates,
  sampleCount:runs.length,averageRunDuration:mean(runs.map(r=>r.metrics.runDuration)),
  averageGoldPerWave:mean(runs.map(r=>r.metrics.goldEarned/Math.max(1,r.wave))),averageGoldSpent:mean(runs.map(r=>r.metrics.goldSpent)),
  checkpoints,winRates:Object.fromEntries(['wide','tall','hybrid'].map(s=>[s,winRate(runs.filter(r=>r.strategy===s&&r.power===1))])),
  powerWinRates:Object.fromEntries([.8,1,1.2].map(p=>[p,winRate(runs.filter(r=>r.power===p))])),
  builds:BUILD_PRESETS.map(p=>({name:p.name,winRate:winRate(runs.filter(r=>r.preset===p.name&&r.power===1))})),runs};
await mkdir('reports',{recursive:true});
await writeFile('reports/phase78-playtest.json',JSON.stringify(report,null,2));
console.log('REPORT',JSON.stringify({...report,runs:undefined},null,2));
