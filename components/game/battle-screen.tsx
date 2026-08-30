'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Crosshair, Eye, FastForward, HeartPulse, Pause, Play, RotateCcw, Shield, Sparkles, Swords, TowerControl } from 'lucide-react';
import { BossArtwork, EnemyArtwork, RoleBadge, TierBadge, TowerArtwork } from '@/components/game/visual-ui';
import { BattleEngine, BattleSnapshot } from '@/lib/game/battle-engine';
import { EARTH_TUTORIAL_DUNGEON, getEarthDungeon } from '@/lib/game/dungeon-data';
import { EarthProgressionService } from '@/lib/game/earth-progression-service';
import { getMaterialData } from '@/lib/game/materials';
import { RewardService } from '@/lib/game/reward-service';
import { getTowerById, STARTER_TOWER_ID } from '@/lib/game/towers';
import { ENEMY_VISUAL_PROFILES } from '@/lib/game/visual-config';
import { EarthTierId, MaterialReward, PlayerSave, TargetingMode, TowerId } from '@/lib/game/types';

interface BattleScreenProps {
  save: PlayerSave;
  debugMode: boolean;
  onBack: () => void;
  onCommitted: (save: PlayerSave, message?: string) => void;
  tierID?: EarthTierId;
}

function pathPoint(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= .25) return { x: 5 + p / .25 * 30, y: 70 };
  if (p <= .5) return { x: 35, y: 70 - (p - .25) / .25 * 40 };
  if (p <= .75) return { x: 35 + (p - .5) / .25 * 35, y: 30 };
  return { x: 70 + (p - .75) / .25 * 23, y: 30 + (p - .75) / .25 * 35 };
}

const SLOT_POINTS = [{ x: 18, y: 59 }, { x: 30, y: 82 }, { x: 43, y: 48 }, { x: 58, y: 43 }, { x: 72, y: 48 }, { x: 84, y: 57 }];

function createBattleSessionID(tierID?:EarthTierId) {
  return `earth-${tierID?.toLowerCase()??'tutorial'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BattleScreen({ save, debugMode, onBack, onCommitted, tierID }: BattleScreenProps) {
  const dungeon=tierID?getEarthDungeon(tierID):EARTH_TUTORIAL_DUNGEON;
  const loadout=tierID?save.earthLoadout:[STARTER_TOWER_ID];
  const [deployTowerID,setDeployTowerID]=useState<TowerId>(loadout[0]??STARTER_TOWER_ID);
  const [initialEngine] = useState(() => new BattleEngine(save,dungeon));
  const engineRef = useRef(initialEngine);
  const [snapshot, setSnapshot] = useState<BattleSnapshot>(() => initialEngine.snapshot());
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [battleSessionID, setBattleSessionID] = useState(()=>createBattleSessionID(tierID));
  const [rewardMaterials, setRewardMaterials] = useState<MaterialReward[]>([]);
  const [firstClearReward, setFirstClearReward] = useState(false);
  const [unlockedTowerID,setUnlockedTowerID]=useState<TowerId|null>(null);
  const [selectedEnemyID,setSelectedEnemyID]=useState<number|null>(null);
  const [rewardError, setRewardError] = useState('');
  const resultCommitted = useRef(false);

  const sync = useCallback(() => setSnapshot(engineRef.current.snapshot()), []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const run = (now: number) => {
      const delta = (now - previous) / 1000;
      previous = now;
      engineRef.current.tick(delta);
      setSnapshot(engineRef.current.snapshot());
      frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (snapshot.state !== 'VICTORY' || resultCommitted.current) return;
    resultCommitted.current = true;
    const commit = window.setTimeout(() => {
      const result = tierID ? EarthProgressionService.commitVictory(save,tierID,battleSessionID) : RewardService.commitTutorialVictory(save, battleSessionID);
      if (!result.ok) {
        setRewardError(result.message);
        return;
      }
      setRewardMaterials(result.reward.materials);
      setFirstClearReward(result.reward.firstClear);
      if ('towerGranted' in result.reward) setUnlockedTowerID((result.reward.towerGranted as TowerId | null) ?? null);
      onCommitted(result.save, result.reward.firstClear ? `${tierID??'新手'}首通獎勵與解鎖已永久保存` : '重複通關素材已永久保存');
    }, 0);
    return () => window.clearTimeout(commit);
  }, [snapshot.state, save, battleSessionID, onCommitted, tierID]);

  const deploy = (slot: number) => {
    const result = engineRef.current.deploy(slot,deployTowerID);
    sync();
    if (result.ok) setSelectedTower(engineRef.current.snapshot().deployed.find(tower => tower.slot === slot)?.runtimeId ?? null);
  };

  const restart = () => {
    engineRef.current = new BattleEngine(save,dungeon);
    resultCommitted.current = false;
    setBattleSessionID(createBattleSessionID(tierID));
    setRewardMaterials([]);
    setFirstClearReward(false);
    setUnlockedTowerID(null);
    setSelectedEnemyID(null);
    setRewardError('');
    setSelectedTower(null);
    sync();
  };

  const selected = snapshot.deployed.find(tower => tower.runtimeId === selectedTower) ?? null;
  const selectedEnemy=snapshot.enemies.find(enemy=>enemy.runtimeId===selectedEnemyID)??null;
  const activeBoss=snapshot.enemies.find(enemy=>enemy.boss)??null;
  const terminal = snapshot.state === 'VICTORY' || snapshot.state === 'DEFEAT';
  return (
    <section className="battle-screen phase-screen" aria-label={`25 波${dungeon.name}`}>
      <header className="battle-hud">
        <button className="hud-back" onClick={onBack}><ArrowLeft /> 離開</button>
        <div className="wave-readout"><small>WAVE</small><b>{String(snapshot.wave).padStart(2, '0')}</b><span>/ 25</span></div>
        <div className="battle-title"><p>{dungeon.id}</p><h1>{dungeon.name}</h1><span>{snapshot.notice}</span></div>
        <div className="base-health"><HeartPulse /><span><small>BASE CORE</small><b>{snapshot.baseHP} / {snapshot.maxBaseHP}</b></span><i><em style={{ width: `${snapshot.baseHP / snapshot.maxBaseHP * 100}%` }} /></i></div>
        <button onClick={() => { engineRef.current.togglePause(); sync(); }} aria-label="暫停或繼續">{snapshot.paused ? <Play /> : <Pause />}</button>
        <button onClick={() => { engineRef.current.toggleSpeed(); sync(); }}><FastForward /> {snapshot.speed}×</button>
      </header>

      <div className="battlefield">
        <div className="map-grid" aria-hidden="true" />
        <div className="battle-path" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="spawn-gate"><span>SPAWN</span></div><div className="core-gate"><Shield /><span>CORE</span></div>
        {activeBoss&&<section className={`boss-hud ${tierID==='SOVEREIGN'?'sovereign':''}`}><BossArtwork tier={tierID??'NORMAL'}/><div><header><span>{tierID??'TUTORIAL'} BOSS</span><b>{activeBoss.name}</b><em>PHASE {activeBoss.phase}</em></header><i><em style={{width:`${activeBoss.hp/activeBoss.maxHP*100}%`}}/></i><footer><RoleBadge kind="BOSS"/>{activeBoss.shieldHP>0&&<RoleBadge kind="SHIELDED"/>}{activeBoss.regenerationPercent>0&&<RoleBadge kind="REGENERATING"/>}{activeBoss.elite&&<RoleBadge kind="ELITE"/>}</footer></div></section>}
        {SLOT_POINTS.map((point, slot) => {
          const tower = snapshot.deployed.find(item => item.slot === slot);
          return <button key={slot} className={`deploy-slot ${tower ? 'occupied' : ''} ${tower?.runtimeId === selectedTower ? 'selected' : ''}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => tower ? setSelectedTower(tower.runtimeId) : deploy(slot)}>
            {tower ? <><span className="turret-head"><i /></span><small>SLOT {slot + 1}</small></> : <><b>+</b><small>DEPLOY</small></>}
          </button>;
        })}
        {snapshot.enemies.map(enemy => { const point = pathPoint(enemy.progress),profile=ENEMY_VISUAL_PROFILES[enemy.enemyId],shieldState=enemy.maxShieldHP<=0?'':enemy.shieldHP/enemy.maxShieldHP>.5?'shield-full':enemy.shieldHP>0?'shield-damaged':'shield-broken'; return <button key={enemy.runtimeId} className={`enemy-token ${enemy.boss ? 'boss' : ''} ${enemy.enemyId.toLowerCase()} ${shieldState} role-${profile.role.toLowerCase()} phase-${enemy.phase}`} style={{ left: `${point.x}%`, top: `${point.y}%`, '--enemy-scale':enemy.visualScale } as React.CSSProperties} title={`${enemy.name} ${Math.ceil(enemy.hp)}/${Math.ceil(enemy.maxHP)}`} onClick={()=>setSelectedEnemyID(enemy.runtimeId)}>
          <i className="enemy-hp"><em style={{ width: `${enemy.hp / enemy.maxHP * 100}%` }} /></i>{enemy.maxShieldHP>0&&<i className="enemy-shield"><em style={{width:`${enemy.shieldHP/enemy.maxShieldHP*100}%`}}/></i>}{enemy.boss&&tierID?<BossArtwork tier={tierID}/>:<EnemyArtwork enemyID={enemy.enemyId}/>}<span className="enemy-role-mark">{profile.role.slice(0,1)}</span>
        </button>; })}
        {snapshot.projectiles.map(projectile => { const tower = snapshot.deployed.find(item => item.slot === projectile.fromSlot); const point = SLOT_POINTS[projectile.fromSlot]; return <i key={projectile.runtimeId} className="projectile" style={{ left: `${point.x}%`, top: `${point.y}%` }} data-target={tower?.targetId ?? ''} />; })}
        {(snapshot.state === 'BOSS_WARNING' || snapshot.state === 'WAVE_STARTING') && <div className={`wave-banner ${snapshot.state === 'BOSS_WARNING' ? 'danger boss-intro' : ''}`}>{snapshot.state==='BOSS_WARNING'&&<BossArtwork tier={tierID??'NORMAL'}/>}<small>{snapshot.state}</small><b>{snapshot.state === 'BOSS_WARNING' ? dungeon.bossName : `WAVE ${String(snapshot.wave).padStart(2, '0')}`}</b>{snapshot.state==='BOSS_WARNING'&&<span>{tierID??'TUTORIAL'} · {dungeon.bossTrait}</span>}</div>}
        {selectedEnemy&&<aside className="enemy-info-panel"><button aria-label="關閉敵人資訊" onClick={()=>setSelectedEnemyID(null)}>×</button>{selectedEnemy.boss?<BossArtwork tier={tierID??'NORMAL'}/>:<EnemyArtwork enemyID={selectedEnemy.enemyId}/>}<div><small>RIFTBORN ANALYSIS · {tierID??'TUTORIAL'}</small><h3>{selectedEnemy.name}</h3><RoleBadge kind={ENEMY_VISUAL_PROFILES[selectedEnemy.enemyId].role}/><dl><span><dt>HP</dt><dd>{Math.ceil(selectedEnemy.hp).toLocaleString()} / {Math.ceil(selectedEnemy.maxHP).toLocaleString()}</dd></span><span><dt>DEF</dt><dd>{Math.round(selectedEnemy.defense)}</dd></span><span><dt>SPEED</dt><dd>{selectedEnemy.speed.toFixed(3)}</dd></span></dl><p><Eye/>弱點提示：{selectedEnemy.defense>100?'穿甲攻擊':selectedEnemy.shieldHP>0?'先擊破護盾':selectedEnemy.regenerationPercent>0?'集中火力':'優先處理'}</p></div></aside>}
      </div>

      <aside className="deployment-panel">
        <p><TowerControl /> DEPLOYMENT · {snapshot.deployed.length} / {dungeon.deploymentCap}</p>
        {loadout.map(id=>{const tower=getTowerById(id),owned=save.ownedTowers.find(entry=>entry.towerID===id);return <button key={id} className={`tower-chip ${deployTowerID===id?'active':''}`} onClick={()=>setDeployTowerID(id)} disabled={snapshot.deployed.length>=dungeon.deploymentCap}>
          <TowerArtwork towerID={id}/><span><b>{tower?.name}</b><small>{tower?.rarity} · Lv.{owned?.level??1} · {owned?.stars??1}★</small></span><em>{deployTowerID===id?'SELECT':'∞'}</em>
        </button>;})}
        {selected ? <div className="selected-tower"><p><Crosshair /> TOWER #{selected.runtimeId}</p><div><span>ATK <b>{Math.round(selected.stats.attack)}</b></span><span>RANGE <b>{selected.stats.range.toFixed(1)}</b></span><span>SHOTS <b>{selected.shots}</b></span></div><label>鎖定方式<select value={selected.targetingMode} onChange={event => { engineRef.current.setTargeting(selected.runtimeId, event.target.value as TargetingMode); sync(); }}><option value="FIRST">FIRST · 路徑最前</option><option value="NEAREST">NEAREST · 物理最近</option></select></label></div> : <p className="deployment-help">點擊空部署槽放置炮塔；同一永久塔型可建立多個戰鬥實例。</p>}
      </aside>

      <footer className="battle-controls">
        <span><Shield /> STATE · {snapshot.state}</span><span><Swords /> KILLS · {snapshot.totalKills}</span><span>DAMAGE · {Math.round(snapshot.totalDamage).toLocaleString()}</span>
        {snapshot.state === 'READY' || snapshot.state === 'SETUP' ? <button className="primary-action" onClick={() => { engineRef.current.start(); sync(); }}><Play /> 開始 25 波戰鬥</button> : null}
      </footer>

      {debugMode && <aside className="battle-debug"><p>DEV BATTLE</p><div>{[1,5,10,15,20,25].map(wave => <button key={wave} onClick={() => { engineRef.current.debugJump(wave); sync(); }}>W{wave}</button>)}<button onClick={() => { engineRef.current.debugKillAll(); sync(); }}>KILL ALL</button><button onClick={() => { engineRef.current.debugSetBaseHP(20); sync(); }}>HP 20</button><button onClick={() => { engineRef.current.debugForceVictory(); sync(); }}>VICTORY</button><button onClick={() => { engineRef.current.debugForceDefeat(); sync(); }}>DEFEAT</button></div></aside>}

      {terminal && <div className={`battle-result ${snapshot.state === 'VICTORY' ? 'victory' : 'defeat'}`}>
        <div><Sparkles /><small>{snapshot.state === 'VICTORY' ? `${tierID??'TUTORIAL'} COMPLETE` : 'CORE LOST'}</small><h2>{snapshot.state === 'VICTORY' ? `${dungeon.name}完成` : '防衛失敗'}</h2><p>{snapshot.state === 'VICTORY' ? (rewardError || (firstClearReward ? '首次通關：獎勵、下一階與新炮塔已永久保存。' : '標準重複通關獎勵已永久保存。')) : '調整部署位置與鎖定方式，再次建立防線。'}</p>{unlockedTowerID&&<section className="tower-unlock-reveal"><TowerArtwork towerID={unlockedTowerID}/><span><small>NEW TOWER AWAKENED</small><b>{getTowerById(unlockedTowerID)?.name}</b><TierBadge tier={getTowerById(unlockedTowerID)?.tierID??'NORMAL'}/></span></section>}{snapshot.state === 'VICTORY' && rewardMaterials.length > 0 && <div className="reward-list">{rewardMaterials.map((reward, index) => <span key={`${reward.materialID}-${index}`}><small>{getMaterialData(reward.materialID).rarity}</small><b>{getMaterialData(reward.materialID).displayName}</b><em>+{reward.amount}</em></span>)}</div>}<div className="result-stats"><span>WAVE <b>{snapshot.wave}</b></span><span>KILLS <b>{snapshot.totalKills}</b></span><span>DAMAGE <b>{Math.round(snapshot.totalDamage).toLocaleString()}</b></span></div><div className="result-actions"><button onClick={onBack}><ArrowLeft /> 返回地球區域</button><button className="primary-action" onClick={restart}><RotateCcw /> {snapshot.state === 'VICTORY' ? '再次挑戰' : '重新挑戰'}</button></div></div>
      </div>}
    </section>
  );
}
