import { calculateTowerStats } from './tower-stats';
import { getOwnedTower, getTowerById, STARTER_TOWER_ID } from './towers';
import { DamageSnapshot, makeDamageSnapshot, resolveDamage, selectTarget } from './combat';
import { DungeonConfig, EARTH_TUTORIAL_DUNGEON, ENEMY_CATALOG } from './dungeon-data';
import { BattleState, EnemyId, FinalTowerStats, PlayerSave, TargetingMode, TowerId } from './types';

export interface EnemyRuntime { runtimeId:number; enemyId:EnemyId; name:string; hp:number; maxHP:number; shieldHP:number; maxShieldHP:number; defense:number; speed:number; baseDamage:number; progress:number; boss:boolean; elite:boolean; regenerationPercent:number; supportAura:number; phase:number; state:'ALIVE'|'DYING'|'DEAD'; }
export interface TowerRuntime { runtimeId:number;towerId:TowerId;slot:number;progress:number;stats:FinalTowerStats;cooldown:number;targetId:number|null;targetingMode:TargetingMode;shots:number; }
export interface ProjectileRuntime { runtimeId:number;fromSlot:number;targetId:number;remaining:number;snapshot:DamageSnapshot;attackPattern:'SINGLE'|'AOE'|'CHAIN';maxTargets:number;bossDamageMultiplier:number; }
interface SpawnEntry{enemyId:EnemyId;delay:number}
export interface BattleSnapshot { state:BattleState;wave:number;baseHP:number;maxBaseHP:number;paused:boolean;speed:1|2;deployed:TowerRuntime[];enemies:EnemyRuntime[];projectiles:ProjectileRuntime[];totalKills:number;totalDamage:number;notice:string;dungeon:DungeonConfig; }
const SLOT_PROGRESS=[.18,.31,.43,.58,.7,.82];

export class TowerFactory {
  static create(save:PlayerSave,towerId:TowerId,slot:number,runtimeId:number):TowerRuntime|null {
    const data=getTowerById(towerId),progress=getOwnedTower(save,towerId);
    if(!data||!progress||slot<0||slot>=SLOT_PROGRESS.length)return null;
    return {runtimeId,towerId,slot,progress:SLOT_PROGRESS[slot],stats:calculateTowerStats(data,progress,save),cooldown:0,targetId:null,targetingMode:'FIRST',shots:0};
  }
}

export class BattleEngine {
  private save:PlayerSave; private dungeon:DungeonConfig; private state:BattleState='SETUP'; private wave=0; private baseHP:number;
  private paused=false; private speed:1|2=1; private deployed:TowerRuntime[]=[]; private enemies:EnemyRuntime[]=[]; private projectiles:ProjectileRuntime[]=[];
  private spawnQueue:SpawnEntry[]=[];private spawnTimer=0;private stateTimer=0;private id=1;private totalKills=0;private totalDamage=0;private notice='選擇部署位置，建立第一道防線。';
  constructor(save:PlayerSave,dungeon:DungeonConfig=EARTH_TUTORIAL_DUNGEON){this.save=save;this.dungeon=dungeon;this.baseHP=dungeon.startingBaseHP;}
  snapshot():BattleSnapshot{return{state:this.state,wave:this.wave,baseHP:this.baseHP,maxBaseHP:this.dungeon.startingBaseHP,paused:this.paused,speed:this.speed,deployed:this.deployed.map(t=>({...t,stats:{...t.stats}})),enemies:this.enemies.map(e=>({...e})),projectiles:this.projectiles.map(p=>({...p,snapshot:{...p.snapshot}})),totalKills:this.totalKills,totalDamage:this.totalDamage,notice:this.notice,dungeon:this.dungeon};}
  deploy(slot:number,towerId:TowerId=STARTER_TOWER_ID){
    if(!['SETUP','READY','INTERMISSION','WAVE_ACTIVE'].includes(this.state))return{ok:false,error:'目前狀態無法部署炮塔。'};
    if(this.deployed.some(t=>t.slot===slot))return{ok:false,error:'此部署槽已被佔用。'};
    if(this.deployed.length>=this.dungeon.deploymentCap)return{ok:false,error:`部署上限為 ${this.dungeon.deploymentCap} 座。`};
    const allowed=this.dungeon.tierID?this.save.earthLoadout:[STARTER_TOWER_ID];
    if(!allowed.includes(towerId))return{ok:false,error:'此炮塔未列入本次編成。'};
    const tower=TowerFactory.create(this.save,towerId,slot,this.id++);if(!tower)return{ok:false,error:'尚未擁有此炮塔，或部署槽無效。'};
    this.deployed.push(tower);this.state=this.state==='SETUP'?'READY':this.state;this.notice=`已部署 ${getTowerById(towerId)?.name??towerId}。`;return{ok:true as const};
  }
  setTargeting(runtimeId:number,mode:TargetingMode){const tower=this.deployed.find(t=>t.runtimeId===runtimeId);if(!tower||!['FIRST','NEAREST','STRONGEST','WEAKEST'].includes(mode))return false;tower.targetingMode=mode;return true;}
  start(){if(!this.deployed.length)return{ok:false,error:'至少部署一座炮塔才能開始。'};if(!['READY','SETUP'].includes(this.state))return{ok:false,error:'戰鬥已經開始。'};this.startNextWave();return{ok:true as const};}
  togglePause(){this.paused=!this.paused;} toggleSpeed(){this.speed=this.speed===1?2:1;}
  tick(rawDelta:number){if(this.paused||['VICTORY','DEFEAT','RESULT','EXITING'].includes(this.state))return;const delta=Math.min(.12,Math.max(0,rawDelta))*this.speed;
    if(['BOSS_WARNING','WAVE_STARTING','WAVE_CLEAR','INTERMISSION'].includes(this.state)){this.stateTimer-=delta;if(this.stateTimer<=0)this.advanceTimedState();return;}
    if(this.state!=='WAVE_ACTIVE')return;this.updateSpawning(delta);this.updateEnemies(delta);this.updateTowers(delta);this.updateProjectiles(delta);this.finalizeDeaths();
    if(this.baseHP<=0){this.baseHP=0;this.state='DEFEAT';this.notice='基地核心失守。';return;}
    if(!this.spawnQueue.length&&!this.enemies.some(e=>e.state==='ALIVE')&&!this.projectiles.length){this.state='WAVE_CLEAR';this.stateTimer=.55;this.notice=`WAVE ${String(this.wave).padStart(2,'0')} CLEAR`;}}
  private startNextWave(){this.wave=Math.min(this.dungeon.totalWaves,this.wave+1);const waveData=this.dungeon.waves[this.wave-1];this.spawnQueue=waveData.groups.flatMap(group=>Array.from({length:group.count},()=>({enemyId:group.enemyId,delay:group.interval})));this.spawnTimer=.12;this.state=waveData.boss?'BOSS_WARNING':'WAVE_STARTING';this.stateTimer=waveData.boss?.85:.35;this.notice=waveData.boss?`WARNING · ${this.dungeon.bossName}`:`WAVE ${String(this.wave).padStart(2,'0')} INCOMING`;}
  private advanceTimedState(){if(this.state==='BOSS_WARNING'){this.state='WAVE_STARTING';this.stateTimer=.3;}else if(this.state==='WAVE_STARTING')this.state='WAVE_ACTIVE';else if(this.state==='WAVE_CLEAR'){if(this.wave>=this.dungeon.totalWaves){this.state='VICTORY';this.notice=`${this.dungeon.name} · 25 波全數清除`;}else{this.state='INTERMISSION';this.stateTimer=.7;}}else if(this.state==='INTERMISSION')this.startNextWave();}
  private updateSpawning(delta:number){if(!this.spawnQueue.length)return;this.spawnTimer-=delta;if(this.spawnTimer>0)return;const entry=this.spawnQueue.shift();if(!entry)return;this.spawnEnemy(entry.enemyId);this.spawnTimer=Math.max(.1,entry.delay);}
  private spawnEnemy(enemyId:EnemyId){const data=ENEMY_CATALOG[enemyId],waveScale=1+(this.wave-1)*.08,bossScale=data.boss?this.dungeon.waves[this.wave-1].bossMultiplier:1,elite=data.elite||data.boss&&this.dungeon.tierOrder>=2;
    const maxHP=data.maxHP*this.dungeon.hpMultiplier*waveScale*bossScale*(elite?1.5:1);const shieldPercent=data.shieldPercent??(data.boss&&this.dungeon.tierOrder>=3?Math.min(.7,.15+this.dungeon.tierOrder*.04):0);const shieldHP=maxHP*shieldPercent;
    this.enemies.push({runtimeId:this.id++,enemyId,name:data.boss?this.dungeon.bossName:data.name,hp:maxHP,maxHP,shieldHP,maxShieldHP:shieldHP,defense:data.defense*this.dungeon.defenseMultiplier*(elite?1.2:1),speed:data.speed*this.dungeon.speedMultiplier,baseDamage:Math.max(1,Math.round(data.baseDamage*(1+(this.wave-1)*.03))),progress:0,boss:data.boss,elite,regenerationPercent:data.regenerationPercent??(data.boss&&this.dungeon.tierOrder>=4?.008:0),supportAura:data.supportAura??0,phase:1,state:'ALIVE'});}
  private updateEnemies(delta:number){for(const enemy of this.enemies){if(enemy.state!=='ALIVE')continue;if(enemy.regenerationPercent>0&&enemy.hp>0)enemy.hp=Math.min(enemy.maxHP,enemy.hp+enemy.maxHP*enemy.regenerationPercent*delta);if(enemy.boss&&this.dungeon.tierOrder>=5&&enemy.phase===1&&enemy.hp<=enemy.maxHP*.5){enemy.phase=2;enemy.speed*=1.1;enemy.shieldHP=Math.min(enemy.maxShieldHP,enemy.shieldHP+enemy.maxHP*.1);}
      enemy.progress+=enemy.speed*delta;if(enemy.progress>=1){enemy.progress=1;enemy.state='DYING';this.baseHP-=enemy.boss?5:Math.max(1,enemy.baseDamage);}}}
  private updateTowers(delta:number){for(const tower of this.deployed){tower.cooldown-=delta;const current=this.enemies.find(e=>e.runtimeId===tower.targetId&&e.state==='ALIVE')??null;const inRange=current&&Math.abs(current.progress-tower.progress)<=tower.stats.range/20;const target=inRange?current:selectTarget(this.enemies,tower.progress,tower.stats.range,tower.targetingMode);tower.targetId=target?.runtimeId??null;if(!target||tower.cooldown>0)continue;tower.cooldown=1/Math.max(.1,tower.stats.attackSpeed);tower.shots++;const data=getTowerById(tower.towerId)!;this.projectiles.push({runtimeId:this.id++,fromSlot:tower.slot,targetId:target.runtimeId,remaining:.14,snapshot:makeDamageSnapshot(tower.stats),attackPattern:data.attackPattern,maxTargets:data.maxTargets,bossDamageMultiplier:data.bossDamageMultiplier});}}
  private hit(target:EnemyRuntime,projectile:ProjectileRuntime,multiplier=1){const support=this.enemies.some(e=>e.state==='ALIVE'&&e.supportAura>0&&Math.abs(e.progress-target.progress)<.14);const result=resolveDamage(projectile.snapshot,target.defense*(support?1.2:1));let damage=result.damage*multiplier*(target.boss?projectile.bossDamageMultiplier:1);if(target.shieldHP>0){const shieldDamage=Math.min(target.shieldHP,damage);target.shieldHP-=shieldDamage;damage-=shieldDamage;this.totalDamage+=shieldDamage;}if(damage>0){target.hp=Math.max(0,target.hp-damage);this.totalDamage+=damage;}if(target.hp<=0&&target.state==='ALIVE')target.state='DYING';}
  private updateProjectiles(delta:number){for(const projectile of this.projectiles){projectile.remaining-=delta;if(projectile.remaining>0)continue;const target=this.enemies.find(e=>e.runtimeId===projectile.targetId&&e.state==='ALIVE');if(!target)continue;this.hit(target,projectile);if(projectile.maxTargets>1){const extras=this.enemies.filter(e=>e.state==='ALIVE'&&e.runtimeId!==target.runtimeId&&(projectile.attackPattern==='AOE'?Math.abs(e.progress-target.progress)<.12:true)).sort((a,b)=>Math.abs(a.progress-target.progress)-Math.abs(b.progress-target.progress)).slice(0,projectile.maxTargets-1);extras.forEach((enemy,index)=>this.hit(enemy,projectile,projectile.attackPattern==='CHAIN'?Math.max(.45,.78-index*.1):.65));}}this.projectiles=this.projectiles.filter(p=>p.remaining>0);}
  private finalizeDeaths(){for(const enemy of this.enemies){if(enemy.state!=='DYING')continue;if(enemy.hp<=0)this.totalKills++;enemy.state='DEAD';for(const tower of this.deployed)if(tower.targetId===enemy.runtimeId)tower.targetId=null;}this.enemies=this.enemies.filter(e=>e.state!=='DEAD');}
  debugJump(wave:number){this.enemies=[];this.projectiles=[];this.spawnQueue=[];this.wave=Math.min(25,Math.max(1,Math.floor(wave)))-1;this.startNextWave();}
  debugKillAll(){this.spawnQueue=[];for(const enemy of this.enemies){enemy.hp=0;enemy.shieldHP=0;enemy.state='DYING';}this.finalizeDeaths();}
  debugSetBaseHP(value:number){this.baseHP=Math.max(0,Math.min(99,Math.floor(value)));} debugForceVictory(){this.wave=25;this.enemies=[];this.projectiles=[];this.spawnQueue=[];this.state='VICTORY';this.notice='DEBUG · VICTORY';} debugForceDefeat(){this.baseHP=0;this.state='DEFEAT';this.notice='DEBUG · DEFEAT';}
}
