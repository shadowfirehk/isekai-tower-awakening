'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bolt,
  Check,
  ChevronRight,
  Crown,
  Gem,
  LockKeyhole,
  Shield,
  Sparkles,
  Swords,
  TowerControl,
  Zap,
} from 'lucide-react';
import { EARTH_TIER_CONFIGS, getEarthTier } from '@/lib/game/earth-tiers';
import { EarthProgressionService } from '@/lib/game/earth-progression-service';
import { RunRewardService } from '@/lib/game/run-reward-service';
import { getMaterialData } from '@/lib/game/materials';
import { getTowerById } from '@/lib/game/towers';
import {
  BossArtwork,
  RoleBadge,
  TierBadge,
  TowerArtwork,
} from '@/components/game/visual-ui';
import { BOSS_VISUAL_PROFILES, tierStyleVars } from '@/lib/game/visual-config';
import {
  BOSS_MECHANICS,
  MAP_TOPOLOGY_BY_TIER,
  TOWER_SYNERGIES,
} from '@/lib/game/battle-depth';
import {
  EARTH_TIER_IDS,
  EarthTierId,
  PlayerSave,
  TowerId,
} from '@/lib/game/types';

interface Props {
  save: PlayerSave;
  onBack: () => void;
  onEnter: (tierID: EarthTierId) => void;
  onCommitted: (save: PlayerSave, message?: string) => void;
}
export function EarthRegionScreen({
  save,
  onBack,
  onEnter,
  onCommitted,
}: Props) {
  const [selected, setSelected] = useState<EarthTierId>(
    save.earthRegion.highestUnlockedTier ?? 'NORMAL',
  );
  const [feedback, setFeedback] = useState('');
  const tier = getEarthTier(selected),
    progress = save.earthRegion.tierProgress[selected];
  const owned = useMemo(
    () => save.ownedTowers.filter((t) => t.unlocked),
    [save.ownedTowers],
  );
  const toggle = (towerID: TowerId) => {
    const current = save.earthLoadout.includes(towerID)
      ? save.earthLoadout.filter((id) => id !== towerID)
      : [...save.earthLoadout, towerID];
    const result = EarthProgressionService.setLoadout(save, current);
    if (!result.ok) {
      setFeedback(result.error);
      return;
    }
    onCommitted(result.save, '地球炮塔編成已永久保存');
    setFeedback('LOADOUT SAVED');
  };
  const enter = () => {
    const check = EarthProgressionService.canEnter(save, selected);
    if (!check.ok) {
      setFeedback(check.error);
      return;
    }
    onEnter(selected);
  };
  const sweep = () => {
    if (!RunRewardService.canSweep(save,selected)) {
      setFeedback('必須先手動完成此階級才能快速掃蕩。');
      return;
    }
    const result = RunRewardService.sweep(
      save,
      selected,
      `sweep-${selected}-${Date.now()}`,
    );
    if (!result.ok) {
      setFeedback(result.error);
      return;
    }
    onCommitted(result.save, `${tier.name}階快速掃蕩完成，素材已保存`);
    setFeedback('QUICK CLEAR COMPLETE');
  };
  const bossVisual = BOSS_VISUAL_PROFILES[selected];
  return (
    <section
      className={`earth-region phase-screen tier-theme-${selected.toLowerCase()}`}
      style={tierStyleVars(selected)}
      aria-label="地球區域完整進度"
    >
      <header className="phase-header">
        <button onClick={onBack}>
          <ArrowLeft />
          返回主畫面
        </button>
        <div>
          <p>WORLD 01 · EARTH REGION · PHASE 6</p>
          <h1>地球十二階進化路線</h1>
        </div>
        <span>
          {save.earthRegion.earthCompleted
            ? 'EARTH COMPLETE'
            : 'PROGRESSION ACTIVE'}
        </span>
      </header>
      <div className="earth-summary">
        <article>
          <Crown />
          <span>
            <small>HIGHEST CLEARED</small>
            <b>{save.earthRegion.highestClearedTier ?? 'TUTORIAL'}</b>
          </span>
        </article>
        <article>
          <Swords />
          <span>
            <small>TOTAL EARTH POWER</small>
            <b>{save.earthRegion.totalEarthPower.toLocaleString()}</b>
          </span>
        </article>
        <article className={save.earthRegion.earthCompleted ? 'complete' : ''}>
          <Sparkles />
          <span>
            <small>REGION STATUS</small>
            <b>{save.earthRegion.completionBadge ?? 'IN PROGRESS'}</b>
          </span>
        </article>
      </div>
      <div className="earth-layout">
        <nav className="tier-road" aria-label="十二階地球路線">
          {EARTH_TIER_IDS.map((id) => {
            const item = EARTH_TIER_CONFIGS[id],
              state = save.earthRegion.tierProgress[id];
            return (
              <button
                key={id}
                style={tierStyleVars(id)}
                className={`${selected === id ? 'active' : ''} ${state.cleared ? 'cleared' : state.unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => state.unlocked && setSelected(id)}
                disabled={!state.unlocked}
              >
                <span>{String(item.order + 1).padStart(2, '0')}</span>
                <i>
                  {state.cleared ? (
                    <Check />
                  ) : state.unlocked ? (
                    <Shield />
                  ) : (
                    <LockKeyhole />
                  )}
                </i>
                <b>{item.name}</b>
                <small>{id}</small>
              </button>
            );
          })}
        </nav>
        <main className="tier-detail">
          <div className="tier-hero">
            <TierBadge tier={selected} />
            <span>
              {tier.englishName} · TIER{' '}
              {String(tier.order + 1).padStart(2, '0')}
            </span>
            <h2>{tier.dungeonName}</h2>
            <p>
              25 WAVES · {MAP_TOPOLOGY_BY_TIER[selected]} MAP · 祝福節點 05 / 10
              / 15 / 20
            </p>
            <em>
              {progress.cleared
                ? 'CLEARED'
                : progress.unlocked
                  ? 'AVAILABLE'
                  : 'LOCKED'}
            </em>
          </div>
          <div className="tier-metrics">
            <span>
              <small>RECOMMENDED POWER</small>
              <b>{tier.recommendedPower.toLocaleString()}</b>
            </span>
            <span>
              <small>DEPLOYMENT CAP</small>
              <b>{tier.deploymentCap}</b>
            </span>
            <span>
              <small>BEST WAVE</small>
              <b>{progress.bestWave} / 25</b>
            </span>
            <span>
              <small>CLEAR COUNT</small>
              <b>{progress.clearCount}</b>
            </span>
          </div>
          <div className="boss-card visual-boss-card">
            <BossArtwork tier={selected} />
            <span>
              <small>FINAL BOSS · RIFTBORN PROFILE</small>
              <h3>{tier.bossName}</h3>
              <p>
                {BOSS_MECHANICS[selected].telegraph} · 對策：
                {BOSS_MECHANICS[selected].counterplay}
              </p>
              <div>
                {bossVisual.mechanics.map((role) => (
                  <RoleBadge key={role} kind={role} />
                ))}
                <b className="mechanic-pill">
                  {BOSS_MECHANICS[selected].primary}
                </b>
              </div>
            </span>
          </div>
          <div className="tier-rewards">
            <Gem />
            <span>
              <small>{getMaterialData(tier.materialID).displayName}</small>
              <b>
                通關 +{tier.standardReward} · 首通合計 +
                {tier.standardReward * 3} 與地源星核
              </b>
            </span>
            {tier.towerReward && (
              <em>首通解鎖：{getTowerById(tier.towerReward)?.name}</em>
            )}
          </div>
          <section className="loadout-builder">
            <header>
              <div>
                <TowerControl />
                <span>
                  <small>EARTH LOADOUT</small>
                  <b>戰前編成 · 最多 3 種炮塔</b>
                </span>
              </div>
              <em>{save.earthLoadout.length} / 3</em>
            </header>
            <div>
              {owned.map((entry) => {
                const data = getTowerById(entry.towerID),
                  active = save.earthLoadout.includes(entry.towerID);
                return (
                  <button
                    key={entry.towerID}
                    className={active ? 'active' : ''}
                    onClick={() => toggle(entry.towerID)}
                  >
                    <TowerArtwork towerID={entry.towerID} />
                    <i>{active ? <Check /> : <TowerControl />}</i>
                    <span>
                      <b>{data?.name}</b>
                      <small>
                        {data?.rarity} · Lv.{entry.level} · {entry.stars}★
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="build-recommendations">
            <header>
              <Bolt />
              <span>
                <small>BUILD EXAMPLES</small>
                <b>四種可行戰術流派</b>
              </span>
            </header>
            <div>
              {TOWER_SYNERGIES.map((synergy) => {
                const ready = synergy.requiredTowerIDs.every((id) =>
                  save.ownedTowers.some((t) => t.towerID === id),
                );
                return (
                  <article
                    key={synergy.synergyID}
                    className={ready ? 'ready' : ''}
                  >
                    <Zap />
                    <span>
                      <b>{synergy.displayName}</b>
                      <small>{synergy.description}</small>
                    </span>
                    <em>{ready ? 'AVAILABLE' : 'TOWERS LOCKED'}</em>
                  </article>
                );
              })}
            </div>
          </section>
          {feedback && <output className="earth-feedback">{feedback}</output>}
          <div className="earth-entry-actions">
            <button
              className="earth-enter primary-action"
              disabled={!progress.unlocked}
              onClick={enter}
            >
              <Swords />
              進入 {tier.name} 階 25 波試煉
              <ChevronRight />
            </button>
            {RunRewardService.canSweep(save,selected) && (
              <button className="sweep-button" onClick={sweep}>
                <Sparkles />
                快速掃蕩<small>已手動通關</small>
              </button>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}
