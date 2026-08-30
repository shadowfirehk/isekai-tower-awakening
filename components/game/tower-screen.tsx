'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Crosshair, Gem, Shield, Sparkles, Swords, TowerControl, TrendingUp } from 'lucide-react';
import { InventoryService } from '@/lib/game/inventory-service';
import { MATERIAL_DATABASE } from '@/lib/game/materials';
import { PROGRESSION_CONFIG } from '@/lib/game/progression-config';
import { calculateTowerStats } from '@/lib/game/tower-stats';
import { TowerUpgradeService, UpgradePreview } from '@/lib/game/tower-upgrade-service';
import { getTowerById } from '@/lib/game/towers';
import { PlayerSave, TowerId } from '@/lib/game/types';

interface TowerScreenProps {
  save: PlayerSave;
  onBack: () => void;
  onBattle: () => void;
  onCommitted: (save: PlayerSave, message?: string) => void;
}

function StatChange({ label, current, projected }: { label: string; current: number; projected: number }) {
  return <span><small>{label}</small><b>{current.toFixed(1)} <em>→</em> {projected.toFixed(1)}</b></span>;
}

function CostRows({ save, preview }: { save: PlayerSave; preview: UpgradePreview | null }) {
  if (!preview) return <p className="max-copy">已達目前成長上限</p>;
  return <div className="upgrade-costs">{preview.costs.map(cost => {
    const owned = InventoryService.getAmount(save, cost.materialID);
    return <span key={cost.materialID} className={owned < cost.amount ? 'missing' : ''}><b>{MATERIAL_DATABASE[cost.materialID].displayName}</b><em>{owned.toLocaleString()} / {cost.amount.toLocaleString()}</em></span>;
  })}</div>;
}

export function TowerScreen({ save, onBack, onBattle, onCommitted }: TowerScreenProps) {
  const [selectedID, setSelectedID] = useState<TowerId | null>(save.ownedTowers[0]?.towerID ?? null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const progress = save.ownedTowers.find(tower => tower.towerID === selectedID) ?? null;
  const data = getTowerById(progress?.towerID);
  const stats = data && progress ? calculateTowerStats(data, progress, save) : null;
  const levelPreview = useMemo(() => selectedID ? TowerUpgradeService.generateUpgradePreview(save, selectedID, 'LEVEL') : null, [save, selectedID]);
  const starPreview = useMemo(() => selectedID ? TowerUpgradeService.generateUpgradePreview(save, selectedID, 'STAR') : null, [save, selectedID]);
  const levelCheck = selectedID ? TowerUpgradeService.canUpgradeLevel(save, selectedID) : { ok: false as const, reason: 'TOWER_NOT_OWNED' as const };
  const starCheck = selectedID ? TowerUpgradeService.canUpgradeStar(save, selectedID) : { ok: false as const, reason: 'TOWER_NOT_OWNED' as const };

  const upgrade = (kind: 'LEVEL' | 'STAR') => {
    if (!selectedID || processing) return;
    setProcessing(true);
    const result = kind === 'LEVEL'
      ? TowerUpgradeService.upgradeLevel(save, selectedID)
      : TowerUpgradeService.upgradeStar(save, selectedID);
    if (result.ok) {
      setFeedback(`${kind === 'LEVEL' ? 'LEVEL UP' : 'STAR UP'} · ${result.preview.from} → ${result.preview.to} · ATK ${result.preview.currentStats.attack.toFixed(1)} → ${result.preview.projectedStats.attack.toFixed(1)}`);
      onCommitted(result.save, kind === 'LEVEL' ? '炮台等級提升並已永久保存' : '炮台星級突破並已永久保存');
    } else {
      setFeedback(`${result.reason} · ${result.message}`);
    }
    window.setTimeout(() => setProcessing(false), 180);
  };

  return (
    <section className="tower-screen phase-screen growth-screen" aria-label="炮台管理與成長">
      <header className="phase-header">
        <button onClick={onBack}><ArrowLeft /> 返回主畫面</button>
        <div><p>TOWER GROWTH SYSTEM · PHASE 5</p><h1>炮台管理與成長</h1></div>
        <span>{save.ownedTowers.length} OWNED · MAX Lv.{PROGRESSION_CONFIG.maxTowerLevel}</span>
      </header>

      <div className="material-ribbon" aria-label="素材庫存">
        {Object.values(MATERIAL_DATABASE).map(material => <article key={material.id} className={material.rarity.toLowerCase()}><Gem /><span><small>{material.rarity} · {material.category}</small><b>{material.displayName}</b></span><em>{InventoryService.getAmount(save, material.id).toLocaleString()}</em></article>)}
      </div>

      <div className="growth-layout">
        <aside className="owned-tower-list"><p>OWNED TOWER LIST</p>{save.ownedTowers.map(tower => {
          const towerData = getTowerById(tower.towerID);
          return <button key={tower.towerID} className={selectedID === tower.towerID ? 'active' : ''} onClick={() => setSelectedID(tower.towerID)}><TowerControl /><span><b>{towerData?.name ?? tower.towerID}</b><small>Lv.{tower.level} · {tower.stars}★ · {towerData?.rarity}</small></span></button>;
        })}</aside>

        {data && progress && stats ? <main className="growth-detail">
          <article className="growth-identity">
            <div className="compact-tower-art"><i /><TowerControl /></div><div><p className="eyebrow">{data.realm} · {data.rarity}</p><h2>{data.name}</h2><span>{data.englishName}</span><div className="stars" aria-label={`${progress.stars} 星`}>{Array.from({ length: 5 }, (_, i) => <Sparkles key={i} className={i < progress.stars ? 'lit' : ''} />)}</div></div>
            {!save.firstGrowthUpgradeCompleted && save.earthTutorialCleared && <em className="growth-hint"><TrendingUp /> 可強化炮台</em>}
          </article>

          <div className="tower-level-row"><span>LEVEL <b>{progress.level} / {PROGRESSION_CONFIG.maxTowerLevel}</b></span><span>STAR <b>{progress.stars} / {PROGRESSION_CONFIG.maxTowerStars}</b></span><span>CAREER <b>DEF +10%</b></span></div>
          <div className="stat-grid growth-stats">
            <div><Swords /><span>攻擊</span><b>{stats.attack.toFixed(1)}</b><small>FINAL</small></div>
            <div><Shield /><span>防禦</span><b>{stats.defense.toFixed(1)}</b><small>FINAL</small></div>
            <div><Crosshair /><span>射程</span><b>{stats.range.toFixed(1)}</b><small>GRID UNITS</small></div>
            <div><TowerControl /><span>攻速</span><b>{stats.attackSpeed.toFixed(2)}/s</b><small>FINAL</small></div>
          </div>

          <div className="upgrade-grid">
            <section className="upgrade-card level-upgrade">
              <header><span>LEVEL UP</span><b>{progress.level} → {Math.min(10, progress.level + 1)}</b></header>
              {levelPreview ? <div className="preview-stats"><StatChange label="ATTACK" current={levelPreview.currentStats.attack} projected={levelPreview.projectedStats.attack} /><StatChange label="DEFENSE" current={levelPreview.currentStats.defense} projected={levelPreview.projectedStats.defense} /></div> : null}
              <CostRows save={save} preview={levelPreview} />
              <button disabled={processing || !levelCheck.ok} onClick={() => upgrade('LEVEL')}>{levelCheck.ok ? '升級等級' : levelCheck.reason === 'MAX_LEVEL' ? 'MAX LEVEL' : '素材不足'}</button>
            </section>
            <section className="upgrade-card star-upgrade">
              <header><span>STAR UP</span><b>{progress.stars}★ → {Math.min(5, progress.stars + 1)}★</b></header>
              {starPreview ? <div className="preview-stats"><StatChange label="ATTACK" current={starPreview.currentStats.attack} projected={starPreview.projectedStats.attack} /><StatChange label="DEFENSE" current={starPreview.currentStats.defense} projected={starPreview.projectedStats.defense} /></div> : null}
              <CostRows save={save} preview={starPreview} />
              <button disabled={processing || !starCheck.ok} onClick={() => upgrade('STAR')}>{starCheck.ok ? '突破星級' : starCheck.reason === 'MAX_STAR' ? 'MAX STAR' : '素材不足'}</button>
            </section>
          </div>
          {feedback && <output className="upgrade-feedback" aria-live="polite">{feedback}</output>}
          <section className="pipeline-card"><small>SINGLE SOURCE OF TRUTH</small><p>BASE → LEVEL ×{stats.levelMultiplier.toFixed(2)} → STAR ×{stats.starMultiplier.toFixed(2)} → CAREER → FINAL · 此數值直接供戰鬥 TowerFactory 使用</p></section>
          <button className="primary-action growth-battle" onClick={onBattle}><Swords /> 使用目前最終屬性進入新手試煉</button>
        </main> : <div className="empty-core"><TowerControl /><h2>尚未取得炮台</h2></div>}
      </div>
    </section>
  );
}
