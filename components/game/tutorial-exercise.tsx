'use client';
import { useEffect, useRef, useState } from 'react';
import { BattleEngine } from '@/lib/game/battle-engine';
import { tutorialTraining } from '@/lib/game/tutorial-training';
import { SLOT_LAYOUTS } from '@/lib/game/battle-geometry';
import { TowerArtwork, EnemyArtwork } from './visual-ui';
import type { PlayerSave, TowerId } from '@/lib/game/types';

export function TutorialExercise({day,save,onComplete}:{day:number;save:PlayerSave;onComplete:()=>void}) {
  const towerID:TowerId=day===2?'EARTH_RAPID_FIRE_TURRET':'EARTH_BASIC_AUTO_TURRET';
  const config=tutorialTraining(day);
  const [engine,setEngine]=useState(()=>new BattleEngine(save,config));
  const [snapshot,setSnapshot]=useState(()=>engine.snapshot());
  const [identified,setIdentified]=useState(false),[windowUsed,setWindowUsed]=useState(false);
  const [message,setMessage]=useState('點擊部署槽建造一座炮台。');
  const completed=useRef(false);
  useEffect(()=>{
    let frame=0,previous=performance.now();
    const tick=(now:number)=>{engine.tick((now-previous)/1000);previous=now;setSnapshot(engine.snapshot());frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[engine]);
  const tower=snapshot.deployed[0];
  const objective=day===1?snapshot.totalKills>0:day===2?identified:day===3?snapshot.metrics.upgradePurchases>0&&snapshot.metrics.goldEarned>0:day===4?snapshot.metrics.skillUses>0:windowUsed;
  const ready=objective&&snapshot.state==='VICTORY';
  const act=(fn:()=>{ok:boolean;error?:string})=>{const result=fn();setMessage(result.ok?'操作成功':result.error??'請稍後重試');setSnapshot(engine.snapshot());};
  const retry=()=>{const next=new BattleEngine(save,config);setEngine(next);setSnapshot(next.snapshot());setIdentified(false);setWindowUsed(false);setMessage('重新開始模擬');};
  return <section className="tutorial-exercise" aria-label={`第 ${day} 日互動訓練`}>
    <header><b>實戰演練 DAY {day}</b><span>金幣 {snapshot.battleGold} · 基地 {snapshot.baseHP}/{snapshot.maxBaseHP}</span></header>
    <p>{day===1?'部署 → 開始模擬 → 擊破敵人':day===2?'觀察疾行獵獸的移動，辨識它的角色':day===3?'擊破敵人取得金幣，在模擬結束前升級炮台':day===4?'戰鬥中啟動炮台主動技能': '等到「核心暴露」再釋放主動技能，擊破模擬頭目'}</p>
    <div className="exercise-map">
      <div className="exercise-lane" />
      {SLOT_LAYOUTS.MERGE.map((p,slot)=><button key={slot} className="exercise-slot" style={{left:`${p.x}%`,top:`${p.y}%`}} aria-label={`訓練部署槽 ${slot+1}`} disabled={!!tower||snapshot.state==='VICTORY'} onClick={()=>act(()=>engine.deploy(slot,towerID))}>{tower?.slot===slot?<TowerArtwork towerID={towerID} battleLevel={tower.battleLevel}/>: '+'}</button>)}
      {snapshot.enemies.map(enemy=><div className={`exercise-enemy ${enemy.statuses.includes('VULNERABLE')?'vulnerable':''}`} key={enemy.runtimeId} style={{left:`${enemy.pathX}%`,top:`${enemy.pathY}%`}}><EnemyArtwork enemyID={enemy.enemyId}/><small>{enemy.boss?enemy.statuses.includes('VULNERABLE')?'核心暴露':'裝甲閉合':'疾行 / 一般'}</small><progress max={enemy.maxHP} value={enemy.hp}/></div>)}
    </div>
    {day===2 && !identified && <div className="exercise-actions"><button onClick={()=>setMessage('再看看它的移動速度與薄甲輪廓。')}>重甲敵人</button><button onClick={()=>{setIdentified(true);setMessage('辨識正確：高速低血量，覆蓋短路線很重要。');}}>疾行敵人</button></div>}
    <p role="status">{snapshot.bossTelegraph || message}</p>
    <div className="exercise-actions">
      {['SETUP','READY'].includes(snapshot.state) && <button disabled={!tower} onClick={()=>act(()=>engine.start())}>開始模擬</button>}
      {day===3 && <button disabled={!tower||snapshot.metrics.goldEarned===0||snapshot.metrics.upgradePurchases>0} onClick={()=>tower&&act(()=>engine.upgradeTower(tower.runtimeId))}>花費金幣升級</button>}
      {day>=4 && <button disabled={!tower||snapshot.state!=='WAVE_ACTIVE'||tower.skillCooldown>0} onClick={()=>{if(!tower)return;const window=snapshot.enemies.some(e=>e.boss&&e.statuses.includes('VULNERABLE'));const result=engine.activateTowerSkill(tower.runtimeId);if(result.ok&&window)setWindowUsed(true);setMessage(result.ok?'技能已啟動':result.error??'稍後重試');}}>主動技能 {tower&&tower.skillCooldown>0?`${Math.ceil(tower.skillCooldown)}秒`:''}</button>}
      {['VICTORY','DEFEAT'].includes(snapshot.state)&&!ready&&<button onClick={retry}>重試演練</button>}
      <button disabled={!ready||completed.current} onClick={()=>{if(ready&&!completed.current){completed.current=true;onComplete();}}}>{ready?'完成本日訓練':'完成操作目標與模擬後繼續'}</button>
    </div>
  </section>;
}
