'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Crosshair, FastForward, HeartPulse, Pause, Play, RotateCcw, Shield, Sparkles, Swords, TowerControl } from 'lucide-react';
import { BattleEngine, BattleSnapshot } from '@/lib/game/battle-engine';
import { EARTH_TUTORIAL_DUNGEON } from '@/lib/game/dungeon-data';
import { getMaterialData } from '@/lib/game/materials';
import { RewardService } from '@/lib/game/reward-service';
import { MaterialReward, PlayerSave, TargetingMode } from '@/lib/game/types';

interface BattleScreenProps {
  save: PlayerSave;
  debugMode: boolean;
  onBack: () => void;
  onCommitted: (save: PlayerSave, message?: string) => void;
}

function pathPoint(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= .25) return { x: 5 + p / .25 * 30, y: 70 };
  if (p <= .5) return { x: 35, y: 70 - (p - .25) / .25 * 40 };
  if (p <= .75) return { x: 35 + (p - .5) / .25 * 35, y: 30 };
  return { x: 70 + (p - .75) / .25 * 23, y: 30 + (p - .75) / .25 * 35 };
}

const SLOT_POINTS = [{ x: 23, y: 59 }, { x: 43, y: 48 }, { x: 59, y: 42 }, { x: 79, y: 48 }];

function createBattleSessionID() {
  return `earth-tutorial-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BattleScreen({ save, debugMode, onBack, onCommitted }: BattleScreenProps) {
  const [initialEngine] = useState(() => new BattleEngine(save));
  const engineRef = useRef(initialEngine);
  const [snapshot, setSnapshot] = useState<BattleSnapshot>(() => initialEngine.snapshot());
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [battleSessionID, setBattleSessionID] = useState(createBattleSessionID);
  const [rewardMaterials, setRewardMaterials] = useState<MaterialReward[]>([]);
  const [firstClearReward, setFirstClearReward] = useState(false);
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
      const result = RewardService.commitTutorialVictory(save, battleSessionID);
      if (!result.ok) {
        setRewardError(result.message);
        return;
      }
      setRewardMaterials(result.reward.materials);
      setFirstClearReward(result.reward.firstClear);
      onCommitted(result.save, result.reward.firstClear ? '首通成長素材已永久保存' : '重複通關素材已永久保存');
    }, 0);
    return () => window.clearTimeout(commit);
  }, [snapshot.state, save, battleSessionID, onCommitted]);

  const deploy = (slot: number) => {
    const result = engineRef.current.deploy(slot);
    sync();
    if (result.ok) setSelectedTower(engineRef.current.snapshot().deployed.find(tower => tower.slot === slot)?.runtimeId ?? null);
  };

  const restart = () => {
    engineRef.current = new BattleEngine(save);
    resultCommitted.current = false;
    setBattleSessionID(createBattleSessionID());
    setRewardMaterials([]);
    setFirstClearReward(false);
    setRewardError('');
    setSelectedTower(null);
    sync();
  };

  const selected = snapshot.deployed.find(tower => tower.runtimeId === selectedTower) ?? null;
  const terminal = snapshot.state === 'VICTORY' || snapshot.state === 'DEFEAT';
  return (
    <section className="battle-screen phase-screen" aria-label="25 波新手試煉">
      <header className="battle-hud">
        <button className="hud-back" onClick={onBack}><ArrowLeft /> 離開</button>
        <div className="wave-readout"><small>WAVE</small><b>{String(snapshot.wave).padStart(2, '0')}</b><span>/ 25</span></div>
        <div className="battle-title"><p>EARTH_TUTORIAL_001</p><h1>新手試煉</h1><span>{snapshot.notice}</span></div>
        <div className="base-health"><HeartPulse /><span><small>BASE CORE</small><b>{snapshot.baseHP} / {snapshot.maxBaseHP}</b></span><i><em style={{ width: `${snapshot.baseHP / snapshot.maxBaseHP * 100}%` }} /></i></div>
        <button onClick={() => { engineRef.current.togglePause(); sync(); }} aria-label="暫停或繼續">{snapshot.paused ? <Play /> : <Pause />}</button>
        <button onClick={() => { engineRef.current.toggleSpeed(); sync(); }}><FastForward /> {snapshot.speed}×</button>
      </header>

      <div className="battlefield">
        <div className="map-grid" aria-hidden="true" />
        <div className="battle-path" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="spawn-gate"><span>SPAWN</span></div><div className="core-gate"><Shield /><span>CORE</span></div>
        {SLOT_POINTS.map((point, slot) => {
          const tower = snapshot.deployed.find(item => item.slot === slot);
          return <button key={slot} className={`deploy-slot ${tower ? 'occupied' : ''} ${tower?.runtimeId === selectedTower ? 'selected' : ''}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => tower ? setSelectedTower(tower.runtimeId) : deploy(slot)}>
            {tower ? <><span className="turret-head"><i /></span><small>SLOT {slot + 1}</small></> : <><b>+</b><small>DEPLOY</small></>}
          </button>;
        })}
        {snapshot.enemies.map(enemy => { const point = pathPoint(enemy.progress); return <div key={enemy.runtimeId} className={`enemy-token ${enemy.boss ? 'boss' : ''} ${enemy.enemyId.toLowerCase()}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} title={`${enemy.name} ${Math.ceil(enemy.hp)}/${Math.ceil(enemy.maxHP)}`}>
          <i><em style={{ width: `${enemy.hp / enemy.maxHP * 100}%` }} /></i><span>{enemy.boss ? 'BOSS' : enemy.enemyId === 'EARTH_TANK' ? 'T' : enemy.enemyId === 'EARTH_RUNNER' ? 'R' : 'G'}</span>
        </div>; })}
        {snapshot.projectiles.map(projectile => { const tower = snapshot.deployed.find(item => item.slot === projectile.fromSlot); const point = SLOT_POINTS[projectile.fromSlot]; return <i key={projectile.runtimeId} className="projectile" style={{ left: `${point.x}%`, top: `${point.y}%` }} data-target={tower?.targetId ?? ''} />; })}
        {(snapshot.state === 'BOSS_WARNING' || snapshot.state === 'WAVE_STARTING') && <div className={`wave-banner ${snapshot.state === 'BOSS_WARNING' ? 'danger' : ''}`}><small>{snapshot.state}</small><b>{snapshot.state === 'BOSS_WARNING' ? '巨大生命反應接近' : `WAVE ${String(snapshot.wave).padStart(2, '0')}`}</b></div>}
      </div>

      <aside className="deployment-panel">
        <p><TowerControl /> DEPLOYMENT · {snapshot.deployed.length} / {EARTH_TUTORIAL_DUNGEON.deploymentCap}</p>
        <button className="tower-chip" onClick={() => deploy(SLOT_POINTS.findIndex((_, i) => !snapshot.deployed.some(t => t.slot === i)))} disabled={snapshot.deployed.length >= EARTH_TUTORIAL_DUNGEON.deploymentCap}>
          <span className="mini-tower"><i /></span><span><b>大地自動炮塔</b><small>NORMAL · Lv.{save.ownedTowers[0]?.level ?? 1} · {save.ownedTowers[0]?.stars ?? 1}★</small></span><em>× ∞</em>
        </button>
        {selected ? <div className="selected-tower"><p><Crosshair /> TOWER #{selected.runtimeId}</p><div><span>ATK <b>{Math.round(selected.stats.attack)}</b></span><span>RANGE <b>{selected.stats.range.toFixed(1)}</b></span><span>SHOTS <b>{selected.shots}</b></span></div><label>鎖定方式<select value={selected.targetingMode} onChange={event => { engineRef.current.setTargeting(selected.runtimeId, event.target.value as TargetingMode); sync(); }}><option value="FIRST">FIRST · 路徑最前</option><option value="NEAREST">NEAREST · 物理最近</option></select></label></div> : <p className="deployment-help">點擊空部署槽放置炮塔；同一永久塔型可建立多個戰鬥實例。</p>}
      </aside>

      <footer className="battle-controls">
        <span><Shield /> STATE · {snapshot.state}</span><span><Swords /> KILLS · {snapshot.totalKills}</span><span>DAMAGE · {Math.round(snapshot.totalDamage).toLocaleString()}</span>
        {snapshot.state === 'READY' || snapshot.state === 'SETUP' ? <button className="primary-action" onClick={() => { engineRef.current.start(); sync(); }}><Play /> 開始 25 波戰鬥</button> : null}
      </footer>

      {debugMode && <aside className="battle-debug"><p>DEV BATTLE</p><div>{[1,5,10,15,20,25].map(wave => <button key={wave} onClick={() => { engineRef.current.debugJump(wave); sync(); }}>W{wave}</button>)}<button onClick={() => { engineRef.current.debugKillAll(); sync(); }}>KILL ALL</button><button onClick={() => { engineRef.current.debugSetBaseHP(20); sync(); }}>HP 20</button><button onClick={() => { engineRef.current.debugForceVictory(); sync(); }}>VICTORY</button><button onClick={() => { engineRef.current.debugForceDefeat(); sync(); }}>DEFEAT</button></div></aside>}

      {terminal && <div className={`battle-result ${snapshot.state === 'VICTORY' ? 'victory' : 'defeat'}`}>
        <div><Sparkles /><small>{snapshot.state === 'VICTORY' ? 'TUTORIAL COMPLETE' : 'CORE LOST'}</small><h2>{snapshot.state === 'VICTORY' ? '新手試煉完成' : '防衛失敗'}</h2><p>{snapshot.state === 'VICTORY' ? (rewardError || (firstClearReward ? '首次通關：標準獎勵與首通加成已永久保存。' : '標準重複通關獎勵已永久保存。')) : '調整部署位置與鎖定方式，再次建立防線。'}</p>{snapshot.state === 'VICTORY' && rewardMaterials.length > 0 && <div className="reward-list">{rewardMaterials.map((reward, index) => <span key={`${reward.materialID}-${index}`}><small>{getMaterialData(reward.materialID).rarity}</small><b>{getMaterialData(reward.materialID).displayName}</b><em>+{reward.amount}</em></span>)}</div>}<div className="result-stats"><span>WAVE <b>{snapshot.wave}</b></span><span>KILLS <b>{snapshot.totalKills}</b></span><span>DAMAGE <b>{Math.round(snapshot.totalDamage).toLocaleString()}</b></span></div><div className="result-actions"><button onClick={onBack}><ArrowLeft /> 返回主畫面</button><button className="primary-action" onClick={restart}><RotateCcw /> {snapshot.state === 'VICTORY' ? '再次挑戰' : '重新挑戰'}</button></div></div>
      </div>}
    </section>
  );
}
