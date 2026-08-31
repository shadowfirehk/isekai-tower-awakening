'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Crosshair,
  Filter,
  Gem,
  LockKeyhole,
  Shield,
  Sparkles,
  Swords,
  TowerControl,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  TierBadge,
  TowerArtwork,
  TowerRole,
} from '@/components/game/visual-ui';
import { InventoryService } from '@/lib/game/inventory-service';
import { MATERIAL_DATABASE } from '@/lib/game/materials';
import { PROGRESSION_CONFIG } from '@/lib/game/progression-config';
import { calculateTowerStats } from '@/lib/game/tower-stats';
import {
  TowerUpgradeService,
  UpgradePreview,
} from '@/lib/game/tower-upgrade-service';
import { TOWER_CATALOG } from '@/lib/game/towers';
import { PlayerSave, TowerId } from '@/lib/game/types';

interface Props {
  save: PlayerSave;
  onBack: () => void;
  onBattle: () => void;
  onCommitted: (save: PlayerSave, message?: string) => void;
}
type FilterMode = 'ALL' | 'OWNED' | 'LOCKED';
function StatChange({
  label,
  current,
  projected,
}: {
  label: string;
  current: number;
  projected: number;
}) {
  return (
    <span>
      <small>{label}</small>
      <b>
        {current.toFixed(1)} <em>→</em> {projected.toFixed(1)}
      </b>
    </span>
  );
}
function CostRows({
  save,
  preview,
}: {
  save: PlayerSave;
  preview: UpgradePreview | null;
}) {
  if (!preview) return <p className="max-copy">已達目前成長上限</p>;
  return (
    <div className="upgrade-costs">
      {preview.costs.map((cost) => {
        const owned = InventoryService.getAmount(save, cost.materialID);
        return (
          <span
            key={cost.materialID}
            className={owned < cost.amount ? 'missing' : ''}
          >
            <b>{MATERIAL_DATABASE[cost.materialID].displayName}</b>
            <em>
              {owned.toLocaleString()} / {cost.amount.toLocaleString()}
            </em>
          </span>
        );
      })}
    </div>
  );
}

export function TowerScreen({ save, onBack, onBattle, onCommitted }: Props) {
  const [selectedID, setSelectedID] = useState<TowerId>(
    save.ownedTowers[0]?.towerID ?? 'EARTH_BASIC_AUTO_TURRET',
  );
  const [filter, setFilter] = useState<FilterMode>('ALL');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const towers = Object.values(TOWER_CATALOG),
    ownedIDs = new Set(
      save.ownedTowers.filter((t) => t.unlocked).map((t) => t.towerID),
    );
  const shown = towers.filter(
    (t) =>
      filter === 'ALL' ||
      (filter === 'OWNED' ? ownedIDs.has(t.id) : !ownedIDs.has(t.id)),
  );
  const data = TOWER_CATALOG[selectedID],
    progress =
      save.ownedTowers.find((t) => t.towerID === selectedID && t.unlocked) ??
      null;
  const stats = progress ? calculateTowerStats(data, progress, save) : null;
  const levelPreview = progress
    ? TowerUpgradeService.generateUpgradePreview(save, selectedID, 'LEVEL')
    : null;
  const starPreview = progress
    ? TowerUpgradeService.generateUpgradePreview(save, selectedID, 'STAR')
    : null;
  const levelCheck = TowerUpgradeService.canUpgradeLevel(save, selectedID),
    starCheck = TowerUpgradeService.canUpgradeStar(save, selectedID);
  const upgrade = (kind: 'LEVEL' | 'STAR') => {
    if (!progress || processing) return;
    setProcessing(true);
    const result =
      kind === 'LEVEL'
        ? TowerUpgradeService.upgradeLevel(save, selectedID)
        : TowerUpgradeService.upgradeStar(save, selectedID);
    if (result.ok) {
      setFeedback(
        `${kind === 'LEVEL' ? 'LEVEL UP' : 'STAR UP'} · ${result.preview.from} → ${result.preview.to}`,
      );
      onCommitted(
        result.save,
        kind === 'LEVEL'
          ? '炮塔等級提升並已永久保存'
          : '炮塔星級突破並已永久保存',
      );
    } else setFeedback(`${result.reason} · ${result.message}`);
    window.setTimeout(() => setProcessing(false), 180);
  };
  const power = stats
    ? Math.round(
        stats.attack * stats.attackSpeed + stats.penetration + stats.range * 10,
      )
    : Math.round(data.baseStats.attack * data.baseStats.attackSpeed);
  return (
    <section
      className="tower-screen phase-screen arsenal-screen"
      aria-label="地球炮塔兵器庫"
    >
      <header className="phase-header arsenal-header">
        <button onClick={onBack}>
          <ArrowLeft />
          返回主畫面
        </button>
        <div>
          <p>EARTH TOWER ARSENAL · UI PHASE</p>
          <h1>地球炮塔兵器庫</h1>
        </div>
        <span>{save.ownedTowers.length} / 12 COLLECTED</span>
      </header>
      <div className="arsenal-toolbar">
        <div className="arsenal-progress">
          <TowerControl />
          <span>
            <small>EARTH ARSENAL</small>
            <b>{save.ownedTowers.length} / 12</b>
          </span>
          <i>
            <em style={{ width: `${(save.ownedTowers.length / 12) * 100}%` }} />
          </i>
        </div>
        <div className="arsenal-filters">
          <Filter />
          {(['ALL', 'OWNED', 'LOCKED'] as FilterMode[]).map((value) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="arsenal-materials">
          {Object.values(MATERIAL_DATABASE)
            .filter((m) => InventoryService.getAmount(save, m.id) > 0)
            .slice(0, 4)
            .map((m) => (
              <span key={m.id}>
                <Gem />
                <small>{m.displayName}</small>
                <b>{InventoryService.getAmount(save, m.id).toLocaleString()}</b>
              </span>
            ))}
        </div>
      </div>
      <div className="arsenal-layout">
        <aside className="tower-collection-grid">
          {shown.map((tower) => {
            const owned = save.ownedTowers.find(
                (item) => item.towerID === tower.id,
              ),
              locked = !owned,
              evolution =
                owned?.stars === 5
                  ? 'evolution-2'
                  : (owned?.stars ?? 0) >= 3
                    ? 'evolution-1'
                    : '';
            return (
              <button
                key={tower.id}
                className={`tower-collection-card ${selectedID === tower.id ? 'selected' : ''} ${locked ? 'locked' : ''} ${evolution} tier-card-${tower.tierID.toLowerCase()}`}
                onClick={() => setSelectedID(tower.id)}
              >
                <TowerArtwork towerID={tower.id} />
                <header>
                  <TierBadge tier={tower.tierID} />
                  {locked ? (
                    <LockKeyhole />
                  ) : (
                    <span>Lv.{owned?.level ?? 1}</span>
                  )}
                </header>
                <footer>
                  <b>{tower.name}</b>
                  <small>{tower.roleTags.join(' · ')}</small>
                  {owned && (
                    <em>
                      {'★'.repeat(owned.stars)}
                      {'☆'.repeat(5 - owned.stars)}
                    </em>
                  )}
                </footer>
                {locked && (
                  <i className="lock-overlay">
                    <LockKeyhole />
                    <span>未取得</span>
                  </i>
                )}
              </button>
            );
          })}
        </aside>
        <main
          className={`tower-dossier-v2 tier-card-${data.tierID.toLowerCase()} ${progress ? '' : 'locked'}`}
        >
          <section
            className={`tower-showcase ${progress?.stars === 5 ? 'evolution-2' : (progress?.stars ?? 0) >= 3 ? 'evolution-1' : ''}`}
          >
            <div className="tower-showcase-grid" />
            <TowerArtwork towerID={data.id} />
            <div className="tower-orbit">
              <i />
              <i />
              <i />
            </div>
            <TierBadge tier={data.tierID} />
            <span className="tower-serial">
              TW / EARTH / {String(towers.indexOf(data) + 1).padStart(2, '0')} ·{' '}
              {progress?.stars === 5
                ? 'AWAKENED II'
                : (progress?.stars ?? 0) >= 3
                  ? 'AWAKENED I'
                  : 'BASE FORM'}
            </span>
          </section>
          <section className="tower-data-v2">
            <header>
              <div>
                <small>{data.englishName}</small>
                <h2>{data.name}</h2>
                <TowerRole towerID={data.id} />
              </div>
              <div className="tower-power">
                <small>COMBAT POWER</small>
                <b>{power.toLocaleString()}</b>
              </div>
            </header>
            <p>{data.description}</p>
            {progress && stats ? (
              <>
                <div className="tower-rank">
                  <span>
                    LEVEL{' '}
                    <b>
                      {progress.level} / {PROGRESSION_CONFIG.maxTowerLevel}
                    </b>
                  </span>
                  <span>
                    STAR{' '}
                    <b>
                      {'★'.repeat(progress.stars)}
                      {'☆'.repeat(5 - progress.stars)}
                    </b>
                  </span>
                  <span>
                    PATTERN{' '}
                    <b>
                      {data.attackPattern} × {data.maxTargets}
                    </b>
                  </span>
                </div>
                <div className="stat-grid growth-stats">
                  <div>
                    <Swords />
                    <span>攻擊</span>
                    <b>{stats.attack.toFixed(0)}</b>
                    <small>ATK</small>
                  </div>
                  <div>
                    <Shield />
                    <span>防禦</span>
                    <b>{stats.defense.toFixed(0)}</b>
                    <small>DEF</small>
                  </div>
                  <div>
                    <Crosshair />
                    <span>射程</span>
                    <b>{stats.range.toFixed(1)}</b>
                    <small>RANGE</small>
                  </div>
                  <div>
                    <Zap />
                    <span>攻速</span>
                    <b>{stats.attackSpeed.toFixed(2)}</b>
                    <small>ATK/S</small>
                  </div>
                </div>
                <div className="tower-skill-panel">
                  <Sparkles />
                  <span>
                    <small>CORE ROLE</small>
                    <b>{data.roleTags.join(' / ')}</b>
                    <p>
                      {data.attackPattern === 'AOE'
                        ? '爆裂能量同時覆蓋多個目標。'
                        : data.attackPattern === 'CHAIN'
                          ? '能量會在多個敵人之間連鎖。'
                          : data.bossDamageMultiplier > 1
                            ? '集中火力對頭目造成額外傷害。'
                            : '穩定鎖定路徑最前方目標。'}
                    </p>
                  </span>
                </div>
                <div className="upgrade-grid compact-upgrades">
                  <section className="upgrade-card level-upgrade">
                    <header>
                      <span>LEVEL UP</span>
                      <b>
                        {progress.level} → {Math.min(10, progress.level + 1)}
                      </b>
                    </header>
                    {levelPreview && (
                      <div className="preview-stats">
                        <StatChange
                          label="ATTACK"
                          current={levelPreview.currentStats.attack}
                          projected={levelPreview.projectedStats.attack}
                        />
                        <StatChange
                          label="DEFENSE"
                          current={levelPreview.currentStats.defense}
                          projected={levelPreview.projectedStats.defense}
                        />
                      </div>
                    )}
                    <CostRows save={save} preview={levelPreview} />
                    <button
                      disabled={processing || !levelCheck.ok}
                      onClick={() => upgrade('LEVEL')}
                    >
                      {levelCheck.ok
                        ? '強化等級'
                        : levelCheck.reason === 'MAX_LEVEL'
                          ? 'MAX LEVEL'
                          : '素材不足'}
                    </button>
                  </section>
                  <section className="upgrade-card star-upgrade">
                    <header>
                      <span>STAR AWAKEN</span>
                      <b>
                        {progress.stars}★ → {Math.min(5, progress.stars + 1)}★
                      </b>
                    </header>
                    {starPreview && (
                      <div className="preview-stats">
                        <StatChange
                          label="ATTACK"
                          current={starPreview.currentStats.attack}
                          projected={starPreview.projectedStats.attack}
                        />
                        <StatChange
                          label="RANGE"
                          current={starPreview.currentStats.range}
                          projected={starPreview.projectedStats.range}
                        />
                      </div>
                    )}
                    <CostRows save={save} preview={starPreview} />
                    <button
                      disabled={processing || !starCheck.ok}
                      onClick={() => upgrade('STAR')}
                    >
                      {starCheck.ok
                        ? '星級覺醒'
                        : starCheck.reason === 'MAX_STAR'
                          ? 'MAX STAR'
                          : '素材不足'}
                    </button>
                  </section>
                </div>
                {feedback && (
                  <output className="upgrade-feedback">{feedback}</output>
                )}
                <button
                  className="primary-action growth-battle"
                  onClick={onBattle}
                >
                  <Swords />
                  編入戰隊並前往地球戰線
                </button>
              </>
            ) : (
              <div className="locked-tower-message">
                <LockKeyhole />
                <h3>炮塔資料受保護</h3>
                <p>通關前一地球階級即可永久解鎖此炮塔。</p>
                <TierBadge tier={data.tierID} />
              </div>
            )}
          </section>
        </main>
      </div>
      {!save.firstGrowthUpgradeCompleted && save.earthTutorialCleared && (
        <div className="arsenal-tip">
          <TrendingUp />
          首通素材已到位，選擇已擁有炮塔完成第一次強化。
        </div>
      )}
    </section>
  );
}
