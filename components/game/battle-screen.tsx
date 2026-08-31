'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Bolt,
  BrainCircuit,
  CircleDollarSign,
  ChevronRight,
  Crosshair,
  Eye,
  FastForward,
  Gauge,
  HeartPulse,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  TowerControl,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  BossArtwork,
  EnemyArtwork,
  RoleBadge,
  TierBadge,
  TowerArtwork,
} from '@/components/game/visual-ui';
import { BattleEngine, BattleSnapshot } from '@/lib/game/battle-engine';
import { BattleBlessingManager } from '@/lib/game/battle-blessing-manager';
import {
  GOLDEN_TUTORIAL_LOADOUT,
  MapTopology,
  TOWER_SKILLS,
} from '@/lib/game/battle-depth';
import {
  EARTH_TUTORIAL_DUNGEON,
  getEarthDungeon,
} from '@/lib/game/dungeon-data';
import { EarthProgressionService } from '@/lib/game/earth-progression-service';
import { getMaterialData } from '@/lib/game/materials';
import { RewardService } from '@/lib/game/reward-service';
import { getTowerById, STARTER_TOWER_ID } from '@/lib/game/towers';
import { getBattleBranch, getBattleBranches } from '@/lib/game/battle-economy';
import {
  ENEMY_VISUAL_PROFILES,
  getBattleEnvironmentProfile,
} from '@/lib/game/visual-config';
import {
  EarthTierId,
  MaterialReward,
  PlayerSave,
  TargetingMode,
  TowerId,
} from '@/lib/game/types';

interface BattleScreenProps {
  save: PlayerSave;
  debugMode: boolean;
  onBack: () => void;
  onCommitted: (save: PlayerSave, message?: string) => void;
  tierID?: EarthTierId;
  onChangeLoadout?: () => void;
  onUpgrade?: () => void;
}

const SLOT_LAYOUTS: Record<MapTopology, Array<{ x: number; y: number }>> = {
  WINDING: [
    { x: 18, y: 59 },
    { x: 30, y: 82 },
    { x: 43, y: 48 },
    { x: 58, y: 43 },
    { x: 72, y: 48 },
    { x: 84, y: 57 },
    { x: 54, y: 76 },
  ],
  MERGE: [
    { x: 18, y: 32 },
    { x: 18, y: 72 },
    { x: 38, y: 53 },
    { x: 54, y: 42 },
    { x: 69, y: 64 },
    { x: 84, y: 48 },
    { x: 66, y: 25 },
  ],
  PARALLEL: [
    { x: 18, y: 27 },
    { x: 18, y: 73 },
    { x: 40, y: 27 },
    { x: 40, y: 73 },
    { x: 66, y: 38 },
    { x: 82, y: 58 },
    { x: 60, y: 76 },
  ],
  CORE_SIEGE: [
    { x: 23, y: 25 },
    { x: 23, y: 75 },
    { x: 47, y: 20 },
    { x: 47, y: 80 },
    { x: 70, y: 32 },
    { x: 70, y: 68 },
    { x: 87, y: 50 },
  ],
};
function pathPoint(progress: number, topology: MapTopology, branch = 0) {
  const p = Math.max(0, Math.min(1, progress));
  if (topology === 'WINDING') {
    if (p <= 0.25) return { x: 5 + (p / 0.25) * 30, y: 70 };
    if (p <= 0.5) return { x: 35, y: 70 - ((p - 0.25) / 0.25) * 40 };
    if (p <= 0.75) return { x: 35 + ((p - 0.5) / 0.25) * 35, y: 30 };
    return {
      x: 70 + ((p - 0.75) / 0.25) * 23,
      y: 30 + ((p - 0.75) / 0.25) * 35,
    };
  }
  if (topology === 'MERGE') {
    if (p < 0.42) return { x: 4 + (p / 0.42) * 38, y: branch ? 72 : 30 };
    return {
      x: 42 + ((p - 0.42) / 0.58) * 52,
      y: 51 + (branch ? 1 : -1) * Math.max(0, 1 - p) * 18,
    };
  }
  if (topology === 'PARALLEL') {
    if (p < 0.72) return { x: 5 + (p / 0.72) * 65, y: branch ? 68 : 32 };
    return {
      x: 70 + ((p - 0.72) / 0.28) * 24,
      y: (branch ? 68 : 32) + ((p - 0.72) / 0.28) * (branch ? -16 : 20),
    };
  }
  const angle = (branch ? 1 : -1) * (1 - p) * 0.75;
  return { x: 5 + p * 89, y: 50 + Math.sin(angle * 3.14) * 30 };
}
function createBattleSessionID(tierID?: EarthTierId) {
  return `earth-${tierID?.toLowerCase() ?? 'tutorial'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function formatTime(value: number) {
  const minutes = Math.floor(value / 60),
    seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function BattleScreen({
  save,
  debugMode,
  onBack,
  onCommitted,
  tierID,
  onChangeLoadout,
  onUpgrade,
}: BattleScreenProps) {
  const dungeon = tierID ? getEarthDungeon(tierID) : EARTH_TUTORIAL_DUNGEON;
  const loadout = tierID ? save.earthLoadout : GOLDEN_TUTORIAL_LOADOUT;
  const [deployTowerID, setDeployTowerID] = useState<TowerId>(
    loadout[0] ?? STARTER_TOWER_ID,
  );
  const [initialEngine] = useState(() => new BattleEngine(save, dungeon));
  const engineRef = useRef(initialEngine);
  const [snapshot, setSnapshot] = useState<BattleSnapshot>(() =>
    initialEngine.snapshot(),
  );
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [selectedEnemyID, setSelectedEnemyID] = useState<number | null>(null);
  const [battleSessionID, setBattleSessionID] = useState(() =>
    createBattleSessionID(tierID),
  );
  const [rewardMaterials, setRewardMaterials] = useState<MaterialReward[]>([]);
  const [firstClearReward, setFirstClearReward] = useState(false);
  const [unlockedTowerID, setUnlockedTowerID] = useState<TowerId | null>(null);
  const [rewardError, setRewardError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showBuild, setShowBuild] = useState(false);
  const [branchChoice, setBranchChoice] = useState<{
    runtimeId: number;
    level: 3 | 5;
  } | null>(null);
  const resultCommitted = useRef(false);
  const historyRecorded = useRef(false);
  const sync = useCallback(() => setSnapshot(engineRef.current.snapshot()), []);
  useEffect(() => {
    let frame = 0,
      previous = performance.now();
    const run = (now: number) => {
      engineRef.current.tick((now - previous) / 1000);
      previous = now;
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
      const result = tierID
        ? EarthProgressionService.commitVictory(save, tierID, battleSessionID)
        : RewardService.commitTutorialVictory(save, battleSessionID);
      if (!result.ok) {
        setRewardError(result.message);
        return;
      }
      setRewardMaterials(result.reward.materials);
      setFirstClearReward(result.reward.firstClear);
      if ('towerGranted' in result.reward)
        setUnlockedTowerID(
          (result.reward.towerGranted as TowerId | null) ?? null,
        );
      onCommitted(
        result.save,
        result.reward.firstClear
          ? `${tierID ?? '新手'}首通獎勵與解鎖已永久保存`
          : '重複通關素材已永久保存',
      );
    }, 0);
    return () => window.clearTimeout(commit);
  }, [snapshot.state, save, battleSessionID, onCommitted, tierID]);
  useEffect(() => {
    if (
      !['VICTORY', 'DEFEAT'].includes(snapshot.state) ||
      historyRecorded.current
    )
      return;
    historyRecorded.current = true;
    try {
      const key = 'rng-isekai-tower-run-history',
        history = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[],
        entry = {
          at: new Date().toISOString(),
          tier: tierID ?? 'TUTORIAL',
          wave: snapshot.wave,
          result: snapshot.state,
          blessings: snapshot.activeBlessings.map(
            BattleBlessingManager.displayName.bind(BattleBlessingManager),
          ),
          synergies: snapshot.activeSynergies.map((s) => s.displayName),
          metrics: snapshot.metrics,
        };
      localStorage.setItem(
        key,
        JSON.stringify([entry, ...history].slice(0, 5)),
      );
    } catch {
      /* Optional local history must never block results. */
    }
  }, [
    snapshot.state,
    snapshot.wave,
    snapshot.activeBlessings,
    snapshot.activeSynergies,
    snapshot.metrics,
    tierID,
  ]);
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  const act = (action: () => { ok: boolean; error?: string }) => {
    const result = action();
    sync();
    setFeedback(result.ok ? '指令已執行' : (result.error ?? '指令無效'));
  };
  const deploy = (slot: number) => {
    const result = engineRef.current.deploy(slot, deployTowerID);
    sync();
    if (result.ok) {
      setSelectedTower(
        engineRef.current.snapshot().deployed.find((t) => t.slot === slot)
          ?.runtimeId ?? null,
      );
      setFeedback(`部署完成 · -${result.spent} Gold`);
    } else setFeedback(result.error);
  };
  const upgradeSelected = () => {
    if (!selected) return;
    const nextLevel = selected.battleLevel + 1;
    if (nextLevel === 3 || nextLevel === 5) {
      setBranchChoice({ runtimeId: selected.runtimeId, level: nextLevel });
      return;
    }
    const result = engineRef.current.upgradeTower(selected.runtimeId);
    sync();
    setFeedback(
      result.ok
        ? `Battle Lv.${result.battleLevel} · -${result.spent} Gold`
        : result.error,
    );
  };
  const restart = () => {
    engineRef.current = new BattleEngine(save, dungeon);
    resultCommitted.current = false;
    historyRecorded.current = false;
    setBattleSessionID(createBattleSessionID(tierID));
    setRewardMaterials([]);
    setFirstClearReward(false);
    setUnlockedTowerID(null);
    setSelectedEnemyID(null);
    setRewardError('');
    setSelectedTower(null);
    setBranchChoice(null);
    setShowBuild(false);
    sync();
  };
  const selected =
      snapshot.deployed.find((t) => t.runtimeId === selectedTower) ?? null,
    selectedEnemy =
      snapshot.enemies.find((e) => e.runtimeId === selectedEnemyID) ?? null,
    activeBoss = snapshot.enemies.find((e) => e.boss) ?? null,
    terminal = snapshot.state === 'VICTORY' || snapshot.state === 'DEFEAT',
    slots = SLOT_LAYOUTS[snapshot.mapTopology].slice(0, snapshot.slotCapacity),
    selectedSkill = selected ? TOWER_SKILLS[selected.towerId] : null,
    anyOverdrive = snapshot.deployed.some((t) => t.overdriveRemaining > 0),
    environment = getBattleEnvironmentProfile(tierID ?? null),
    sovereignPhase = tierID === 'SOVEREIGN' ? (activeBoss?.phase ?? 1) : 0,
    selectedBuildCost = snapshot.buildCosts[deployTowerID] ?? 0,
    branchTower = branchChoice
      ? (snapshot.deployed.find(
          (tower) => tower.runtimeId === branchChoice.runtimeId,
        ) ?? null)
      : null,
    branchOptions =
      branchChoice && branchTower
        ? getBattleBranches(branchTower.towerId, branchChoice.level)
        : [];
  return (
    <section
      className={`battle-screen phase-screen tactical-battle topology-${snapshot.mapTopology.toLowerCase()} environment-${environment.family.toLowerCase()} ${activeBoss ? 'boss-atmosphere' : ''} sovereign-phase-${sovereignPhase} ${anyOverdrive ? 'overdrive-active' : ''}`}
      aria-label={`25 波${dungeon.name}`}
    >
      <header className="battle-hud">
        <button className="hud-back" onClick={onBack}>
          <ArrowLeft />
          離開
        </button>
        <div className="wave-readout">
          <small>WAVE</small>
          <b>{String(snapshot.wave).padStart(2, '0')}</b>
          <span>/ 25</span>
        </div>
        <div className="battle-title">
          <p>
            {dungeon.id} · {snapshot.mapTopology}
          </p>
          <h1>{dungeon.name}</h1>
          <span>{snapshot.notice}</span>
        </div>
        <div className="base-health">
          <HeartPulse />
          <span>
            <small>BASE CORE</small>
            <b>
              {snapshot.baseHP} / {snapshot.maxBaseHP}
            </b>
          </span>
          <i>
            <em
              style={{
                width: `${(snapshot.baseHP / snapshot.maxBaseHP) * 100}%`,
              }}
            />
          </i>
        </div>
        <div className="battle-gold" aria-label="本場戰鬥 Gold">
          <CircleDollarSign />
          <span>
            <small>BATTLE GOLD</small>
            <b>{snapshot.battleGold.toLocaleString()}</b>
          </span>
          {snapshot.goldEvent && (
            <em key={snapshot.goldEvent.serial}>
              {snapshot.goldEvent.amount > 0 ? '+' : ''}
              {snapshot.goldEvent.amount}
            </em>
          )}
        </div>
        <button
          onClick={() => {
            engineRef.current.togglePause();
            sync();
          }}
          aria-label="暫停或繼續"
        >
          {snapshot.paused ? <Play /> : <Pause />}
        </button>
        <button
          onClick={() => {
            engineRef.current.toggleSpeed();
            sync();
          }}
        >
          <FastForward />
          {snapshot.speed}×
        </button>
      </header>
      <div className="battlefield">
        <div
          className="battle-environment"
          style={{
            backgroundImage: `url('${environment.background}')`,
            backgroundPosition: environment.backgroundPosition,
          }}
          aria-hidden="true"
        />
        <div className="environment-atmosphere" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="map-grid" aria-hidden="true" />
        <div
          className={`battle-path path-${snapshot.mapTopology.toLowerCase()}`}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="spawn-gate">
          <span>SPAWN</span>
        </div>
        <div className="core-gate">
          <Shield />
          <span>CORE</span>
        </div>
        {activeBoss && (
          <section
            className={`boss-hud ${tierID === 'SOVEREIGN' ? 'sovereign' : ''}`}
          >
            <BossArtwork tier={tierID ?? 'NORMAL'} />
            <div>
              <header>
                <span>{tierID ?? 'GOLDEN'} BOSS</span>
                <b>{activeBoss.name}</b>
                <em>PHASE {activeBoss.phase}</em>
              </header>
              <i>
                <em
                  style={{
                    width: `${(activeBoss.hp / activeBoss.maxHP) * 100}%`,
                  }}
                />
              </i>
              <footer>
                {activeBoss.statuses.slice(0, 5).map((status) => (
                  <span
                    className={`mechanic-pill status-${status.toLowerCase()}`}
                    key={status}
                  >
                    {status}
                  </span>
                ))}
              </footer>
              {snapshot.bossTelegraph && (
                <p className="boss-telegraph">
                  <Activity />
                  {snapshot.bossTelegraph}
                </p>
              )}
            </div>
          </section>
        )}
        {slots.map((point, slot) => {
          const tower = snapshot.deployed.find((item) => item.slot === slot);
          return (
            <button
              key={slot}
              className={`deploy-slot ${tower ? 'occupied' : 'deployment-node'} ${!tower && snapshot.battleGold >= selectedBuildCost ? 'affordable' : ''} ${!tower && snapshot.battleGold < selectedBuildCost ? 'unaffordable' : ''} ${tower?.runtimeId === selectedTower ? 'selected' : ''} ${tower?.fortifyLevel ? `fortified fortify-${tower.fortifyLevel}` : ''} ${tower?.overdriveRemaining ? 'tower-overdrive' : ''}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() =>
                tower ? setSelectedTower(tower.runtimeId) : deploy(slot)
              }
            >
              {tower ? (
                <>
                  <TowerArtwork
                    towerID={tower.towerId}
                    stars={tower.permanentStars}
                    battleLevel={tower.battleLevel}
                    branchLv3={tower.branchLv3}
                    branchLv5={tower.branchLv5}
                    overdrive={tower.overdriveRemaining > 0}
                    spawning={tower.spawnEffectRemaining > 0}
                  />
                  {tower.fortifyLevel > 0 && (
                    <i className="fortify-mark">
                      <ShieldCheck />
                      固守 {tower.fortifyLevel}
                    </i>
                  )}
                  <small>SLOT {slot + 1}</small>
                </>
              ) : (
                <>
                  <i className="node-circuit" />
                  <TowerControl />
                  <small>
                    {snapshot.battleGold >= selectedBuildCost
                      ? 'DEPLOY'
                      : 'NO GOLD'}
                  </small>
                </>
              )}
            </button>
          );
        })}
        {snapshot.enemies.map((enemy) => {
          const point = pathPoint(
              enemy.progress,
              snapshot.mapTopology,
              enemy.runtimeId % 2,
            ),
            profile = ENEMY_VISUAL_PROFILES[enemy.enemyId],
            shieldState =
              enemy.maxShieldHP <= 0
                ? ''
                : enemy.shieldHP / enemy.maxShieldHP > 0.5
                  ? 'shield-full'
                  : enemy.shieldHP > 0
                    ? 'shield-damaged'
                    : 'shield-broken';
          return (
            <button
              key={enemy.runtimeId}
              className={`enemy-token ${enemy.boss ? 'boss' : ''} ${enemy.enemyId.toLowerCase()} ${shieldState} role-${profile.role.toLowerCase()} phase-${enemy.phase} ${enemy.statuses.map((s) => `has-${s.toLowerCase()}`).join(' ')}`}
              style={
                {
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  '--enemy-scale': enemy.visualScale,
                } as React.CSSProperties
              }
              title={`${enemy.name} ${Math.ceil(enemy.hp)}/${Math.ceil(enemy.maxHP)}`}
              onClick={() => setSelectedEnemyID(enemy.runtimeId)}
            >
              <i className="enemy-hp">
                <em style={{ width: `${(enemy.hp / enemy.maxHP) * 100}%` }} />
              </i>
              {enemy.maxShieldHP > 0 && (
                <i className="enemy-shield">
                  <em
                    style={{
                      width: `${(enemy.shieldHP / enemy.maxShieldHP) * 100}%`,
                    }}
                  />
                </i>
              )}
              {enemy.boss && tierID ? (
                <BossArtwork tier={tierID} />
              ) : (
                <EnemyArtwork enemyID={enemy.enemyId} />
              )}
              <span className="enemy-role-mark">
                {profile.role.slice(0, 1)}
              </span>
            </button>
          );
        })}
        {snapshot.projectiles.map((projectile) => {
          const point = slots[projectile.fromSlot];
          return (
            <i
              key={projectile.runtimeId}
              className={`projectile vfx-${projectile.towerId.toLowerCase()} pattern-${projectile.attackPattern.toLowerCase()} ${projectile.skillPierce ? 'piercing' : ''}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            />
          );
        })}
        {(snapshot.state === 'BOSS_WARNING' ||
          snapshot.state === 'WAVE_STARTING') && (
          <div
            className={`wave-banner ${snapshot.state === 'BOSS_WARNING' ? 'danger boss-intro' : ''}`}
          >
            {snapshot.state === 'BOSS_WARNING' && (
              <BossArtwork tier={tierID ?? 'NORMAL'} />
            )}
            <small>{snapshot.state}</small>
            <b>
              {snapshot.state === 'BOSS_WARNING'
                ? dungeon.bossName
                : `WAVE ${String(snapshot.wave).padStart(2, '0')}`}
            </b>
            {snapshot.state === 'BOSS_WARNING' && (
              <span>
                {tierID ?? 'GOLDEN TEST'} · {dungeon.bossTrait}
              </span>
            )}
          </div>
        )}
        {selectedEnemy && (
          <aside className="enemy-info-panel">
            <button
              aria-label="關閉敵人資訊"
              onClick={() => setSelectedEnemyID(null)}
            >
              ×
            </button>
            {selectedEnemy.boss ? (
              <BossArtwork tier={tierID ?? 'NORMAL'} />
            ) : (
              <EnemyArtwork enemyID={selectedEnemy.enemyId} />
            )}
            <div>
              <small>RIFTBORN ANALYSIS · {tierID ?? 'GOLDEN'}</small>
              <h3>{selectedEnemy.name}</h3>
              <RoleBadge
                kind={ENEMY_VISUAL_PROFILES[selectedEnemy.enemyId].role}
              />
              <div className="enemy-status-row">
                {selectedEnemy.statuses.map((status) => (
                  <b key={status}>{status}</b>
                ))}
              </div>
              <dl>
                <span>
                  <dt>HP</dt>
                  <dd>
                    {Math.ceil(selectedEnemy.hp).toLocaleString()} /{' '}
                    {Math.ceil(selectedEnemy.maxHP).toLocaleString()}
                  </dd>
                </span>
                <span>
                  <dt>DEF</dt>
                  <dd>{Math.round(selectedEnemy.defense)}</dd>
                </span>
                <span>
                  <dt>SPEED</dt>
                  <dd>{selectedEnemy.speed.toFixed(3)}</dd>
                </span>
              </dl>
              <p>
                <Eye />
                對策：
                {selectedEnemy.statuses.includes('VULNERABLE')
                  ? '現在使用穿甲技能與 Overdrive'
                  : selectedEnemy.shieldHP > 0
                    ? '維持火力先破盾'
                    : selectedEnemy.regenerationPercent > 0
                      ? '避免輸出中斷'
                      : selectedEnemy.defense > 100
                        ? '使用貫穿攻擊'
                        : '依路徑優先處理'}
              </p>
            </div>
          </aside>
        )}
      </div>
      <aside className="deployment-panel tactical-panel">
        <p>
          <TowerControl />
          DEPLOYMENT · {snapshot.deployed.length} / {snapshot.slotCapacity}
          <em>{snapshot.mapTopology}</em>
        </p>
        {loadout.map((id) => {
          const tower = getTowerById(id),
            owned = save.ownedTowers.find((e) => e.towerID === id);
          return (
            <button
              key={id}
              className={`tower-chip ${deployTowerID === id ? 'active' : ''}`}
              onClick={() => setDeployTowerID(id)}
              disabled={
                snapshot.deployed.length >= snapshot.slotCapacity ||
                snapshot.battleGold < (snapshot.buildCosts[id] ?? 0)
              }
            >
              <TowerArtwork towerID={id} stars={owned?.stars ?? 1} />
              <span>
                <b>{tower?.name}</b>
                <small>
                  {tierID ? tower?.rarity : 'TRAINING'} · Lv.{owned?.level ?? 1}{' '}
                  · {owned?.stars ?? 1}★
                </small>
              </span>
              <em>
                <CircleDollarSign /> {snapshot.buildCosts[id] ?? 0}
              </em>
            </button>
          );
        })}
        {selected && selectedSkill ? (
          <div className="selected-tower tactical-tower">
            <header>
              <span>
                <Crosshair />
                TOWER #{selected.runtimeId}
              </span>
              <b>{getTowerById(selected.towerId)?.name}</b>
              <button
                onClick={() => {
                  const result = engineRef.current.sellTower(
                    selected.runtimeId,
                  );
                  if (result.ok) {
                    setSelectedTower(null);
                    setFeedback(`出售完成 · +${result.refund} Gold`);
                  } else setFeedback(result.error);
                  sync();
                }}
              >
                出售 +{Math.floor(selected.investedGold * 0.7)}
              </button>
            </header>
            <div>
              <span>
                ATK <b>{Math.round(selected.stats.attack)}</b>
              </span>
              <span>
                SPD <b>{selected.stats.attackSpeed.toFixed(2)}</b>
              </span>
              <span>
                BATTLE LV <b>{selected.battleLevel}/5</b>
              </span>
            </div>
            <section className="tower-growth-panel">
              <div>
                <small>PERMANENT BUILD</small>
                <b>
                  Lv.{selected.permanentLevel} · {selected.permanentStars}★
                </b>
                <span>
                  {getBattleBranch(selected.towerId, selected.branchLv3)
                    ?.displayName ?? 'Lv.3 分支未選'}
                  {' · '}
                  {getBattleBranch(selected.towerId, selected.branchLv5)
                    ?.displayName ?? 'Lv.5 分支未選'}
                </span>
              </div>
              <button
                className="battle-upgrade-button"
                disabled={
                  selected.battleLevel >= 5 ||
                  snapshot.battleGold < selected.nextUpgradeCost
                }
                onClick={upgradeSelected}
              >
                <Wrench />
                <span>
                  <small>
                    {selected.battleLevel >= 5
                      ? 'MAX BATTLE LEVEL'
                      : `UPGRADE TO LV.${selected.battleLevel + 1}`}
                  </small>
                  <b>
                    {selected.battleLevel >= 5
                      ? '完成'
                      : `${selected.nextUpgradeCost} Gold`}
                  </b>
                </span>
              </button>
            </section>
            <button
              className={`tower-skill-button ${selected.skillActiveRemaining > 0 ? 'active' : ''}`}
              disabled={
                selected.skillCooldown > 0 ||
                snapshot.state === 'BLESSING_CHOICE'
              }
              onClick={() =>
                act(() =>
                  engineRef.current.activateTowerSkill(selected.runtimeId),
                )
              }
            >
              <Zap />
              <span>
                <small>ACTIVE SKILL</small>
                <b>{selectedSkill.displayName}</b>
                <em>
                  {selected.skillActiveRemaining > 0
                    ? 'ACTIVE'
                    : selected.skillCooldown > 0
                      ? `${selected.skillCooldown.toFixed(1)}s`
                      : 'READY'}
                </em>
              </span>
            </button>
            <label>
              鎖定方式
              <select
                value={selected.targetingMode}
                onChange={(event) => {
                  engineRef.current.setTargeting(
                    selected.runtimeId,
                    event.target.value as TargetingMode,
                  );
                  sync();
                }}
              >
                <option value="FIRST">FIRST · 路徑最前</option>
                <option value="NEAREST">NEAREST · 物理最近</option>
                <option value="STRONGEST">STRONGEST · 最高生命</option>
                <option value="WEAKEST">LOWEST HP · 最低生命</option>
              </select>
            </label>
          </div>
        ) : (
          <p className="deployment-help">
            選擇部署塔可使用主動技能；塔在同一位置 20 秒後啟動「固守」。
          </p>
        )}
      </aside>
      <footer className="battle-controls tactical-controls">
        <div
          className={`overdrive-console ${snapshot.overdriveReady ? 'ready' : ''}`}
        >
          <header>
            <Gauge />
            <span>
              <small>SHARED OVERDRIVE</small>
              <b>{Math.floor(snapshot.overdriveEnergy)} / 100</b>
            </span>
          </header>
          <i>
            <em style={{ width: `${snapshot.overdriveEnergy}%` }} />
          </i>
        </div>
        <button
          className="overdrive-button"
          disabled={!snapshot.overdriveReady || !selected}
          onClick={() =>
            selected &&
            act(() => engineRef.current.activateOverdrive(selected.runtimeId))
          }
        >
          <Bolt />
          OVERDRIVE<small>{selected ? 'SELECTED TOWER' : 'SELECT TOWER'}</small>
        </button>
        <button
          className={`career-skill-button ${snapshot.careerSkillRemaining > 0 ? 'active' : ''}`}
          disabled={snapshot.careerSkillCooldown > 0}
          onClick={() => act(() => engineRef.current.activateCareerSkill())}
        >
          <ShieldCheck />
          <span>
            <b>絕對防線</b>
            <small>
              {snapshot.careerSkillRemaining > 0
                ? 'ACTIVE'
                : snapshot.careerSkillCooldown > 0
                  ? `${snapshot.careerSkillCooldown.toFixed(0)}s`
                  : 'READY'}
            </small>
          </span>
        </button>
        <button
          className="build-chip"
          onClick={() => setShowBuild((value) => !value)}
        >
          <BrainCircuit />
          <span>
            <b>RUN BUILD</b>
            <small>
              {snapshot.activeBlessings.length} BLESSINGS ·{' '}
              {snapshot.activeSynergies.length} SYNERGIES
            </small>
          </span>
        </button>
        {snapshot.state === 'READY' || snapshot.state === 'SETUP' ? (
          <button
            className="primary-action"
            onClick={() => act(() => engineRef.current.start())}
          >
            <Play />
            開始 25 波戰鬥
          </button>
        ) : snapshot.state === 'INTERMISSION' ? (
          <button
            className="primary-action next-wave"
            onClick={() => {
              engineRef.current.callNextWave();
              sync();
            }}
          >
            <ChevronRight />
            提前迎戰<small>+5 OD</small>
          </button>
        ) : null}
      </footer>
      {showBuild && (
        <aside className="run-build-panel">
          <header>
            <BrainCircuit />
            <span>
              <small>RUN BUILD</small>
              <b>本場戰鬥構築</b>
            </span>
            <button onClick={() => setShowBuild(false)}>×</button>
          </header>
          <section>
            <small>ACTIVE BLESSINGS</small>
            {snapshot.activeBlessings.length ? (
              snapshot.activeBlessings.map((item) => (
                <p key={item.blessingID}>
                  <Sparkles />
                  <b>{BattleBlessingManager.displayName(item)}</b>
                  <span>Lv.{item.stacks}</span>
                </p>
              ))
            ) : (
              <em>尚未取得祝福</em>
            )}
          </section>
          <section>
            <small>ACTIVE SYNERGIES</small>
            {snapshot.activeSynergies.length ? (
              snapshot.activeSynergies.map((item) => (
                <p key={item.synergyID}>
                  <Bolt />
                  <b>{item.displayName}</b>
                  <span>{item.specialEffect}</span>
                </p>
              ))
            ) : (
              <em>部署相容炮塔以啟動協同</em>
            )}
          </section>
          <footer>
            {snapshot.modifierStack.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </footer>
        </aside>
      )}
      {snapshot.state === 'BLESSING_CHOICE' && (
        <section className="blessing-overlay">
          <div>
            <header>
              <Sparkles />
              <span>
                <small>WAVE {snapshot.wave} BOSS CLEAR</small>
                <h2>選擇戰鬥祝福</h2>
                <p>一項支援流派、一項通用能力、一項改變玩法的選擇。</p>
              </span>
            </header>
            <div className="blessing-options">
              {snapshot.blessingOptions.map((option) => {
                const active = snapshot.activeBlessings.find(
                    (item) => item.blessingID === option.blessingID,
                  ),
                  upgrade = Boolean(active);
                return (
                  <button
                    key={option.blessingID}
                    className={`blessing-card rarity-${option.rarity.toLowerCase()} ${option.classification.toLowerCase()}`}
                    onClick={() =>
                      act(() =>
                        engineRef.current.chooseBlessing(option.blessingID),
                      )
                    }
                  >
                    <em>
                      {upgrade ? 'UPGRADE' : 'NEW'} · {option.rarity}
                    </em>
                    <Sparkles />
                    <h3>
                      {upgrade
                        ? (option.evolutionNames?.[active!.stacks] ??
                          option.displayName)
                        : option.displayName}
                    </h3>
                    <p>{option.description}</p>
                    <div>
                      {option.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    {option.risk && <small>TRADE-OFF · {option.risk}</small>}
                    <b>
                      {upgrade
                        ? `Lv.${active!.stacks} → Lv.${active!.stacks + 1}`
                        : 'SELECT BLESSING'}
                    </b>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {branchChoice && branchTower && (
        <section className="branch-choice-overlay">
          <div>
            <header>
              <Wrench />
              <span>
                <small>BATTLE LV.{branchChoice.level} BRANCH</small>
                <h2>{getTowerById(branchTower.towerId)?.name} 戰鬥進化</h2>
                <p>本次選擇只在這場戰鬥生效，重新挑戰後會重置。</p>
              </span>
              <button onClick={() => setBranchChoice(null)}>×</button>
            </header>
            <div>
              {branchOptions.map((option, index) => (
                <button
                  key={option.branchID}
                  className={`branch-card branch-${index === 0 ? 'a' : 'b'}`}
                  onClick={() => {
                    const result = engineRef.current.upgradeTower(
                      branchTower.runtimeId,
                      option.branchID,
                    );
                    sync();
                    if (result.ok) {
                      setBranchChoice(null);
                      setFeedback(
                        `${option.displayName} · Battle Lv.${result.battleLevel} · -${result.spent} Gold`,
                      );
                    } else setFeedback(result.error);
                  }}
                >
                  <TowerArtwork
                    towerID={branchTower.towerId}
                    stars={branchTower.permanentStars}
                    battleLevel={branchChoice.level}
                    branchLv3={
                      branchChoice.level === 3
                        ? option.branchID
                        : branchTower.branchLv3
                    }
                    branchLv5={
                      branchChoice.level === 5 ? option.branchID : null
                    }
                  />
                  <small>ROUTE {index === 0 ? 'A' : 'B'}</small>
                  <h3>{option.displayName}</h3>
                  <p>{option.description}</p>
                  <b>{branchTower.nextUpgradeCost} Gold</b>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      {feedback && <output className="battle-feedback">{feedback}</output>}
      {debugMode && (
        <aside className="battle-debug phase7-debug">
          <p>DEV · PHASE 7.7</p>
          <div>
            {[1, 5, 10, 15, 20, 25].map((wave) => (
              <button
                key={wave}
                onClick={() => {
                  engineRef.current.debugJump(wave);
                  sync();
                }}
              >
                W{wave}
              </button>
            ))}
            <button
              onClick={() => {
                engineRef.current.debugAddGold();
                sync();
              }}
            >
              +1000 GOLD
            </button>
            <button
              onClick={() => {
                engineRef.current.debugKillAll();
                sync();
              }}
            >
              KILL ALL
            </button>
            <button
              onClick={() => {
                engineRef.current.debugFillOverdrive();
                sync();
              }}
            >
              FILL OD
            </button>
            <button
              onClick={() => {
                engineRef.current.debugResetOverdrive();
                sync();
              }}
            >
              RESET OD
            </button>
            <button
              onClick={() => {
                engineRef.current.debugResetSkills();
                sync();
              }}
            >
              RESET SKILLS
            </button>
            <button
              onClick={() => {
                engineRef.current.debugOpenBlessing();
                sync();
              }}
            >
              BLESSING
            </button>
            <button
              onClick={() => {
                engineRef.current.debugBossShield();
                sync();
              }}
            >
              BOSS SHIELD
            </button>
            <button
              onClick={() => {
                engineRef.current.debugBossVulnerable();
                sync();
              }}
            >
              VULNERABLE
            </button>
            <button
              onClick={() => {
                engineRef.current.debugSpawnSupport();
                sync();
              }}
            >
              SUPPORT
            </button>
            <button
              onClick={() => {
                engineRef.current.debugForceVictory();
                sync();
              }}
            >
              VICTORY
            </button>
            <button
              onClick={() => {
                engineRef.current.debugForceDefeat();
                sync();
              }}
            >
              DEFEAT
            </button>
          </div>
          <small>SEED · {snapshot.sessionSeed}</small>
        </aside>
      )}
      {terminal && (
        <div
          className={`battle-result tactical-result ${snapshot.state === 'VICTORY' ? 'victory' : 'defeat'}`}
        >
          <div>
            <Sparkles />
            <small>
              {snapshot.state === 'VICTORY'
                ? `${tierID ?? 'GOLDEN'} COMPLETE`
                : 'TACTICAL ANALYSIS'}
            </small>
            <h2>
              {snapshot.state === 'VICTORY'
                ? `${dungeon.name}完成`
                : '防衛失敗'}
            </h2>
            <p>
              {snapshot.state === 'VICTORY'
                ? rewardError ||
                  (firstClearReward
                    ? '首通獎勵、下一階與新炮塔已永久保存。'
                    : '重複通關素材已永久保存。')
                : snapshot.defeatHint}
            </p>
            {unlockedTowerID && (
              <section className="tower-unlock-reveal">
                <TowerArtwork towerID={unlockedTowerID} />
                <span>
                  <small>NEW TOWER AWAKENED</small>
                  <b>{getTowerById(unlockedTowerID)?.name}</b>
                  <TierBadge
                    tier={getTowerById(unlockedTowerID)?.tierID ?? 'NORMAL'}
                  />
                </span>
              </section>
            )}
            {snapshot.state === 'VICTORY' && rewardMaterials.length > 0 && (
              <div className="reward-list">
                {rewardMaterials.map((reward, index) => (
                  <span key={`${reward.materialID}-${index}`}>
                    <small>{getMaterialData(reward.materialID).rarity}</small>
                    <b>{getMaterialData(reward.materialID).displayName}</b>
                    <em>+{reward.amount}</em>
                  </span>
                ))}
              </div>
            )}
            <section className="result-build-summary">
              <header>
                <BrainCircuit />
                RUN BUILD
              </header>
              <div>
                <span>
                  <small>BLESSINGS</small>
                  <b>
                    {snapshot.activeBlessings.length
                      ? snapshot.activeBlessings
                          .map(
                            BattleBlessingManager.displayName.bind(
                              BattleBlessingManager,
                            ),
                          )
                          .join(' · ')
                      : 'NONE'}
                  </b>
                </span>
                <span>
                  <small>SYNERGIES</small>
                  <b>
                    {snapshot.activeSynergies.length
                      ? snapshot.activeSynergies
                          .map((s) => s.displayName)
                          .join(' · ')
                      : 'NONE'}
                  </b>
                </span>
              </div>
            </section>
            <div className="result-stats">
              <span>
                WAVE <b>{snapshot.wave}</b>
              </span>
              <span>
                TIME <b>{formatTime(snapshot.metrics.runDuration)}</b>
              </span>
              <span>
                SKILLS <b>{snapshot.metrics.skillUses}</b>
              </span>
              <span>
                GOLD + / -{' '}
                <b>
                  {snapshot.metrics.goldEarned} / {snapshot.metrics.goldSpent}
                </b>
              </span>
              <span>
                BUILD / UP{' '}
                <b>
                  {snapshot.metrics.buildPurchases} /{' '}
                  {snapshot.metrics.upgradePurchases}
                </b>
              </span>
              <span>
                OVERDRIVE <b>{snapshot.metrics.overdriveUses}</b>
              </span>
              <span>
                DECISION{' '}
                <b>{snapshot.metrics.averageDecisionInterval.toFixed(1)}s</b>
              </span>
            </div>
            <div className="result-actions one-more-run">
              <button className="primary-action" onClick={restart}>
                <RotateCcw />
                QUICK RETRY
              </button>
              <button onClick={onChangeLoadout ?? onBack}>
                <TowerControl />
                CHANGE LOADOUT
              </button>
              <button onClick={onUpgrade ?? onBack}>
                <TrendingUp />
                UPGRADE
              </button>
              <button onClick={onBack}>
                <ArrowLeft />
                返回
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
