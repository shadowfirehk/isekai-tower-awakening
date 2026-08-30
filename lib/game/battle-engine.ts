import { calculateTowerStats } from './tower-stats';
import { getOwnedTower, getTowerById, STARTER_TOWER_ID } from './towers';
import { DamageSnapshot, makeDamageSnapshot, resolveDamage, selectTarget } from './combat';
import { EARTH_TUTORIAL_DUNGEON, ENEMY_CATALOG, TUTORIAL_WAVES } from './dungeon-data';
import { BattleState, EnemyId, FinalTowerStats, PlayerSave, TargetingMode, TowerId } from './types';

export interface EnemyRuntime {
  runtimeId: number;
  enemyId: EnemyId;
  name: string;
  hp: number;
  maxHP: number;
  defense: number;
  speed: number;
  baseDamage: number;
  progress: number;
  boss: boolean;
  state: 'ALIVE' | 'DYING' | 'DEAD';
}

export interface TowerRuntime {
  runtimeId: number;
  towerId: TowerId;
  slot: number;
  progress: number;
  stats: FinalTowerStats;
  cooldown: number;
  targetId: number | null;
  targetingMode: TargetingMode;
  shots: number;
}

export interface ProjectileRuntime {
  runtimeId: number;
  fromSlot: number;
  targetId: number;
  remaining: number;
  snapshot: DamageSnapshot;
}

interface SpawnEntry { enemyId: EnemyId; delay: number }

export interface BattleSnapshot {
  state: BattleState;
  wave: number;
  baseHP: number;
  maxBaseHP: number;
  paused: boolean;
  speed: 1 | 2;
  deployed: TowerRuntime[];
  enemies: EnemyRuntime[];
  projectiles: ProjectileRuntime[];
  totalKills: number;
  totalDamage: number;
  notice: string;
}

const SLOT_PROGRESS = [0.18, 0.38, 0.61, 0.82];

export class TowerFactory {
  static create(save: PlayerSave, towerId: TowerId, slot: number, runtimeId: number): TowerRuntime | null {
    const data = getTowerById(towerId);
    const progress = getOwnedTower(save, towerId);
    if (!data || !progress || slot < 0 || slot >= SLOT_PROGRESS.length) return null;
    return {
      runtimeId,
      towerId,
      slot,
      progress: SLOT_PROGRESS[slot],
      stats: calculateTowerStats(data, progress, save),
      cooldown: 0,
      targetId: null,
      targetingMode: 'FIRST',
      shots: 0,
    };
  }
}

export class BattleEngine {
  private save: PlayerSave;
  private state: BattleState = 'SETUP';
  private wave = 0;
  private baseHP: number = EARTH_TUTORIAL_DUNGEON.startingBaseHP;
  private paused = false;
  private speed: 1 | 2 = 1;
  private deployed: TowerRuntime[] = [];
  private enemies: EnemyRuntime[] = [];
  private projectiles: ProjectileRuntime[] = [];
  private spawnQueue: SpawnEntry[] = [];
  private spawnTimer = 0;
  private stateTimer = 0;
  private id = 1;
  private totalKills = 0;
  private totalDamage = 0;
  private notice = '選擇部署位置，建立第一道防線。';

  constructor(save: PlayerSave) {
    this.save = save;
  }

  snapshot(): BattleSnapshot {
    return {
      state: this.state,
      wave: this.wave,
      baseHP: this.baseHP,
      maxBaseHP: EARTH_TUTORIAL_DUNGEON.startingBaseHP,
      paused: this.paused,
      speed: this.speed,
      deployed: this.deployed.map(tower => ({ ...tower, stats: { ...tower.stats } })),
      enemies: this.enemies.map(enemy => ({ ...enemy })),
      projectiles: this.projectiles.map(projectile => ({ ...projectile, snapshot: { ...projectile.snapshot } })),
      totalKills: this.totalKills,
      totalDamage: this.totalDamage,
      notice: this.notice,
    };
  }

  deploy(slot: number, towerId: TowerId = STARTER_TOWER_ID) {
    if (!['SETUP', 'READY', 'INTERMISSION', 'WAVE_ACTIVE'].includes(this.state)) return { ok: false, error: '目前狀態無法部署炮塔。' };
    if (this.deployed.some(tower => tower.slot === slot)) return { ok: false, error: '此部署槽已被佔用。' };
    if (this.deployed.length >= EARTH_TUTORIAL_DUNGEON.deploymentCap) return { ok: false, error: `部署上限為 ${EARTH_TUTORIAL_DUNGEON.deploymentCap} 座。` };
    const tower = TowerFactory.create(this.save, towerId, slot, this.id++);
    if (!tower) return { ok: false, error: '尚未擁有此炮塔，或部署槽無效。' };
    this.deployed.push(tower);
    this.state = this.state === 'SETUP' ? 'READY' : this.state;
    this.notice = `已在 SLOT ${slot + 1} 部署 ${getTowerById(towerId)?.name ?? towerId}。`;
    return { ok: true as const };
  }

  setTargeting(runtimeId: number, mode: TargetingMode) {
    const tower = this.deployed.find(item => item.runtimeId === runtimeId);
    if (!tower || !['FIRST', 'NEAREST'].includes(mode)) return false;
    tower.targetingMode = mode;
    return true;
  }

  start() {
    if (this.deployed.length === 0) return { ok: false, error: '至少部署一座炮塔才能開始。' };
    if (!['READY', 'SETUP'].includes(this.state)) return { ok: false, error: '戰鬥已經開始。' };
    this.startNextWave();
    return { ok: true as const };
  }

  togglePause() { this.paused = !this.paused; }
  toggleSpeed() { this.speed = this.speed === 1 ? 2 : 1; }

  tick(rawDelta: number) {
    if (this.paused || ['VICTORY', 'DEFEAT', 'RESULT', 'EXITING'].includes(this.state)) return;
    const delta = Math.min(0.12, Math.max(0, rawDelta)) * this.speed;
    if (['BOSS_WARNING', 'WAVE_STARTING', 'WAVE_CLEAR', 'INTERMISSION'].includes(this.state)) {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) this.advanceTimedState();
      return;
    }
    if (this.state !== 'WAVE_ACTIVE') return;
    this.updateSpawning(delta);
    this.updateEnemies(delta);
    this.updateTowers(delta);
    this.updateProjectiles(delta);
    this.finalizeDeaths();
    if (this.baseHP <= 0) {
      this.baseHP = 0;
      this.state = 'DEFEAT';
      this.notice = '基地核心失守。';
      return;
    }
    if (!this.spawnQueue.length && !this.enemies.some(enemy => enemy.state === 'ALIVE') && !this.projectiles.length) {
      this.state = 'WAVE_CLEAR';
      this.stateTimer = 0.65;
      this.notice = `WAVE ${String(this.wave).padStart(2, '0')} CLEAR`;
    }
  }

  private startNextWave() {
    const next = Math.min(EARTH_TUTORIAL_DUNGEON.totalWaves, this.wave + 1);
    this.wave = next;
    const waveData = TUTORIAL_WAVES[next - 1];
    this.spawnQueue = waveData.groups.flatMap(group =>
      Array.from({ length: group.count }, () => ({ enemyId: group.enemyId, delay: group.interval })),
    );
    this.spawnTimer = 0.15;
    if (waveData.boss) {
      this.state = 'BOSS_WARNING';
      this.stateTimer = 1.05;
      this.notice = `WARNING · BOSS WAVE ${next}`;
    } else {
      this.state = 'WAVE_STARTING';
      this.stateTimer = 0.45;
      this.notice = `WAVE ${String(next).padStart(2, '0')} INCOMING`;
    }
  }

  private advanceTimedState() {
    if (this.state === 'BOSS_WARNING') {
      this.state = 'WAVE_STARTING';
      this.stateTimer = 0.35;
    } else if (this.state === 'WAVE_STARTING') {
      this.state = 'WAVE_ACTIVE';
    } else if (this.state === 'WAVE_CLEAR') {
      if (this.wave >= EARTH_TUTORIAL_DUNGEON.totalWaves) {
        this.state = 'VICTORY';
        this.notice = '25 波全數清除 · 地球核心已穩定。';
      } else {
        this.state = 'INTERMISSION';
        this.stateTimer = 0.9;
      }
    } else if (this.state === 'INTERMISSION') {
      this.startNextWave();
    }
  }

  private updateSpawning(delta: number) {
    if (!this.spawnQueue.length) return;
    this.spawnTimer -= delta;
    if (this.spawnTimer > 0) return;
    const entry = this.spawnQueue.shift();
    if (!entry) return;
    this.spawnEnemy(entry.enemyId);
    this.spawnTimer = Math.max(0.12, entry.delay);
  }

  private spawnEnemy(enemyId: EnemyId) {
    const data = ENEMY_CATALOG[enemyId];
    const hpMultiplier = 1 + (this.wave - 1) * 0.08;
    const damageMultiplier = 1 + (this.wave - 1) * 0.03;
    const bossMultiplier = data.boss ? TUTORIAL_WAVES[this.wave - 1].bossMultiplier : 1;
    const maxHP = data.maxHP * hpMultiplier * bossMultiplier;
    this.enemies.push({
      runtimeId: this.id++,
      enemyId,
      name: data.name,
      hp: maxHP,
      maxHP,
      defense: data.defense + Math.max(0, this.wave - 10) * 0.5,
      speed: data.speed,
      baseDamage: Math.max(1, Math.round(data.baseDamage * damageMultiplier)),
      progress: 0,
      boss: data.boss,
      state: 'ALIVE',
    });
  }

  private updateEnemies(delta: number) {
    for (const enemy of this.enemies) {
      if (enemy.state !== 'ALIVE') continue;
      enemy.progress += enemy.speed * delta;
      if (enemy.progress < 1) continue;
      enemy.progress = 1;
      enemy.state = 'DYING';
      this.baseHP -= enemy.boss ? 5 : 1;
    }
  }

  private updateTowers(delta: number) {
    for (const tower of this.deployed) {
      tower.cooldown -= delta;
      const current = this.enemies.find(enemy => enemy.runtimeId === tower.targetId && enemy.state === 'ALIVE') ?? null;
      const inRange = current && Math.abs(current.progress - tower.progress) <= tower.stats.range / 20;
      const target = inRange ? current : selectTarget(this.enemies, tower.progress, tower.stats.range, tower.targetingMode);
      tower.targetId = target?.runtimeId ?? null;
      if (!target || tower.cooldown > 0) continue;
      tower.cooldown = 1 / Math.max(0.1, tower.stats.attackSpeed);
      tower.shots += 1;
      this.projectiles.push({
        runtimeId: this.id++,
        fromSlot: tower.slot,
        targetId: target.runtimeId,
        remaining: 0.16,
        snapshot: makeDamageSnapshot(tower.stats),
      });
    }
  }

  private updateProjectiles(delta: number) {
    for (const projectile of this.projectiles) {
      projectile.remaining -= delta;
      if (projectile.remaining > 0) continue;
      const target = this.enemies.find(enemy => enemy.runtimeId === projectile.targetId && enemy.state === 'ALIVE');
      if (!target) continue;
      const result = resolveDamage(projectile.snapshot, target.defense);
      target.hp = Math.max(0, target.hp - result.damage);
      this.totalDamage += result.damage;
      if (target.hp <= 0 && target.state === 'ALIVE') target.state = 'DYING';
    }
    this.projectiles = this.projectiles.filter(projectile => projectile.remaining > 0);
  }

  private finalizeDeaths() {
    for (const enemy of this.enemies) {
      if (enemy.state !== 'DYING') continue;
      if (enemy.hp <= 0) this.totalKills += 1;
      enemy.state = 'DEAD';
      for (const tower of this.deployed) if (tower.targetId === enemy.runtimeId) tower.targetId = null;
    }
    this.enemies = this.enemies.filter(enemy => enemy.state !== 'DEAD');
  }

  debugJump(wave: number) {
    const target = Math.min(25, Math.max(1, Math.floor(wave)));
    this.enemies = [];
    this.projectiles = [];
    this.spawnQueue = [];
    this.wave = target - 1;
    this.startNextWave();
  }

  debugKillAll() {
    this.spawnQueue = [];
    for (const enemy of this.enemies) { enemy.hp = 0; enemy.state = 'DYING'; }
    this.finalizeDeaths();
  }

  debugSetBaseHP(value: number) { this.baseHP = Math.max(0, Math.min(99, Math.floor(value))); }
  debugForceVictory() { this.wave = 25; this.enemies = []; this.projectiles = []; this.spawnQueue = []; this.state = 'VICTORY'; this.notice = 'DEBUG · VICTORY'; }
  debugForceDefeat() { this.baseHP = 0; this.state = 'DEFEAT'; this.notice = 'DEBUG · DEFEAT'; }
}
