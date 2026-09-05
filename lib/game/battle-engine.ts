import { calculateTowerStats } from './tower-stats';
import { getOwnedTower, getTowerById, STARTER_TOWER_ID } from './towers';
import {
  DamageSnapshot,
  makeDamageSnapshot,
  resolveDamage,
} from './combat';
import {
  DungeonConfig,
  EARTH_TUTORIAL_DUNGEON,
  ENEMY_CATALOG,
} from './dungeon-data';
import {
  BattleState,
  EnemyId,
  FinalTowerStats,
  PlayerSave,
  TargetingMode,
  TowerId,
} from './types';
import {
  ActiveBattleBlessing,
  BATTLE_BLESSINGS,
  BOSS_MECHANICS,
  BattleBlessingData,
  BlessingModifiers,
  BossMechanic,
  GOLDEN_TUTORIAL_LOADOUT,
  MAP_TOPOLOGY_BY_TIER,
  MapTopology,
  TOWER_AFFINITIES,
  TOWER_SKILLS,
  TowerSkillData,
  TowerSynergyData,
} from './battle-depth';
import { BattleBlessingManager } from './battle-blessing-manager';
import { SynergyManager } from './synergy-manager';
import {
  BATTLE_LEVEL_MULTIPLIERS,
  BattleUpgradeModifiers,
  battleBuildCost,
  battleUpgradeCost,
  getBattleBranch,
  getBattleBranches,
} from './battle-economy';
import {
  DAMAGE_AGGREGATION_WINDOW,
  HitFeedbackKind,
  MAX_WORLD_FEEDBACK_ITEMS,
  TOWER_ATTACK_PROFILES,
  interpolateHeading,
  sampleBattlePath,
} from './battle-readability';
import { SLOT_LAYOUTS, pointDistance, towerRangeRadius, onShotLine } from './battle-geometry';

type EnemyStatus = BossMechanic | 'SHOCKED';
export interface EnemyRuntime {
  runtimeId: number;
  enemyId: EnemyId;
  name: string;
  hp: number;
  maxHP: number;
  shieldHP: number;
  maxShieldHP: number;
  defense: number;
  baseDefense: number;
  speed: number;
  actualSpeed: number;
  baseSpeed: number;
  baseDamage: number;
  progress: number;
  pathBranch: number;
  pathX: number;
  pathY: number;
  heading: number;
  targetWaypoint: number;
  spawnEffectRemaining: number;
  boss: boolean;
  elite: boolean;
  regenerationPercent: number;
  supportAura: number;
  phase: number;
  role: string;
  visualScale: number;
  animationProfile: string;
  tierVisualVariant: string;
  statuses: EnemyStatus[];
  triggered: string[];
  mechanicTimer: number;
  vulnerableRemaining: number;
  damageReduction: number;
  battleGoldReward: number;
  state: 'ALIVE' | 'DYING' | 'DEAD';
}
export interface TowerRuntime {
  focusTime: number;
  runtimeId: number;
  towerId: TowerId;
  slot: number;
  progress: number;
  baseStats: FinalTowerStats;
  stats: FinalTowerStats;
  cooldown: number;
  targetId: number | null;
  targetingMode: TargetingMode;
  shots: number;
  skillCooldown: number;
  skillActiveRemaining: number;
  overdriveRemaining: number;
  empoweredShots: number;
  stationaryTime: number;
  fortifyLevel: number;
  damageDealt: number;
  permanentLevel: number;
  permanentStars: number;
  battleLevel: number;
  branchLv3: string | null;
  branchLv5: string | null;
  investedGold: number;
  nextUpgradeCost: number;
  spawnEffectRemaining: number;
}
export interface ProjectileRuntime {
  runtimeId: number;
  fromSlot: number;
  sourceTowerId: number;
  targetId: number;
  remaining: number;
  snapshot: DamageSnapshot;
  attackPattern: 'SINGLE' | 'AOE' | 'CHAIN';
  maxTargets: number;
  bossDamageMultiplier: number;
  skillPierce: boolean;
  towerId: TowerId;
  attackVFXID: string;
  duration: number;
  chargeDuration: number;
  attackClass: string;
  impact: HitFeedbackKind;
  soundHook: string;
  cameraShake: number;
  sequenceIndex: number;
}
export interface BattleImpactRuntime {
  runtimeId: number;
  targetId: number;
  towerId: TowerId;
  kind: HitFeedbackKind;
  x: number;
  y: number;
  critical: boolean;
  vulnerable: boolean;
  shielded: boolean;
  remaining: number;
  duration: number;
}
export interface DamageNumberRuntime {
  runtimeId: number;
  targetId: number;
  towerId: TowerId;
  x: number;
  y: number;
  amount: number;
  hitCount: number;
  critical: boolean;
  vulnerable: boolean;
  shielded: boolean;
  missed: boolean;
  offsetX: number;
  remaining: number;
  duration: number;
  mergeRemaining: number;
}
interface SpawnEntry {
  enemyId: EnemyId;
  delay: number;
}
export interface BattleMetrics {
  waveReached: number;
  averageTowerCount: number;
  averageBattleLevel: number;
  towerUsage: Partial<Record<TowerId,number>>;
  upgradesByTower: Partial<Record<TowerId,number>>;
  branchSelections: string[];
  synergyActivations: string[];
  bossPhaseDeaths: Record<string,number>;
  leaksByRole: Record<string,number>;
  towersUsed: {towerId:TowerId;level:number;branches:string[];investedGold:number;sold:boolean}[];
  runDuration: number;
  averageDecisionInterval: number;
  skillUses: number;
  careerSkillUses: number;
  overdriveUses: number;
  blessingSelections: number;
  baseDamageTaken: number;
  retryCount: number;
  damageByTower: Partial<Record<TowerId, number>>;
  goldEarned: number;
  goldSpent: number;
  buildPurchases: number;
  upgradePurchases: number;
  sellCount: number;
  economyByWave: Partial<
    Record<
      number,
      { gold: number; earned:number; spent:number; towerCount: number; averageBattleLevel: number }
    >
  >;
}
export interface BattleSnapshot {
  clearedWaves: number;
  damageZones: {id:number;x:number;y:number;radius:number;remaining:number}[];
  state: BattleState;
  wave: number;
  baseHP: number;
  maxBaseHP: number;
  paused: boolean;
  speed: 1 | 2;
  deployed: TowerRuntime[];
  enemies: EnemyRuntime[];
  projectiles: ProjectileRuntime[];
  impacts: BattleImpactRuntime[];
  damageNumbers: DamageNumberRuntime[];
  totalKills: number;
  totalDamage: number;
  notice: string;
  dungeon: DungeonConfig;
  mapTopology: MapTopology;
  overdriveEnergy: number;
  overdriveReady: boolean;
  activeBlessings: ActiveBattleBlessing[];
  blessingOptions: BattleBlessingData[];
  activeSynergies: TowerSynergyData[];
  careerSkillCooldown: number;
  careerSkillRemaining: number;
  bossTelegraph: string;
  metrics: BattleMetrics;
  defeatHint: string;
  sessionSeed: number;
  modifierStack: string[];
  battleGold: number;
  startingGold: number;
  slotCapacity: number;
  buildCosts: Partial<Record<TowerId, number>>;
  goldEvent: { serial: number; amount: number; reason: string } | null;
  cameraShakeRemaining: number;
}
const SLOT_PROGRESS = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86];
const BLESSING_WAVES = new Set([5, 10, 15, 20]);

function cloneStats(stats: FinalTowerStats): FinalTowerStats {
  return { ...stats };
}
function addModifiers(
  target: BlessingModifiers,
  source: BlessingModifiers,
  multiplier = 1,
) {
  for (const key of Object.keys(source) as Array<keyof BlessingModifiers>) {
    target[key] = (target[key] ?? 0) + (source[key] ?? 0) * multiplier;
  }
  return target;
}

export class TowerFactory {
  static create(
    save: PlayerSave,
    towerId: TowerId,
    slot: number,
    runtimeId: number,
    training = false,
  ): TowerRuntime | null {
    const data = getTowerById(towerId),
      owned = getOwnedTower(save, towerId),
      progress =
        owned ??
        (training
          ? {
              towerID: towerId,
              level: 1,
              stars: 1,
              unlocked: true,
              obtainedAt: 'TRAINING',
            }
          : null);
    if (!data || !progress || slot < 0 || slot >= SLOT_PROGRESS.length)
      return null;
    const baseStats = calculateTowerStats(data, progress, save);
    return {
      runtimeId,
      towerId,
      slot,
      progress: SLOT_PROGRESS[slot],
      baseStats,
      stats: cloneStats(baseStats),
      cooldown: 0,
      targetId: null,
      targetingMode: 'FIRST',
      shots: 0,
      focusTime: 0,
      skillCooldown: 0,
      skillActiveRemaining: 0,
      overdriveRemaining: 0,
      empoweredShots: 0,
      stationaryTime: 0,
      fortifyLevel: 0,
      damageDealt: 0,
      permanentLevel: progress.level,
      permanentStars: progress.stars,
      battleLevel: 1,
      branchLv3: null,
      branchLv5: null,
      investedGold: 0,
      nextUpgradeCost: 0,
      spawnEffectRemaining: 0.7,
    };
  }
}

export class BattleEngine {
  private save: PlayerSave;
  private dungeon: DungeonConfig;
  private state: BattleState = 'SETUP';
  private wave = 0;
  private baseHP: number;
  private paused = false;
  private speed: 1 | 2 = 1;
  private deployed: TowerRuntime[] = [];
  private enemies: EnemyRuntime[] = [];
  private projectiles: ProjectileRuntime[] = [];
  private impacts: BattleImpactRuntime[] = [];
  private damageNumbers: DamageNumberRuntime[] = [];
  private spawnQueue: SpawnEntry[] = [];
  private spawnTimer = 0;
  private stateTimer = 0;
  private id = 1;
  private totalKills = 0;
  private totalDamage = 0;
  private notice = '選擇部署位置，建立第一道防線。';
  private seed: number;
  private activeBlessings: ActiveBattleBlessing[] = [];
  private blessingOptions: BattleBlessingData[] = [];
  private overdriveEnergy = 0;
  private careerSkillCooldown = 0;
  private careerSkillRemaining = 0;
  private bossTelegraph = '';
  private runDuration = 0;
  private decisions: number[] = [];
  private skillUses = 0;
  private careerSkillUses = 0;
  private overdriveUses = 0;
  private blessingSelections = 0;
  private baseDamageTaken = 0;
  private retryCount = 0;
  private damageByTower: Partial<Record<TowerId, number>> = {};
  private defeatHint = '';
  private battleGold: number;
  private goldEarned = 0;
  private goldSpent = 0;
  private buildPurchases = 0;
  private upgradePurchases = 0;
  private sellCount = 0;
  private economyByWave: BattleMetrics['economyByWave'] = {};
  private goldEvent: BattleSnapshot['goldEvent'] = null;
  private goldEventSerial = 0;
  private retiredTowers = new Map<number, TowerRuntime>();
  private cameraShakeRemaining = 0;
  private clearedWaves = 0;
  private waveElapsed = 0;
  private towerTime = 0;
  private levelTime = 0;
  private towerUsage: BattleMetrics['towerUsage'] = {};
  private upgradesByTower: BattleMetrics['upgradesByTower'] = {};
  private branchSelections: string[] = [];
  private synergyActivations = new Set<string>();
  private bossPhaseDeaths: Record<string,number> = {};
  private leaksByRole: Record<string,number> = {};
  private soldTowers: TowerRuntime[] = [];
  private damageZones: {id:number;x:number;y:number;radius:number;remaining:number;cooldown:number;tower:TowerRuntime;damage:number}[] = [];
  private lastLeakHint = '';
  constructor(
    save: PlayerSave,
    dungeon: DungeonConfig = EARTH_TUTORIAL_DUNGEON,
    seed = Math.floor(Math.random() * 0xffffffff),
  ) {
    this.save = save;
    this.dungeon = dungeon;
    this.baseHP = dungeon.startingBaseHP;
    this.battleGold = dungeon.startingGold;
    this.seed = seed >>> 0;
  }
  private topology() {
    if (this.dungeon.topology) return this.dungeon.topology;
    return this.dungeon.tierID
      ? MAP_TOPOLOGY_BY_TIER[this.dungeon.tierID]
      : ('MERGE' as MapTopology);
  }
  private synergies() {
    return SynergyManager.evaluate(this.deployed.map((t) => t.towerId)).filter(s =>
      s.synergyID !== 'S_HOLY_KING' ||
      (this.save.earthCareer === 'EARTH_WALL_GUARDIAN' &&
        this.deployed.some(a=>a.towerId===s.requiredTowerIDs[0] &&
          this.deployed.some(b=>b.towerId===s.requiredTowerIDs[1] && pointDistance(this.towerPoint(a),this.towerPoint(b)) <= 30))));
  }
  private towerPoint(tower:TowerRuntime) { return SLOT_LAYOUTS[this.topology()][tower.slot]; }
  private enemyPoint(enemy:EnemyRuntime) { return {x:enemy.pathX,y:enemy.pathY}; }
  private random = () => {
    let x = this.seed || 0x7f4a7c15;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed / 4294967296;
  };
  setRetryCount(count:number) { this.retryCount = Math.max(0,Math.floor(count)); }
  private metrics(): BattleMetrics {
    return {
      waveReached:this.wave,
      averageTowerCount:this.runDuration ? this.towerTime/this.runDuration : this.deployed.length,
      averageBattleLevel:this.towerTime ? this.levelTime/this.towerTime : 1,
      towerUsage:{...this.towerUsage},
      upgradesByTower:{...this.upgradesByTower},
      branchSelections:[...this.branchSelections],
      synergyActivations:[...this.synergyActivations],
      bossPhaseDeaths:{...this.bossPhaseDeaths},
      leaksByRole:{...this.leaksByRole},
      towersUsed:[...this.soldTowers,...this.deployed].map(t=>({towerId:t.towerId,level:t.battleLevel,branches:[t.branchLv3,t.branchLv5].filter((id):id is string=>!!id),investedGold:t.investedGold,sold:this.soldTowers.includes(t)})),
      runDuration: this.runDuration,
      averageDecisionInterval:
        this.decisions.length > 1
          ? (this.decisions[this.decisions.length - 1] - this.decisions[0]) /
            (this.decisions.length - 1)
          : this.runDuration,
      skillUses: this.skillUses,
      careerSkillUses: this.careerSkillUses,
      overdriveUses: this.overdriveUses,
      blessingSelections: this.blessingSelections,
      baseDamageTaken: this.baseDamageTaken,
      retryCount: this.retryCount,
      damageByTower: { ...this.damageByTower },
      goldEarned: this.goldEarned,
      goldSpent: this.goldSpent,
      buildPurchases: this.buildPurchases,
      upgradePurchases: this.upgradePurchases,
      sellCount: this.sellCount,
      economyByWave: { ...this.economyByWave },
    };
  }
  snapshot(): BattleSnapshot {
    return {
      clearedWaves:this.clearedWaves,
      damageZones:this.damageZones.map(({id,x,y,radius,remaining})=>({id,x,y,radius,remaining})),
      state: this.state,
      wave: this.wave,
      baseHP: this.baseHP,
      maxBaseHP: this.dungeon.startingBaseHP,
      paused: this.paused,
      speed: this.speed,
      deployed: this.deployed.map((t) => ({
        ...t,
        nextUpgradeCost: this.upgradeCost(t),
        baseStats: cloneStats(t.baseStats),
        stats: cloneStats(t.stats),
      })),
      enemies: this.enemies.map((e) => ({
        ...e,
        statuses: [...e.statuses],
        triggered: [...e.triggered],
      })),
      projectiles: this.projectiles.map((p) => ({
        ...p,
        snapshot: { ...p.snapshot },
      })),
      impacts: this.impacts.map((impact) => ({ ...impact })),
      damageNumbers: this.damageNumbers.map((number) => ({ ...number })),
      totalKills: this.totalKills,
      totalDamage: this.totalDamage,
      notice: this.notice,
      dungeon: this.dungeon,
      mapTopology: this.topology(),
      overdriveEnergy: this.overdriveEnergy,
      overdriveReady: this.overdriveEnergy >= 100,
      activeBlessings: this.activeBlessings.map((b) => ({ ...b })),
      blessingOptions: [...this.blessingOptions],
      activeSynergies: this.synergies(),
      careerSkillCooldown: this.careerSkillCooldown,
      careerSkillRemaining: this.careerSkillRemaining,
      bossTelegraph: this.bossTelegraph,
      metrics: this.metrics(),
      defeatHint: this.defeatHint,
      sessionSeed: this.seed,
      modifierStack: this.modifierStack(),
      battleGold: this.battleGold,
      startingGold: this.dungeon.startingGold,
      slotCapacity: Math.min(this.dungeon.slotCount, SLOT_PROGRESS.length),
      buildCosts: Object.fromEntries(
        this.allowedTowers().map((towerID) => [
          towerID,
          this.buildCost(towerID),
        ]),
      ),
      goldEvent: this.goldEvent ? { ...this.goldEvent } : null,
      cameraShakeRemaining: this.cameraShakeRemaining,
    };
  }
  private decision() {
    this.decisions.push(this.runDuration);
  }
  private allowedTowers() {
    if(this.dungeon.trainingLoadout) return [...new Set(this.dungeon.trainingLoadout)].slice(0,3);
    return this.dungeon.tierID
      ? this.save.earthLoadout
      : GOLDEN_TUTORIAL_LOADOUT;
  }
  private buildCost(towerId: TowerId) {
    return battleBuildCost(
      towerId,
      Math.min(0.45, this.baseModifiers().buildCostReduction ?? 0),
    );
  }
  private upgradeCost(tower: TowerRuntime) {
    return battleUpgradeCost(
      tower.towerId,
      tower.battleLevel,
      Math.min(0.45, this.baseModifiers().upgradeCostReduction ?? 0),
    );
  }
  private changeGold(amount: number, reason: string) {
    this.battleGold = Math.max(0, this.battleGold + amount);
    this.goldEvent = { serial: ++this.goldEventSerial, amount, reason };
  }
  deploy(slot: number, towerId: TowerId = STARTER_TOWER_ID) {
    if (!['SETUP', 'READY', 'INTERMISSION', 'WAVE_ACTIVE'].includes(this.state))
      return { ok: false as const, error: '目前狀態無法部署炮塔。' };
    if (this.deployed.some((t) => t.slot === slot))
      return { ok: false as const, error: '此部署槽已被佔用。' };
    if (
      !Number.isInteger(slot) || slot < 0 ||
      slot >= Math.min(this.dungeon.slotCount, SLOT_PROGRESS.length)
    )
      return {
        ok: false as const,
        error: '此地圖部署節點無效。',
      };
    if (!this.allowedTowers().includes(towerId))
      return { ok: false as const, error: '此炮塔未列入本次編成。' };
    const cost = this.buildCost(towerId);
    if (this.battleGold < cost)
      return {
        ok: false as const,
        error: `戰鬥金幣不足，需要 ${cost}。`,
      };
    const tower = TowerFactory.create(
      this.save,
      towerId,
      slot,
      this.id++,
      !this.dungeon.tierID,
    );
    if (!tower)
      return { ok: false as const, error: '尚未擁有此炮塔，或部署槽無效。' };
    tower.investedGold = cost;
    tower.nextUpgradeCost = this.upgradeCost(tower);
    this.changeGold(-cost, `建造 ${getTowerById(towerId)?.name ?? towerId}`);
    this.goldSpent += cost;
    this.buildPurchases++;
    this.towerUsage[towerId] = (this.towerUsage[towerId] ?? 0) + 1;
    if (this.dungeon.benchmark) {
      // Loan units use a shared tactical budget; rarity does not trivialize the benchmark.
      const attack:Record<TowerId,number> = {
        EARTH_BASIC_AUTO_TURRET:110,EARTH_RAPID_FIRE_TURRET:80,EARTH_ARMOR_PIERCING_TURRET:210,
        EARTH_BLAST_TURRET:175,EARTH_THUNDER_TURRET:120,EARTH_DIVINE_JUDGMENT_TURRET:290,
        EARTH_PHANTOM_TURRET:155,EARTH_KING_AUTHORITY_TURRET:160,EARTH_EMPEROR_ANNIHILATION_TURRET:270,
        EARTH_VENERABLE_TURRET:190,EARTH_SAINT_DOMAIN_TURRET:195,EARTH_SOVEREIGN_END_TURRET:250,
      };
      const scaling = 1 + Math.min(0.5,(tower.permanentLevel-1)*0.025+(tower.permanentStars-1)*0.07);
      tower.baseStats.attack = attack[towerId]*scaling;
      tower.baseStats.range = getTowerById(towerId)!.baseStats.range;
      tower.baseStats.attackSpeed = getTowerById(towerId)!.baseStats.attackSpeed;
      tower.baseStats.penetration = Math.min(110,getTowerById(towerId)!.baseStats.penetration);
    }
    this.deployed.push(tower);
    this.refreshTowerStats();
    this.state = this.state === 'SETUP' ? 'READY' : this.state;
    this.notice = `已部署 ${getTowerById(towerId)?.name ?? towerId}。`;
    this.decision();
    return { ok: true as const, spent: cost };
  }
  sellTower(runtimeId: number) {
    if (!['SETUP', 'READY', 'INTERMISSION', 'WAVE_ACTIVE'].includes(this.state))
      return { ok: false as const, error: '目前無法出售炮塔。' };
    const tower = this.deployed.find((item) => item.runtimeId === runtimeId);
    if (!tower) return { ok: false as const, error: '炮塔不存在。' };
    const refund = Math.floor(tower.investedGold * 0.7);
    this.deployed = this.deployed.filter((t) => t.runtimeId !== runtimeId);
    this.soldTowers.push({...tower});
    this.projectiles = this.projectiles.filter(p=>p.sourceTowerId !== runtimeId);
    this.damageZones = this.damageZones.filter(zone=>zone.tower.runtimeId !== runtimeId);
    this.changeGold(
      refund,
      `出售 ${getTowerById(tower.towerId)?.name ?? tower.towerId}`,
    );
    this.sellCount++;
    this.refreshTowerStats();
    this.notice = `炮塔已出售，返還 ${refund} 金幣。`;
    this.decision();
    return { ok: true as const, refund };
  }
  retreat(runtimeId: number) {
    return this.sellTower(runtimeId).ok;
  }
  upgradeTower(runtimeId: number, branchID?: string) {
    if (!['READY', 'INTERMISSION', 'WAVE_ACTIVE'].includes(this.state))
      return { ok: false as const, error: '目前無法進行戰鬥升級。' };
    const tower = this.deployed.find((item) => item.runtimeId === runtimeId);
    if (!tower) return { ok: false as const, error: '炮塔不存在。' };
    if (tower.battleLevel >= 5)
      return { ok: false as const, error: '此炮塔已達 Battle Lv.5。' };
    const targetLevel = tower.battleLevel + 1;
    if (targetLevel === 3 || targetLevel === 5) {
      const options = getBattleBranches(tower.towerId, targetLevel);
      if (!branchID)
        return {
          ok: false as const,
          error: '請選擇戰鬥升級分支。',
          needsBranch: true as const,
          options,
        };
      if (!options.some((item) => item.branchID === branchID))
        return { ok: false as const, error: '升級分支無效。' };
    }
    const cost = this.upgradeCost(tower);
    if (this.battleGold < cost)
      return { ok: false as const, error: `戰鬥金幣不足，需要 ${cost}。` };
    this.changeGold(-cost, `Battle Lv.${targetLevel}`);
    this.goldSpent += cost;
    this.upgradePurchases++;
    this.upgradesByTower[tower.towerId] = (this.upgradesByTower[tower.towerId] ?? 0)+1;
    if(branchID) this.branchSelections.push(branchID);
    tower.investedGold += cost;
    tower.battleLevel = targetLevel;
    if (targetLevel === 3) tower.branchLv3 = branchID ?? null;
    if (targetLevel === 5) tower.branchLv5 = branchID ?? null;
    tower.nextUpgradeCost = this.upgradeCost(tower);
    this.refreshTowerStats();
    this.notice = `${getTowerById(tower.towerId)?.name}提升至 Battle Lv.${targetLevel}。`;
    this.decision();
    return { ok: true as const, spent: cost, battleLevel: targetLevel };
  }
  setTargeting(runtimeId: number, mode: TargetingMode) {
    const tower = this.deployed.find((t) => t.runtimeId === runtimeId);
    if (!tower || !['FIRST', 'NEAREST', 'STRONGEST', 'WEAKEST'].includes(mode))
      return false;
    tower.targetingMode = mode;
    this.decision();
    return true;
  }
  start() {
    if (!this.deployed.length)
      return { ok: false as const, error: '至少部署一座炮塔才能開始。' };
    if (!['READY', 'SETUP'].includes(this.state))
      return { ok: false as const, error: '戰鬥已經開始。' };
    this.startNextWave();
    this.decision();
    return { ok: true as const };
  }
  togglePause() {
    if (this.state === 'BLESSING_CHOICE') return false;
    this.paused = !this.paused;
    return true;
  }
  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
  }
  callNextWave() {
    if (this.state !== 'INTERMISSION') return false;
    this.overdriveEnergy = Math.min(100, this.overdriveEnergy + 5);
    this.startNextWave();
    this.decision();
    return true;
  }
  tick(rawDelta: number) {
    if (
      this.paused ||
      this.state === 'BLESSING_CHOICE' ||
      ['VICTORY', 'DEFEAT', 'RESULT', 'EXITING'].includes(this.state)
    )
      return;
    const delta = Math.min(0.12, Math.max(0, rawDelta)) * this.speed;
    if (!['SETUP', 'READY'].includes(this.state)) {
      this.runDuration += delta;
      this.towerTime += this.deployed.length*delta;
      this.levelTime += this.deployed.reduce((sum,t)=>sum+t.battleLevel,0)*delta;
      for(const synergy of this.synergies()) this.synergyActivations.add(synergy.synergyID);
    }
    this.updateTemporary(delta);
    if (
      ['BOSS_WARNING', 'WAVE_STARTING', 'WAVE_CLEAR', 'INTERMISSION'].includes(
        this.state,
      )
    ) {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) this.advanceTimedState();
      return;
    }
    if (this.state !== 'WAVE_ACTIVE') return;
    this.waveElapsed += delta;
    this.updateSpawning(delta);
    this.updateBossMechanics(delta);
    this.updateEnemies(delta);
    this.refreshTowerStats();
    this.updateTowers(delta);
    this.updateProjectiles(delta);
    this.updateDamageZones(delta);
    this.finalizeDeaths();
    if (this.baseHP <= 0) {
      this.baseHP = 0;
      this.state = 'DEFEAT';
      this.defeatHint = this.makeDefeatHint();
      this.clearRunEffects();
      this.notice = '基地核心失守。';
      return;
    }
    if (
      !this.spawnQueue.length &&
      this.waveElapsed >= (this.dungeon.minimumWaveDuration ?? 0) &&
      !this.enemies.some((e) => e.state === 'ALIVE') &&
      !this.projectiles.length
    ) {
      this.state = 'WAVE_CLEAR';
      this.stateTimer = 0.45;
      this.notice = `WAVE ${String(this.wave).padStart(2, '0')} CLEAR`;
      this.recordEconomyCheckpoint();
      this.clearedWaves = this.wave;
    }
  }
  private startNextWave() {
    this.waveElapsed = 0;
    this.wave = Math.min(this.dungeon.totalWaves, this.wave + 1);
    const waveData = this.dungeon.waves[this.wave - 1];
    this.spawnQueue = waveData.groups.flatMap((group) =>
      Array.from({ length: group.count }, () => ({
        enemyId: group.enemyId,
        delay: group.interval,
      })),
    );
    this.spawnTimer = 0.08;
    this.state = waveData.boss ? 'BOSS_WARNING' : 'WAVE_STARTING';
    this.stateTimer = waveData.boss ? 0.8 : 0.26;
    this.notice = waveData.boss
      ? `WARNING · ${this.dungeon.bossName}`
      : `WAVE ${String(this.wave).padStart(2, '0')} INCOMING`;
    this.bossTelegraph = '';
  }
  private advanceTimedState() {
    if (this.state === 'BOSS_WARNING') {
      this.state = 'WAVE_STARTING';
      this.stateTimer = 0.25;
    } else if (this.state === 'WAVE_STARTING') this.state = 'WAVE_ACTIVE';
    else if (this.state === 'WAVE_CLEAR') {
      if (this.wave >= this.dungeon.totalWaves) {
        this.state = 'VICTORY';
        this.clearRunEffects();
        this.notice = `${this.dungeon.name} · 25 波全數清除`;
      } else if (BLESSING_WAVES.has(this.wave)) {
        this.openBlessingChoice();
      } else {
        this.state = 'INTERMISSION';
        this.stateTimer = this.wave < 5 ? 1.2 : 2.2;
      }
    } else if (this.state === 'INTERMISSION') this.startNextWave();
  }
  private openBlessingChoice() {
    const offer = BattleBlessingManager.offer(
      this.seed,
      this.allowedTowers(),
      this.deployed.map((t) => t.towerId),
      this.activeBlessings,
      SynergyManager.tags(this.deployed.map((t) => t.towerId)),
      {career:this.save.earthCareer,enemyTypes:this.dungeon.waves.flatMap(w=>w.groups.map(g=>g.enemyId)),benchmark:this.dungeon.benchmark},
    );
    this.seed = offer.seed;
    this.blessingOptions = offer.options;
    this.state = 'BLESSING_CHOICE';
    this.notice = 'BATTLE BLESSING · 選擇本次戰鬥的進化方向';
  }
  chooseBlessing(blessingID: string) {
    if (
      this.state !== 'BLESSING_CHOICE' ||
      !this.blessingOptions.some((item) => item.blessingID === blessingID)
    )
      return { ok: false as const, error: '目前無法選擇此祝福。' };
    const result = BattleBlessingManager.select(
      this.activeBlessings,
      blessingID,
    );
    if (!result.ok) return result;
    this.activeBlessings = result.active;
    this.blessingOptions = [];
    this.blessingSelections++;
    this.refreshTowerStats();
    this.state = 'INTERMISSION';
    this.stateTimer = 1.6;
    this.notice = `BLESSING ACQUIRED · ${BattleBlessingManager.displayName(this.activeBlessings.find((item) => item.blessingID === blessingID)!)}`;
    this.decision();
    return { ok: true as const };
  }
  private updateTemporary(delta: number) {
    this.careerSkillCooldown = Math.max(0, this.careerSkillCooldown - delta);
    this.careerSkillRemaining = Math.max(0, this.careerSkillRemaining - delta);
    this.cameraShakeRemaining = Math.max(0, this.cameraShakeRemaining - delta);
    for (const tower of this.deployed) {
      tower.cooldown = Math.max(-0.1, tower.cooldown - delta);
      tower.skillCooldown = Math.max(0, tower.skillCooldown - delta);
      tower.skillActiveRemaining = Math.max(
        0,
        tower.skillActiveRemaining - delta,
      );
      tower.overdriveRemaining = Math.max(0, tower.overdriveRemaining - delta);
      tower.spawnEffectRemaining = Math.max(
        0,
        tower.spawnEffectRemaining - delta,
      );
      tower.stationaryTime += delta;
      tower.fortifyLevel =
        tower.stationaryTime >= 40 ? 2 : tower.stationaryTime >= 20 ? 1 : 0;
    }
    for (const enemy of this.enemies)
      enemy.spawnEffectRemaining = Math.max(
        0,
        enemy.spawnEffectRemaining - delta,
      );
    for (const impact of this.impacts)
      impact.remaining = Math.max(0, impact.remaining - delta);
    for (const number of this.damageNumbers) {
      number.remaining = Math.max(0, number.remaining - delta);
      number.mergeRemaining = Math.max(0, number.mergeRemaining - delta);
    }
    this.impacts = this.impacts.filter((impact) => impact.remaining > 0);
    this.damageNumbers = this.damageNumbers.filter(
      (number) => number.remaining > 0,
    );
  }
  activateTowerSkill(runtimeId: number) {
    const tower = this.deployed.find((t) => t.runtimeId === runtimeId),
      skill = tower ? TOWER_SKILLS[tower.towerId] : null;
    if (!tower || !skill)
      return { ok: false as const, error: '炮塔技能資料無效。' };
    if (
      this.paused ||
      this.state === 'BLESSING_CHOICE' ||
      !['WAVE_ACTIVE', 'INTERMISSION'].includes(this.state)
    )
      return { ok: false as const, error: '目前戰鬥狀態不能使用技能。' };
    if (tower.skillCooldown > 0)
      return {
        ok: false as const,
        error: `技能冷卻中 ${tower.skillCooldown.toFixed(1)}s`,
      };
    if (tower.skillActiveRemaining > 0)
      return { ok: false as const, error: '此技能已在作用中。' };
    const cooldownReduction =
      (this.collectModifiers(tower).cooldownReduction ?? 0) + (this.battleUpgradeModifiers(tower).cooldownReduction ?? 0);
    tower.skillCooldown =
      skill.cooldown * Math.max(0.35, 1 - cooldownReduction);
    tower.skillActiveRemaining = skill.duration;
    this.applyImmediateSkill(tower, skill);
    this.skillUses++;
    this.notice = `SKILL · ${skill.displayName}`;
    this.decision();
    this.refreshTowerStats();
    return { ok: true as const, skill };
  }
  private applyImmediateSkill(tower: TowerRuntime, skill: TowerSkillData) {
    const alive = this.enemies.filter((e) => e.state === 'ALIVE'),
      highest = [...alive].sort((a, b) => b.hp - a.hp)[0];
    if (skill.effect === 'PIERCE') tower.empoweredShots = 1;
    else if (skill.effect === 'METEOR')
      alive
        .filter(
          (e) => !highest || pointDistance(this.enemyPoint(e),this.enemyPoint(highest)) < 22,
        )
        .forEach((e) => this.directDamage(e, tower, tower.stats.attack * 2.2));
    else if (skill.effect === 'JUDGMENT' && highest)
      this.directDamage(
        highest,
        tower,
        tower.stats.attack * (highest.boss ? 7 : 4),
      );
    else if (skill.effect === 'ANNIHILATION' && highest)
      this.directDamage(highest, tower, tower.stats.attack * 8);
    else if (skill.effect === 'SOVEREIGN_END')
      alive.forEach((e) =>
        this.directDamage(
          e,
          tower,
          tower.stats.attack * (2.2 + this.synergies().length * 0.35),
        ),
      );
  }
  activateOverdrive(runtimeId: number) {
    const tower = this.deployed.find((t) => t.runtimeId === runtimeId);
    if (!tower) return { ok: false as const, error: '請先選擇已部署炮塔。' };
    if (this.overdriveEnergy < 100)
      return { ok: false as const, error: 'OVERDRIVE 尚未充滿。' };
    if (this.paused || this.state !== 'WAVE_ACTIVE')
      return { ok: false as const, error: '目前無法啟動 OVERDRIVE。' };
    this.overdriveEnergy = 0;
    tower.overdriveRemaining = 10;
    this.overdriveUses++;
    this.notice = `OVERDRIVE · ${getTowerById(tower.towerId)?.name}`;
    this.decision();
    this.refreshTowerStats();
    return { ok: true as const };
  }
  activateCareerSkill() {
    if (!this.save.earthCareer)
      return { ok: false as const, error: '尚未連結地球職業。' };
    if (this.careerSkillCooldown > 0)
      return {
        ok: false as const,
        error: `職業技能冷卻中 ${this.careerSkillCooldown.toFixed(1)}s`,
      };
    if (this.paused || this.state !== 'WAVE_ACTIVE')
      return { ok: false as const, error: '目前無法展開絕對防線。' };
    this.careerSkillCooldown = 90;
    this.careerSkillRemaining = 8;
    this.careerSkillUses++;
    this.notice = 'CAREER SKILL · 絕對防線（基地承傷 -80%）';
    this.decision();
    return { ok: true as const };
  }
  private collectModifiers(tower: TowerRuntime) {
    const result: BlessingModifiers = {},
      affinity = new Set(TOWER_AFFINITIES[tower.towerId]);
    for (const active of this.activeBlessings) {
      const data = BATTLE_BLESSINGS.find(
        (item) => item.blessingID === active.blessingID,
      );
      if (!data) continue;
      if (
        data.blessingID === 'B_PERFECT_LINE' ||
        data.blessingID === 'B_LAST_STAND' ||
        data.blessingID === 'B_OVERCLOCK_FIELD' ||
        data.blessingID === 'B_OPEN_PLATES'
      )
        continue;
      const specific =
        data.classification === 'BUILD_SUPPORT' &&
        !data.tags.some((tag) =>
          ['GENERAL', 'DEFENSE', 'BOSS', 'OVERDRIVE'].includes(tag),
        );
      if (!specific || data.tags.some((tag) => affinity.has(tag)))
        addModifiers(result, data.modifiers, active.stacks);
    }
    const resonance = this.deployed.some(
      (t) =>
        TOWER_SKILLS[t.towerId].effect === 'RESONANCE' &&
        t.skillActiveRemaining > 0,
    )
      ? 1.5
      : 1;
    for (const synergy of this.synergies())
      addModifiers(result, synergy.modifiers, resonance);
    if (tower.fortifyLevel)
      addModifiers(
        result,
        { attackPercent: tower.fortifyLevel === 1 ? 0.1 : 0.15 },
        1,
      );
    return result;
  }
  private battleUpgradeModifiers(tower: TowerRuntime) {
    const result: BattleUpgradeModifiers = {};
    for (const branchID of [tower.branchLv3, tower.branchLv5]) {
      const branch = getBattleBranch(tower.towerId, branchID);
      if (!branch) continue;
      for (const key of Object.keys(branch.modifiers) as Array<
        keyof BattleUpgradeModifiers
      >)
        result[key] = (result[key] ?? 0) + (branch.modifiers[key] ?? 0);
    }
    return result;
  }
  private hasBranchEffect(tower: TowerRuntime, effect: string) {
    return [tower.branchLv3, tower.branchLv5].some(
      (branchID) => getBattleBranch(tower.towerId, branchID)?.effect === effect,
    );
  }
  private refreshTowerStats() {
    const globalRoyal = this.deployed.some(
        (t) =>
          TOWER_SKILLS[t.towerId].effect === 'ROYAL_AURA' &&
          t.skillActiveRemaining > 0,
      ),
      globalSaint = this.deployed.some(
        (t) =>
          TOWER_SKILLS[t.towerId].effect === 'SANCTUARY' &&
          t.skillActiveRemaining > 0,
      );
    for (const tower of this.deployed) {
      const stats = cloneStats(tower.baseStats),
        mod = this.collectModifiers(tower),
        battleMod = this.battleUpgradeModifiers(tower),
        skill = TOWER_SKILLS[tower.towerId],
        affinity = TOWER_AFFINITIES[tower.towerId];
      const battleMultiplier =
        BATTLE_LEVEL_MULTIPLIERS[
          Math.max(0, Math.min(4, tower.battleLevel - 1))
        ];
      stats.attack *= battleMultiplier;
      stats.defense *= 1 + (battleMultiplier - 1) * 0.65;
      stats.maxHP *= 1 + (battleMultiplier - 1) * 0.55;
      stats.penetration *= 1 + (battleMultiplier - 1) * 0.4;
      let attackPercent =
          (mod.attackPercent ?? 0) + (battleMod.attackPercent ?? 0),
        speedPercent =
          (mod.attackSpeedPercent ?? 0) + (battleMod.attackSpeedPercent ?? 0);
      if (this.hasBranchEffect(tower,'SPEED_RAMP')) speedPercent += Math.min(0.48,tower.focusTime*0.08);
      const nearbyAura = this.deployed.some(a => a.runtimeId!==tower.runtimeId &&
        (this.hasBranchEffect(a,'AURA') || this.hasBranchEffect(a,'SANCTUARY')) &&
        pointDistance(this.towerPoint(a),this.towerPoint(tower)) <= 26);
      if (nearbyAura) { attackPercent += 0.15; stats.defense *= 1.15; }
      if (
        this.baseHP === this.dungeon.startingBaseHP &&
        this.activeBlessings.some((b) => b.blessingID === 'B_PERFECT_LINE')
      )
        attackPercent += 0.22;
      if (
        this.baseHP < this.dungeon.startingBaseHP * 0.5 &&
        this.activeBlessings.some((b) => b.blessingID === 'B_LAST_STAND')
      )
        speedPercent += 0.32;
      if (tower.skillActiveRemaining > 0) {
        if (skill.effect === 'HASTE') speedPercent += 0.5;
        if (skill.effect === 'OVERHEAT') {
          speedPercent += 1;
          attackPercent -= 0.2;
        }
        if (skill.effect === 'PHANTOM') stats.critChance += 0.35;
      }
      if (globalRoyal) {
        attackPercent += 0.15;
        stats.defense *= 1.15;
      }
      if (globalSaint) speedPercent += 0.18;
      if (tower.overdriveRemaining > 0) {
        attackPercent += affinity.includes('ARMOR_BREAK')
          ? 0.7
          : affinity.includes('AOE')
            ? 0.6
            : 0.45;
        speedPercent += affinity.includes('RAPID_FIRE') ? 1.1 : 0.35;
        stats.penetration += affinity.includes('ARMOR_BREAK') ? 180 : 40;
        stats.critChance += affinity.includes('CRIT') ? 0.25 : 0;
        if (
          this.activeBlessings.some((b) => b.blessingID === 'B_OVERCLOCK_FIELD')
        )
          speedPercent += 0.35;
      }
      attackPercent -= mod.attackPenalty ?? 0;
      stats.attack *= Math.max(0.15, 1 + attackPercent);
      stats.attackSpeed *= Math.max(0.2, 1 + speedPercent);
      stats.critChance = Math.min(
        0.95,
        stats.critChance + (mod.critChance ?? 0) + (battleMod.critChance ?? 0),
      );
      stats.critDamage *=
        1 + (mod.critDamagePercent ?? 0) + (battleMod.critDamagePercent ?? 0);
      stats.penetration +=
        (mod.penetration ?? 0) + (battleMod.penetration ?? 0);
      stats.range *= 1 + (battleMod.rangePercent ?? 0);
      stats.defense *=
        1 + tower.fortifyLevel * 0.1 + (battleMod.defensePercent ?? 0);
      tower.stats = stats;
    }
  }
  private updateSpawning(delta: number) {
    if (!this.spawnQueue.length) return;
    this.spawnTimer -= delta;
    if (this.spawnTimer > 0) return;
    const entry = this.spawnQueue.shift();
    if (!entry) return;
    this.spawnEnemy(entry.enemyId);
    this.spawnTimer = Math.max(0.08, entry.delay * (this.dungeon.benchmark ? 1 : 0.9));
  }
  private spawnEnemy(enemyId: EnemyId) {
    const data = ENEMY_CATALOG[enemyId],
      waveScale = 1 + (this.wave - 1) * 0.065,
      bossScale = data.boss
        ? this.dungeon.waves[this.wave - 1].bossMultiplier
        : 1,
      elite = data.elite || (data.boss && this.dungeon.tierOrder >= 2),
      maxHP =
        data.maxHP *
        this.dungeon.hpMultiplier *
        waveScale *
        bossScale *
        (elite ? 1.4 : 1),
      defense =
        data.defense * this.dungeon.defenseMultiplier * (elite ? 1.18 : 1),
      speed = data.speed * this.dungeon.speedMultiplier,
      shieldPercent =
        data.shieldPercent ??
        (data.boss && this.dungeon.tierOrder >= 3
          ? Math.min(0.55, 0.1 + this.dungeon.tierOrder * 0.035)
          : 0),
      shieldHP = maxHP * shieldPercent,
      statuses: EnemyStatus[] = [],
      runtimeId = this.id++,
      pathBranch = runtimeId % 2,
      spawnPoint = sampleBattlePath(0, this.topology(), pathBranch);
    if (data.boss) {
      const tier = this.dungeon.tierID ?? 'NORMAL',
        primary = BOSS_MECHANICS[tier].primary;
      statuses.push(primary);
      this.bossTelegraph = `${BOSS_MECHANICS[tier].telegraph} · 對策：${BOSS_MECHANICS[tier].counterplay}`;
    }
    this.enemies.push({
      runtimeId,
      enemyId,
      name: data.boss ? this.dungeon.bossName : data.name,
      hp: maxHP,
      maxHP,
      shieldHP,
      maxShieldHP: shieldHP,
      defense,
      baseDefense: defense,
      speed,
      actualSpeed: speed,
      baseSpeed: speed,
      baseDamage: Math.max(
        1,
        Math.round(data.baseDamage * (1 + (this.wave - 1) * 0.025)),
      ),
      progress: 0,
      pathBranch,
      pathX: spawnPoint.x,
      pathY: spawnPoint.y,
      heading: spawnPoint.heading,
      targetWaypoint: spawnPoint.targetWaypoint,
      spawnEffectRemaining: 0.65,
      boss: data.boss,
      elite,
      regenerationPercent:
        data.regenerationPercent ??
        (data.boss && this.dungeon.tierOrder >= 4 ? 0.007 : 0),
      supportAura: data.supportAura ?? 0,
      phase: 1,
      role: data.icon,
      visualScale: data.visualScale,
      animationProfile: data.animationProfile,
      tierVisualVariant: this.dungeon.tierID ?? 'TUTORIAL',
      statuses,
      triggered: [],
      mechanicTimer: BOSS_MECHANICS[this.dungeon.tierID ?? 'NORMAL'].timer || 8,
      vulnerableRemaining: 0,
      damageReduction: 0,
      battleGoldReward: Math.round(
        data.battleGoldReward *
          (data.boss
            ? 1 +
              Math.floor((this.wave - 1) / 5) * 0.45 +
              Math.max(0, this.dungeon.tierOrder) * 0.08
            : this.dungeon.goldRewardMultiplier),
      ),
      state: 'ALIVE',
    });
  }
  private updateBossMechanics(delta: number) {
    for (const boss of this.enemies.filter(
      (e) => e.boss && e.state === 'ALIVE',
    )) {
      const tier = this.dungeon.tierID ?? 'NORMAL',
        config = BOSS_MECHANICS[tier],
        ratio = boss.hp / boss.maxHP;
      boss.mechanicTimer -= delta;
      if (boss.vulnerableRemaining > 0) {
        boss.vulnerableRemaining -= delta;
        if (boss.vulnerableRemaining <= 0) {
          boss.statuses = boss.statuses.filter((s) => s !== 'VULNERABLE');
          boss.defense = boss.baseDefense;
          this.bossTelegraph = '裝甲重新閉合';
        }
      }
      if (this.dungeon.benchmark) {
        const nextPhase = ratio <= 0.35 ? 3 : ratio <= 0.7 ? 2 : 1;
        if (nextPhase > boss.phase) {
          boss.phase = nextPhase;
          boss.shieldHP += boss.maxHP * 0.1;
          boss.maxShieldHP = Math.max(boss.maxShieldHP,boss.shieldHP);
          boss.mechanicTimer = 3;
          this.bossTelegraph = `第 ${nextPhase} 階段 · 3 秒後裝甲展開`;
        }
        if (boss.mechanicTimer <= 0) {
          if(boss.statuses.includes('CHARGE')) {
            boss.statuses = ['VULNERABLE'];
            boss.vulnerableRemaining = 6;
            boss.defense = boss.baseDefense*0.5;
            boss.mechanicTimer = 6;
            this.bossTelegraph = '核心暴露 6 秒 · 技能與超載爆發時機';
          } else {
            boss.statuses = ['CHARGE'];
            boss.defense = boss.baseDefense*1.5;
            boss.mechanicTimer = 4;
            this.bossTelegraph = '充能 4 秒 · 即將暴露核心';
          }
        }
        continue;
      }
      const trigger = (key: string, action: () => void) => {
        if (boss.triggered.includes(key)) return;
        boss.triggered.push(key);
        action();
      };
      if (tier === 'RARE' && ratio <= 0.5)
        trigger('RARE_50', () => {
          boss.statuses.push('SPEED_UP');
          boss.speed *= 1.45;
          this.bossTelegraph = 'SPEED UP · 疾界獵獸加速突進';
        });
      if (tier === 'SCARCE' && ratio <= 0.6)
        trigger('SCARCE_60', () => {
          boss.statuses.push('ARMOR');
          boss.defense *= 1.7;
          boss.mechanicTimer = 8;
          this.bossTelegraph = 'ARMOR UP · 使用貫穿能力';
        });
      if (tier === 'EPIC')
        for (const threshold of [0.7, 0.35])
          if (ratio <= threshold)
            trigger(`EPIC_${threshold}`, () => {
              boss.shieldHP += boss.maxHP * 0.22;
              boss.maxShieldHP = Math.max(boss.maxShieldHP, boss.shieldHP);
              this.bossTelegraph = 'SHIELD · 界障重新生成';
            });
      if (tier === 'MYTHIC' && ratio <= 0.5)
        trigger('MYTHIC_50', () => {
          boss.statuses.push('ENRAGE', 'SHIELD');
          boss.speed *= 1.25;
          boss.shieldHP += boss.maxHP * 0.2;
          this.bossTelegraph = 'ENRAGE + SHIELD · 神環崩裂';
        });
      if (tier === 'SECRET' && boss.mechanicTimer <= 0) {
        this.spawnEnemy('EARTH_SUPPORT');
        boss.mechanicTimer = 8;
        this.bossTelegraph = 'SUMMON · 優先擊殺裂隙支援者';
      }
      if (tier === 'KING' && !boss.statuses.includes('AURA'))
        boss.statuses.push('AURA');
      if (tier === 'EMPEROR' && boss.mechanicTimer <= 0) {
        if (boss.triggered.includes('EMPEROR_WINDOW')) {
          boss.triggered = boss.triggered.filter(
            (key) => key !== 'EMPEROR_WINDOW',
          );
          boss.statuses = boss.statuses.filter((s) => s !== 'VULNERABLE');
          if (!boss.statuses.includes('CHARGE')) boss.statuses.push('CHARGE');
          boss.defense = boss.baseDefense;
          boss.mechanicTimer = 9;
          this.bossTelegraph = '裝甲重新閉合 · 下一次展開前保存技能';
        } else {
          boss.triggered.push('EMPEROR_WINDOW');
          boss.statuses = boss.statuses.filter((s) => s !== 'CHARGE');
          boss.statuses.push('VULNERABLE');
          boss.defense = boss.baseDefense * 0.5;
          boss.vulnerableRemaining = 6;
          boss.mechanicTimer = 6;
          this.bossTelegraph = 'VULNERABLE 6s · 裝甲展開，立即爆發！';
        }
      }
      if (tier === 'VENERABLE' && boss.mechanicTimer <= 0) {
        const armor = boss.statuses.includes('ARMOR');
        boss.statuses = boss.statuses.filter(
          (s) => s !== 'ARMOR' && s !== 'SPEED_UP',
        );
        if (armor) {
          boss.statuses.push('SPEED_UP');
          boss.defense = boss.baseDefense;
          boss.speed = boss.baseSpeed * 1.45;
          this.bossTelegraph = 'SPEED PHASE · 切換高速鎖定';
        } else {
          boss.statuses.push('ARMOR');
          boss.defense = boss.baseDefense * 1.55;
          boss.speed = boss.baseSpeed;
          this.bossTelegraph = 'ARMOR PHASE · 準備貫穿';
        }
        boss.mechanicTimer = 7;
      }
      if (tier === 'SAINT')
        for (const threshold of [0.7, 0.4])
          if (ratio <= threshold)
            trigger(`SAINT_${threshold}`, () => {
              boss.statuses.push('BARRIER');
              boss.shieldHP += boss.maxHP * 0.28;
              boss.maxShieldHP = Math.max(boss.maxShieldHP, boss.shieldHP);
              boss.damageReduction = 0.2;
              this.bossTelegraph = 'HOLY BARRIER · Boss 特攻效果提升';
            });
      if (tier === 'SOVEREIGN') {
        if (ratio <= 0.7 && boss.phase === 1) {
          boss.phase = 2;
          boss.statuses = ['PHASE_CHANGE', 'ARMOR'];
          boss.defense = boss.baseDefense * 1.35;
          boss.mechanicTimer = 5;
          this.spawnEnemy('EARTH_ELITE');
          this.bossTelegraph = 'PHASE 2 · 外殼破裂／弱點即將暴露';
        }
        if (ratio <= 0.4 && boss.phase === 2) {
          boss.phase = 3;
          boss.statuses = ['ENRAGE', 'SUMMON'];
          boss.speed = boss.baseSpeed * 1.45;
          boss.defense = boss.baseDefense;
          boss.mechanicTimer = 5;
          this.bossTelegraph = 'FINAL PHASE · 保存的技能現在全部釋放';
        }
        if (boss.phase === 2 && boss.mechanicTimer <= 0) {
          boss.statuses.push('VULNERABLE');
          boss.defense = boss.baseDefense * 0.55;
          boss.vulnerableRemaining = 4.5;
          boss.mechanicTimer = 8;
          this.bossTelegraph = 'VULNERABLE 4.5s · 帝境核心暴露';
        }
        if (boss.phase === 3 && boss.mechanicTimer <= 0) {
          this.spawnEnemy('EARTH_SUPPORT');
          boss.shieldHP += boss.maxHP * 0.1;
          boss.mechanicTimer = 6;
          this.bossTelegraph = 'PHASE 3 · 支援增援與週期屏障';
        }
      }
      if (
        config.primary === 'ARMOR' &&
        boss.statuses.includes('ARMOR') &&
        boss.mechanicTimer <= 0
      ) {
        boss.statuses = boss.statuses.filter((s) => s !== 'ARMOR');
        boss.defense = boss.baseDefense;
        this.bossTelegraph = 'ARMOR BREAK · 防禦回復正常';
      }
    }
  }
  private updateEnemies(delta: number) {
    for (const enemy of this.enemies) {
      if (enemy.state !== 'ALIVE') continue;
      if (enemy.regenerationPercent > 0 && enemy.hp > 0)
        enemy.hp = Math.min(
          enemy.maxHP,
          enemy.hp + enemy.maxHP * enemy.regenerationPercent * delta,
        );
      const velocityResponse = 1 - Math.exp(-8 * delta);
      enemy.actualSpeed += (enemy.speed - enemy.actualSpeed) * velocityResponse;
      enemy.progress += enemy.actualSpeed * delta;
      const path = sampleBattlePath(
        enemy.progress,
        this.topology(),
        enemy.pathBranch,
      );
      enemy.pathX = path.x;
      enemy.pathY = path.y;
      enemy.targetWaypoint = path.targetWaypoint;
      enemy.heading = interpolateHeading(
        enemy.heading,
        path.heading,
        1 - Math.exp(-10 * delta),
      );
      if (enemy.progress >= 1) {
        this.leaksByRole[enemy.role] = (this.leaksByRole[enemy.role] ?? 0)+1;
        if(enemy.boss) {
          this.bossPhaseDeaths[`PHASE_${enemy.phase}`] = (this.bossPhaseDeaths[`PHASE_${enemy.phase}`] ?? 0)+1;
          this.lastLeakHint = enemy.shieldHP>0 ? '頭目帶著未破護盾突破基地；下次可調整爆發時機。' : '頭目突破基地；留意充能後的弱點窗與最後防線。';
        } else if(enemy.enemyId==='EARTH_RUNNER') this.lastLeakHint = '疾行敵人穿越防線；檢查短路線的覆蓋與鎖定方式。';
        enemy.progress = 1;
        enemy.state = 'DYING';
        const modifiers = this.baseModifiers(),
          raw = enemy.boss ? (this.wave === this.dungeon.totalWaves ? this.dungeon.startingBaseHP*5 : 5) : Math.max(1, enemy.baseDamage),
          reduction = Math.min(
            0.95,
            (this.careerSkillRemaining > 0 ? 0.8 : 0) +
              (modifiers.baseDamageReduction ?? 0),
          ),
          damage = Math.max(0, Math.round(raw * (1 - reduction)));
        this.baseHP -= damage;
        if(enemy.boss && this.wave===this.dungeon.totalWaves) this.baseHP=0;
        this.baseDamageTaken += damage;
      }
    }
  }
  private baseModifiers() {
    const result: BlessingModifiers = {};
    for (const active of this.activeBlessings) {
      const data = BattleBlessingManager.getData(active.blessingID);
      if (data) addModifiers(result, data.modifiers, active.stacks);
    }
    for (const synergy of this.synergies())
      addModifiers(result, synergy.modifiers);
    return result;
  }
  private updateTowers(delta:number) {
    for (const tower of this.deployed) {
      const current =
          this.enemies.find(
            (e) => e.runtimeId === tower.targetId && e.state === 'ALIVE',
          ) ?? null,
        inRange = current && pointDistance(this.towerPoint(tower),this.enemyPoint(current)) <= towerRangeRadius(tower.stats.range),
        target = inRange
          ? current
          : this.enemies.filter(e=>e.state==='ALIVE' &&
              pointDistance(this.towerPoint(tower),this.enemyPoint(e))<=towerRangeRadius(tower.stats.range))
            .sort((a,b)=>tower.targetingMode==='STRONGEST' ? b.hp-a.hp :
              tower.targetingMode==='WEAKEST' ? a.hp-b.hp :
              tower.targetingMode==='NEAREST' ? pointDistance(this.towerPoint(tower),this.enemyPoint(a))-pointDistance(this.towerPoint(tower),this.enemyPoint(b)) :
              b.progress-a.progress)[0];
      tower.focusTime = target && target.runtimeId===tower.targetId ? tower.focusTime+delta : 0;
      tower.targetId = target?.runtimeId ?? null;
      if (!target || tower.cooldown > 0) continue;
      tower.cooldown = 1 / Math.max(0.1, tower.stats.attackSpeed);
      tower.shots++;
      const data = getTowerById(tower.towerId)!,
        skill = TOWER_SKILLS[tower.towerId],
        battleMod = this.battleUpgradeModifiers(tower),
        pierce = tower.empoweredShots > 0,
        attackProfile = TOWER_ATTACK_PROFILES[tower.towerId],
        duration = attackProfile.travelDuration + attackProfile.chargeDuration;
      if (pierce) tower.empoweredShots--;
      const chainBonus =
        (this.collectModifiers(tower).chainTargets ?? 0) +
        (skill.effect === 'CHAIN_STORM' && tower.skillActiveRemaining > 0
          ? 2
          : 0) +
        (tower.overdriveRemaining > 0 &&
        TOWER_AFFINITIES[tower.towerId].includes('CHAIN')
          ? 2
          : 0);
      const projectile: ProjectileRuntime = {
        runtimeId: this.id++,
        fromSlot: tower.slot,
        sourceTowerId: tower.runtimeId,
        targetId: target.runtimeId,
        remaining: duration,
        snapshot: {
          ...makeDamageSnapshot(tower.stats),
          penetration:
            tower.stats.penetration + (pierce ? target.defense * 0.8 : 0),
        },
        attackPattern: data.attackPattern,
        maxTargets: pierce
          ? this.enemies.length
          : (tower.towerId==='EARTH_ARMOR_PIERCING_TURRET' ? 2 : data.maxTargets) + chainBonus + (battleMod.maxTargets ?? 0),
        bossDamageMultiplier:
          data.bossDamageMultiplier * (1 + (battleMod.bossDamagePercent ?? 0)),
        skillPierce: pierce,
        towerId: tower.towerId,
        attackVFXID: data.attackVFXID,
        duration,
        chargeDuration: attackProfile.chargeDuration,
        attackClass: attackProfile.attackClass,
        impact: attackProfile.impact,
        soundHook: attackProfile.soundHook,
        cameraShake: attackProfile.cameraShake,
        sequenceIndex: tower.shots % 3,
      };
      this.projectiles.push(projectile);
      if (this.hasBranchEffect(tower,'SECOND_TARGET') &&
        (tower.towerId==='EARTH_RAPID_FIRE_TURRET' ? this.random()<0.3 : tower.shots%4===0)) {
        const secondary = this.enemies.find(e=>e.state==='ALIVE'&&e.runtimeId!==target.runtimeId&&pointDistance(this.enemyPoint(e),this.enemyPoint(target))<18);
        if(secondary) this.projectiles.push({...projectile,runtimeId:this.id++,targetId:secondary.runtimeId,maxTargets:1});
      }
      if (this.hasBranchEffect(tower,'STORM_STRIKE') && tower.shots%6===0) this.directDamage(target,tower,tower.stats.attack*1.8);
      if (tower.towerId==='EARTH_RAPID_FIRE_TURRET' && target.statuses.includes('SHOCKED') && this.synergies().some(s=>s.synergyID==='S_RAPID_THUNDER')) {
        this.overdriveEnergy = Math.min(100,this.overdriveEnergy+0.45);
        tower.skillCooldown = Math.max(0,tower.skillCooldown-0.35);
      }
      if (tower.towerId==='EARTH_THUNDER_TURRET' && !target.statuses.includes('SHOCKED')) target.statuses.push('SHOCKED');
      if (this.hasBranchEffect(tower, 'DOUBLE_SHOT_5') && tower.shots % 5 === 0)
        this.projectiles.push({
          ...projectile,
          runtimeId: this.id++,
          remaining: projectile.remaining + 0.04,
          duration: projectile.duration + 0.04,
          sequenceIndex: (projectile.sequenceIndex + 1) % 3,
        });
      if (
        skill.effect === 'CHAIN_STORM' &&
        tower.skillActiveRemaining > 0 &&
        !target.statuses.includes('SHOCKED')
      )
        target.statuses.push('SHOCKED');
    }
  }
  private combatMultiplier(
    tower: TowerRuntime,
    target: EnemyRuntime,
    projectile: ProjectileRuntime,
    critical: boolean,
  ) {
    const mod = this.collectModifiers(tower);
    const battleMod = this.battleUpgradeModifiers(tower);
    let value = 1;
    if (target.boss)
      value *=
        1 +
        (mod.bossDamagePercent ?? 0) +
        (tower.overdriveRemaining > 0 &&
        TOWER_AFFINITIES[tower.towerId].includes('BOSS')
          ? 0.8
          : 0);
    if (target.role === 'ARMORED' || target.statuses.includes('ARMOR'))
      value *= 1 + (mod.armoredDamagePercent ?? 0);
    if (projectile.attackPattern !== 'SINGLE')
      value *= 1 + (mod.aoeDamagePercent ?? 0);
    if (target.hp / target.maxHP < 0.18)
      value *= 1 + (mod.executeDamagePercent ?? 0);
    if (projectile.attackPattern !== 'SINGLE')
      value *= 1 + (battleMod.aoeDamagePercent ?? 0);
    if (target.hp / target.maxHP < 0.18)
      value *= 1 + (battleMod.executeDamagePercent ?? 0);
    if (this.hasBranchEffect(tower, 'FOCUS_RAMP'))
      value *= 1 + Math.min(0.5, tower.focusTime * 0.06);
    if (target.statuses.includes('VULNERABLE')) value *= 1.55;
    if(target.statuses.includes('VULNERABLE')) {
      if(this.activeBlessings.some(b=>b.blessingID==='B_OPEN_PLATES')) value *= 1.35;
      if(this.synergies().some(s=>s.synergyID==='S_SIEGE_LINE')) value *= 1.25;
      if(this.hasBranchEffect(tower,'WEAK_POINT')) value *= 1.2;
    }
    if (
      target.statuses.includes('SHOCKED') &&
      tower.towerId === 'EARTH_RAPID_FIRE_TURRET' &&
      this.synergies().some((s) => s.synergyID === 'S_RAPID_THUNDER')
    )
      value *= 1.15;
    if (
      critical &&
      projectile.attackPattern === 'AOE' &&
      this.synergies().some((s) => s.synergyID === 'S_BLAST_END')
    )
      value *= 1.18;
    return value * (1 - target.damageReduction);
  }
  private hit(
    target: EnemyRuntime,
    projectile: ProjectileRuntime,
    multiplier = 1,
  ) {
    const support = this.enemies.some(
        (e) =>
          e.state === 'ALIVE' &&
          e.supportAura > 0 &&
          pointDistance(this.enemyPoint(e),this.enemyPoint(target)) < 18,
      ),
      tower =
        this.deployed.find((t) => t.runtimeId === projectile.sourceTowerId) ??
        this.retiredTowers.get(projectile.sourceTowerId);
    if (!tower) return;
    const result = resolveDamage(
        projectile.snapshot,
        this.hasBranchEffect(tower,'IGNORE_DEFENSE')
          ? projectile.snapshot.penetration + Math.max(0,target.defense*(support?1.2:1)-projectile.snapshot.penetration)*0.55
          : target.defense*(support?1.2:1),
        this.random,
      ),
      damage =
        result.damage *
        multiplier *
        (target.boss ? projectile.bossDamageMultiplier : 1) *
        this.combatMultiplier(tower, target, projectile, result.critical);
    const applied = this.applyDamage(target, tower, damage);
    if (projectile.attackPattern==='AOE' &&
      ((result.critical && (this.synergies().some(s=>s.synergyID==='S_BLAST_END') || this.activeBlessings.some(b=>b.blessingID==='B_CHAIN_REACTION'))) ||
       (target.hp<=0 && this.hasBranchEffect(tower,'CHAIN_EXPLOSION')))) {
      for(const other of this.enemies.filter(e=>e.state==='ALIVE'&&e.runtimeId!==target.runtimeId&&pointDistance(this.enemyPoint(e),this.enemyPoint(target))<12).slice(0,4))
        this.directDamage(other,tower,damage*0.3);
    }
    this.emitHitFeedback(
      target,
      tower,
      projectile.impact,
      applied.total,
      result.critical,
      result.missed,
      applied.shielded,
      projectile.cameraShake,
    );
  }
  private applyDamage(
    target: EnemyRuntime,
    tower: TowerRuntime,
    rawDamage: number,
  ) {
    let damage = rawDamage,
      total = 0,
      shielded = false;
    if (target.shieldHP > 0) {
      const shieldDamage = Math.min(target.shieldHP, damage);
      shielded = shieldDamage > 0;
      target.shieldHP -= shieldDamage;
      damage -= shieldDamage;
      total += shieldDamage;
      this.recordDamage(tower, shieldDamage);
      if (target.shieldHP <= 0 && target.statuses.includes('BARRIER')) {
        target.statuses = target.statuses.filter((s) => s !== 'BARRIER');
        target.damageReduction = 0;
      }
    }
    if (damage > 0) {
      damage = Math.min(target.hp,damage);
      target.hp = Math.max(0, target.hp - damage);
      total += damage;
      this.recordDamage(tower, damage);
    }
    if (target.hp <= 0 && target.state === 'ALIVE') target.state = 'DYING';
    const gain =
      Math.min(0.5, (rawDamage / Math.max(1, target.maxHP)) * 4) *
      0.02 *
      (1 + (this.baseModifiers().overdriveGainPercent ?? 0));
    this.overdriveEnergy = Math.min(100, this.overdriveEnergy + gain);
    return { total, shielded };
  }
  private directDamage(
    target: EnemyRuntime,
    tower: TowerRuntime,
    damage: number,
  ) {
    const applied = this.applyDamage(
      target,
      tower,
      damage * (target.statuses.includes('VULNERABLE') ? 1.55 : 1),
    );
    const profile = TOWER_ATTACK_PROFILES[tower.towerId];
    this.emitHitFeedback(
      target,
      tower,
      profile.impact,
      applied.total,
      false,
      false,
      applied.shielded,
      profile.cameraShake,
    );
  }
  private emitHitFeedback(
    target: EnemyRuntime,
    tower: TowerRuntime,
    kind: HitFeedbackKind,
    damage: number,
    critical: boolean,
    missed: boolean,
    shielded: boolean,
    cameraShake: number,
  ) {
    const vulnerable = target.statuses.includes('VULNERABLE'),
      impactDuration =
        kind === 'EXPLOSION_HIT' || kind === 'HEAVY_HIT' ? 0.46 : 0.34;
    this.impacts.push({
      runtimeId: this.id++,
      targetId: target.runtimeId,
      towerId: tower.towerId,
      kind,
      x: target.pathX,
      y: target.pathY,
      critical,
      vulnerable,
      shielded,
      remaining: impactDuration,
      duration: impactDuration,
    });
    if (this.impacts.length > MAX_WORLD_FEEDBACK_ITEMS)
      this.impacts.splice(0, this.impacts.length - MAX_WORLD_FEEDBACK_ITEMS);

    const canAggregate = !critical && !vulnerable && !missed;
    const existing = canAggregate
      ? this.damageNumbers.find(
          (number) =>
            number.targetId === target.runtimeId &&
            number.towerId === tower.towerId &&
            number.mergeRemaining > 0 &&
            !number.critical &&
            !number.vulnerable,
        )
      : null;
    if (existing) {
      existing.runtimeId = this.id++;
      existing.amount += damage;
      existing.hitCount++;
      existing.x = target.pathX;
      existing.y = target.pathY;
      existing.shielded = existing.shielded || shielded;
      existing.remaining = existing.duration;
      existing.mergeRemaining = DAMAGE_AGGREGATION_WINDOW;
    } else {
      const runtimeId = this.id++;
      this.damageNumbers.push({
        runtimeId,
        targetId: target.runtimeId,
        towerId: tower.towerId,
        x: target.pathX,
        y: target.pathY,
        amount: damage,
        hitCount: 1,
        critical,
        vulnerable,
        shielded,
        missed,
        offsetX: ((runtimeId * 17) % 31) - 15,
        remaining: critical || vulnerable ? 1.05 : 0.86,
        duration: critical || vulnerable ? 1.05 : 0.86,
        mergeRemaining: canAggregate ? DAMAGE_AGGREGATION_WINDOW : 0,
      });
    }
    if (this.damageNumbers.length > MAX_WORLD_FEEDBACK_ITEMS)
      this.damageNumbers.splice(
        0,
        this.damageNumbers.length - MAX_WORLD_FEEDBACK_ITEMS,
      );
    this.cameraShakeRemaining = Math.max(
      this.cameraShakeRemaining,
      cameraShake,
    );
  }
  private recordDamage(tower: TowerRuntime, damage: number) {
    this.totalDamage += damage;
    tower.damageDealt += damage;
    this.damageByTower[tower.towerId] =
      (this.damageByTower[tower.towerId] ?? 0) + damage;
  }
  private updateProjectiles(delta: number) {
    for (const projectile of this.projectiles) {
      projectile.remaining -= delta;
      if (projectile.remaining > 0) continue;
      const target = this.enemies.find(
        (e) => e.runtimeId === projectile.targetId && e.state === 'ALIVE',
      );
      if (!target) continue;
      this.hit(target, projectile);
      const source = this.deployed.find(t=>t.runtimeId===projectile.sourceTowerId);
      if(source && this.hasBranchEffect(source,'BURN_FIELD') && this.damageZones.length < 18) {
        this.damageZones.push({id:this.id++,x:target.pathX,y:target.pathY,radius:12,remaining:3,cooldown:0,tower:source,damage:projectile.snapshot.attack*0.18});
      }
      if (projectile.maxTargets > 1) {
        const extras = this.enemies
          .filter(
            (e) =>
              e.state === 'ALIVE' &&
              e.runtimeId !== target.runtimeId &&
              (projectile.attackPattern === 'AOE'
                ? pointDistance(this.enemyPoint(e),this.enemyPoint(target)) < 14*(1+(source ? this.battleUpgradeModifiers(source).radiusPercent ?? 0 : 0))
                : projectile.towerId==='EARTH_ARMOR_PIERCING_TURRET' || projectile.towerId==='EARTH_EMPEROR_ANNIHILATION_TURRET'
                  ? !!source && onShotLine(this.towerPoint(source),this.enemyPoint(target),this.enemyPoint(e)) && pointDistance(this.towerPoint(source),this.enemyPoint(e))<towerRangeRadius(source.stats.range)*1.4
                  : pointDistance(this.enemyPoint(e),this.enemyPoint(target)) < 22),
          )
          .sort(
            (a, b) =>
              pointDistance(this.enemyPoint(a),this.enemyPoint(target)) -
              pointDistance(this.enemyPoint(b),this.enemyPoint(target)),
          )
          .slice(0, projectile.maxTargets - 1);
        extras.forEach((enemy, index) =>
          this.hit(
            enemy,
            projectile,
            projectile.skillPierce
              ? 1
              : projectile.attackPattern === 'CHAIN'
                ? Math.max(0.48, (source && this.hasBranchEffect(source,'CHAIN_PRESERVE') ? 0.95-index*0.02 : 0.82-index*0.08))
                : source && this.hasBranchEffect(source,'PIERCE_PRESERVE') ? 0.9 : 0.68,
          ),
        );
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.remaining > 0);
    for (const runtimeId of this.retiredTowers.keys())
      if (!this.projectiles.some((p) => p.sourceTowerId === runtimeId))
        this.retiredTowers.delete(runtimeId);
  }
  private rewardEnemyKill(enemy: EnemyRuntime) {
    const multiplier = 1 + (this.baseModifiers().goldGainPercent ?? 0),
      reward = Math.max(1, Math.round(enemy.battleGoldReward * multiplier));
    this.changeGold(reward, enemy.boss ? 'Boss 擊破' : `${enemy.name} 擊破`);
    this.goldEarned += reward;
  }
  private recordEconomyCheckpoint() {
    const averageBattleLevel = this.deployed.length
      ? this.deployed.reduce((sum, tower) => sum + tower.battleLevel, 0) /
        this.deployed.length
      : 0;
    this.economyByWave[this.wave] = {
      gold: this.battleGold,
      earned:this.goldEarned,
      spent:this.goldSpent,
      towerCount: this.deployed.length,
      averageBattleLevel,
    };
  }
  private finalizeDeaths() {
    for (const enemy of this.enemies) {
      if (enemy.state !== 'DYING') continue;
      if (enemy.hp <= 0) {
        this.totalKills++;
        this.rewardEnemyKill(enemy);
        const gain = enemy.boss ? 15 : enemy.elite ? 2 : 0.35;
        this.overdriveEnergy = Math.min(
          100,
          this.overdriveEnergy +
            gain * (1 + (this.baseModifiers().overdriveGainPercent ?? 0)),
        );
      }
      enemy.state = 'DEAD';
      for (const tower of this.deployed)
        if (tower.targetId === enemy.runtimeId) tower.targetId = null;
    }
    this.enemies = this.enemies.filter((e) => e.state !== 'DEAD');
  }
  private modifierStack() {
    const rows = ['BASE → LEVEL → STAR → CAREER'];
    if (this.deployed.some((tower) => tower.battleLevel > 1))
      rows.push('BATTLE LEVEL → BRANCH');
    if (this.synergies().length)
      rows.push(
        `SYNERGY · ${this.synergies()
          .map((s) => s.displayName)
          .join(' / ')}`,
      );
    if (this.activeBlessings.length)
      rows.push(
        `BLESSING · ${this.activeBlessings.map((item) => BattleBlessingManager.displayName(item)).join(' / ')}`,
      );
    if (this.deployed.some((t) => t.skillActiveRemaining > 0))
      rows.push('ACTIVE SKILL');
    if (this.deployed.some((t) => t.overdriveRemaining > 0))
      rows.push('OVERDRIVE');
    rows.push('DUNGEON → FINAL');
    return rows;
  }
  private makeDefeatHint() {
    if(this.lastLeakHint) return this.lastLeakHint;
    const boss = this.enemies.find((e) => e.boss);
    if (boss?.shieldHP)
      return '頭目屏障仍未擊破；保留 Overdrive 與持續火力處理護盾。';
    if (boss?.statuses.includes('ENRAGE'))
      return '頭目狂化後抵達基地；將絕對防線保留至最後階段。';
    if (this.enemies.some((e) => e.enemyId === 'EARTH_SUPPORT'))
      return '裂隙支援者仍在強化敵軍；切換 STRONGEST 優先處理。';
    if (this.baseDamageTaken > this.dungeon.startingBaseHP * 0.5)
      return '高速敵人穿越防線；使用連射技能或調整 FIRST 鎖定。';
    return '本次傷害曲線不足；嘗試不同祝福流派或在 Boss 弱點期爆發。';
  }
  private clearRunEffects() {
    this.battleGold=0;
    this.projectiles=[]; this.damageZones=[]; this.impacts=[]; this.damageNumbers=[];
    this.overdriveEnergy=0;
  }
  private updateDamageZones(delta:number) {
    for(const zone of this.damageZones) {
      zone.remaining-=delta; zone.cooldown-=delta;
      if(zone.cooldown>0) continue;
      zone.cooldown=0.5;
      for(const enemy of this.enemies.filter(e=>e.state==='ALIVE' && pointDistance(this.enemyPoint(e),zone)<=zone.radius))
        this.directDamage(enemy,zone.tower,zone.damage);
    }
    this.damageZones=this.damageZones.filter(z=>z.remaining>0);
  }
  debugJump(wave: number) {
    this.enemies = [];
    this.projectiles = [];
    this.impacts = [];
    this.damageNumbers = [];
    this.spawnQueue = [];
    this.blessingOptions = [];
    this.wave = Math.min(25, Math.max(1, Math.floor(wave))) - 1;
    this.startNextWave();
  }
  debugKillAll() {
    this.spawnQueue = [];
    for (const enemy of this.enemies) {
      enemy.hp = 0;
      enemy.shieldHP = 0;
      enemy.state = 'DYING';
    }
    this.finalizeDeaths();
  }
  debugSetBaseHP(value: number) {
    this.baseHP = Math.max(
      0,
      Math.min(this.dungeon.startingBaseHP, Math.floor(value)),
    );
  }
  debugForceVictory() {
    this.wave = 25;
    this.enemies = [];
    this.projectiles = [];
    this.impacts = [];
    this.damageNumbers = [];
    this.spawnQueue = [];
    this.state = 'VICTORY';
    this.notice = 'DEBUG · VICTORY';
  }
  debugForceDefeat() {
    this.baseHP = 0;
    this.state = 'DEFEAT';
    this.defeatHint = this.makeDefeatHint();
    this.notice = 'DEBUG · DEFEAT';
  }
  debugFillOverdrive() {
    this.overdriveEnergy = 100;
  }
  debugAddGold(amount = 1000) {
    this.changeGold(Math.max(0, Math.floor(amount)), 'DEBUG GOLD');
  }
  debugResetOverdrive() {
    this.overdriveEnergy = 0;
  }
  debugResetSkills() {
    for (const tower of this.deployed) tower.skillCooldown = 0;
    this.careerSkillCooldown = 0;
  }
  debugOpenBlessing() {
    this.openBlessingChoice();
  }
  debugBossVulnerable() {
    const boss = this.enemies.find((e) => e.boss);
    if (!boss) return false;
    boss.statuses.push('VULNERABLE');
    boss.defense = boss.baseDefense * 0.5;
    boss.vulnerableRemaining = 8;
    this.bossTelegraph = 'DEBUG · VULNERABLE';
    return true;
  }
  debugBossShield() {
    const boss = this.enemies.find((e) => e.boss);
    if (!boss) return false;
    boss.shieldHP += boss.maxHP * 0.3;
    boss.maxShieldHP = Math.max(boss.maxShieldHP, boss.shieldHP);
    return true;
  }
  debugSpawnSupport() {
    this.spawnEnemy('EARTH_SUPPORT');
  }
  debugSpawnBoss() {
    this.wave = 25;
    this.state = 'WAVE_ACTIVE';
    this.spawnEnemy('EARTH_BOSS');
    const boss = this.enemies.find((enemy) => enemy.boss);
    if (boss) {
      boss.speed = 0;
      boss.actualSpeed = 0;
      boss.baseSpeed = 0;
    }
  }
  debugSetBossHP(percent: number) {
    const boss = this.enemies.find((e) => e.boss);
    if (!boss) return false;
    boss.hp = boss.maxHP * Math.max(0.01, Math.min(1, percent));
    return true;
  }
  debugSpawnDummy() {
    this.state = 'WAVE_ACTIVE';
    this.spawnEnemy('EARTH_GRUNT');
    const dummy = this.enemies[this.enemies.length - 1];
    if (!dummy) return false;
    dummy.name = 'VFX 測試傀儡';
    dummy.maxHP *= 100;
    dummy.hp = dummy.maxHP;
    dummy.speed = 0;
    dummy.actualSpeed = 0;
    dummy.baseSpeed = 0;
    dummy.progress = 0.52;
    const point = sampleBattlePath(
      dummy.progress,
      this.topology(),
      dummy.pathBranch,
    );
    dummy.pathX = point.x;
    dummy.pathY = point.y;
    dummy.heading = point.heading;
    dummy.targetWaypoint = point.targetWaypoint;
    return true;
  }
  debugSetEnemySpeedMultiplier(multiplier: number) {
    const value = Math.max(0, Math.min(4, multiplier));
    for (const enemy of this.enemies) enemy.speed = enemy.baseSpeed * value;
  }
}
