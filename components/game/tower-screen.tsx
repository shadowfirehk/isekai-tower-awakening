'use client';

import { ArrowLeft, Crosshair, Shield, Sparkles, Swords, TowerControl } from 'lucide-react';
import { calculateTowerStats } from '@/lib/game/tower-stats';
import { getTowerById } from '@/lib/game/towers';
import { PlayerSave } from '@/lib/game/types';

interface TowerScreenProps {
  save: PlayerSave;
  onBack: () => void;
  onBattle: () => void;
}

export function TowerScreen({ save, onBack, onBattle }: TowerScreenProps) {
  const progress = save.ownedTowers[0] ?? null;
  const data = getTowerById(progress?.towerID);
  const stats = data && progress ? calculateTowerStats(data, progress, save) : null;
  return (
    <section className="tower-screen phase-screen" aria-label="炮台核心資料庫">
      <header className="phase-header">
        <button onClick={onBack}><ArrowLeft /> 返回主畫面</button>
        <div><p>TOWER CORE SYSTEM · PHASE 3</p><h1>炮台核心資料庫</h1></div>
        <span>{save.ownedTowers.length} / 1 OWNED</span>
      </header>
      {data && progress && stats ? (
        <div className="tower-layout">
          <article className="tower-visual-card">
            <div className="tower-core-art" aria-hidden="true"><i /><TowerControl /></div>
            <div className="rarity-line"><span>NORMAL</span><b>EARTH / AUTO</b></div>
            <h2>{data.name}</h2><p>{data.englishName}</p>
            <div className="stars" aria-label={`${progress.stars} 星`}>{Array.from({ length: 5 }, (_, i) => <Sparkles key={i} className={i < progress.stars ? 'lit' : ''} />)}</div>
          </article>
          <article className="tower-dossier">
            <p className="eyebrow">TOWER ID · {data.id}</p><h2>{data.name}</h2><p className="tower-description">{data.description}</p>
            <div className="tower-level-row"><span>LEVEL <b>{progress.level}</b></span><span>STAR <b>{progress.stars} / 5</b></span><span>STATUS <b>UNLOCKED</b></span></div>
            <div className="stat-grid">
              <div><Swords /><span>攻擊</span><b>{Math.round(stats.attack)}</b><small>BASE {data.baseStats.attack}</small></div>
              <div><Shield /><span>防禦</span><b>{Math.round(stats.defense)}</b><small>CAREER +10%</small></div>
              <div><Crosshair /><span>射程</span><b>{stats.range.toFixed(1)}</b><small>GRID UNITS</small></div>
              <div><TowerControl /><span>攻速</span><b>{stats.attackSpeed.toFixed(2)}/s</b><small>STAR SCALE OFF</small></div>
            </div>
            <section className="pipeline-card"><small>FINAL STAT PIPELINE</small><p>BASE → LEVEL ×{stats.levelMultiplier.toFixed(2)} → STAR ×{stats.starMultiplier.toFixed(2)} → CAREER → FINAL</p></section>
            <section className="target-card"><Crosshair /><div><small>DEFAULT TARGETING</small><b>FIRST</b><p>依路徑進度選取最接近基地的敵人，不使用物理距離替代。</p></div></section>
            <button className="primary-action" onClick={onBattle}><Swords /> 前往新手試煉</button>
          </article>
        </div>
      ) : <div className="empty-core"><TowerControl /><h2>尚未取得炮台</h2><p>完成地球職業覺醒以取得永久起始炮台。</p></div>}
    </section>
  );
}
