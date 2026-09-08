import {
  UNIT_ARCHETYPES as UNITS,
  UNIT_IDS,
  FORMATIONS,
  ORDERS,
  BRANCHES,
  UPGRADE_COSTS,
  SLOTS,
  distance,
  samplePath,
  type UnitId,
  type FormationId,
  type Point,
  type FieldOrderData,
} from './data';
import type { WWISave, RunRecord } from './save';
import { permanentBonus } from './save';
import {
  VERDUN_SCENARIO_ID,
  VERDUN_WAVE_COUNT,
  assertPlayableScenario,
  unitVariantForScenario,
  orderAvailable,
} from './campaign';

export type BattleState =
  | 'SETUP'
  | 'ACTIVE'
  | 'INTERMISSION'
  | 'ORDERS'
  | 'HELD'
  | 'LOST';
export interface DefensiveUnitRuntime {
  id: number;
  unit: UnitId;
  slot: number;
  level: number;
  branches: string[];
  invested: number;
  reload: number;
  skillCD: number;
  boost: number;
  shots: number;
  damage: number;
  repair: number;
  priority: 'FIRST' | 'STRONG';
}
export interface EnemyFormation extends Point {
  id: number;
  type: FormationId;
  hp: number;
  maxHP: number;
  progress: number;
  lane: number;
  suppressed: number;
  barrageSlow: number;
  major: boolean;
  phase: number;
  timer: number;
  stage: 'ADVANCE' | 'PREPARATION' | 'EXPOSED';
}
export interface Effect {
  id: number;
  kind: 'RIFLE' | 'MG' | 'ARTILLERY' | 'IMPACT' | 'REPAIR';
  from: Point;
  to: Point;
  age: number;
  duration: number;
  source: number;
}
export interface BattleSnapshot {
  state: BattleState;
  wave: number;
  clearedWaves: number;
  strength: number;
  maxStrength: number;
  resource: number;
  command: number;
  paused: boolean;
  speed: number;
  time: number;
  intermission: number;
  positions: DefensiveUnitRuntime[];
  formations: EnemyFormation[];
  effects: Effect[];
  orders: string[];
  offers: FieldOrderData[];
  notice: string;
  telegraph: string;
  disruption: number;
  officerCD: number;
  earned: number;
  spent: number;
  commandUses: number;
  repelled: number;
  decisionInterval: number;
}
type Action = { ok: true } | { ok: false; error: string };
const ok: Action = { ok: true };
const no = (error: string): Action => ({ ok: false, error });
export class VerdunEngine {
  private state: BattleState = 'SETUP';
  private wave = 0;
  private clearedWaves = 0;
  private strength: number;
  private maxStrength: number;
  private resource = 300;
  private command = 0;
  private paused = false;
  private speed = 1;
  private time = 0;
  private waveTime = 0;
  private intermission = 0;
  private positions: DefensiveUnitRuntime[] = [];
  private formations: EnemyFormation[] = [];
  private effects: Effect[] = [];
  private shells: {
    source: number;
    target: Point;
    targetId: number;
    damage: number;
    radius: number;
    remaining: number;
    precision: boolean;
  }[] = [];
  private orders: string[] = [];
  private offers: FieldOrderData[] = [];
  private notice = '選擇兵種，再點擊空陣地部署。';
  private telegraph = '';
  private disruption = 0;
  private officerCD = 0;
  private slowing = 0;
  private elapsedSpawn = 0;
  private queue: { type: FormationId; major: boolean; at: number }[] = [];
  private sequence = 1;
  private rng: number;
  private earned = 0;
  private spent = 0;
  private commandUses = 0;
  private repelled = 0;
  private decisions: number[] = [];
  private sold: DefensiveUnitRuntime[] = [];
  private suppressionNext = 0;
  private suppressionDue: number | null = null;
  readonly loadout: UnitId[];
  constructor(
    readonly save: WWISave,
    seed = Date.now(),
    scenarioId = VERDUN_SCENARIO_ID,
  ) {
    const scenario = assertPlayableScenario(
      scenarioId,
      save.faction,
      save.navigation.selectedNation ?? 'FRANCE',
      save.navigation.selectedYear,
    );
    if (save.loadout.some((id) => !unitVariantForScenario(id, scenario)))
      throw new Error('此情境尚無相符的國家兵種。');
    this.loadout = [...save.loadout];
    if (
      this.loadout.length !== 3 ||
      new Set(this.loadout).size !== 3 ||
      this.loadout.some((id) => !UNIT_IDS.includes(id))
    )
      throw new Error('需要三種不同兵種。');
    this.maxStrength = this.strength = save.doctrine === 'DEFENSE' ? 24 : 20;
    this.rng = seed >>> 0 || 1;
  }
  private random() {
    let x = this.rng;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rng = x >>> 0;
    return this.rng / 4294967296;
  }
  private terminal() {
    return this.state === 'HELD' || this.state === 'LOST';
  }
  private awaitingOrder() {
    return this.state === 'ORDERS';
  }
  private mod(id: string) {
    return this.orders.includes(id);
  }
  private decision() {
    this.decisions.push(this.time);
  }
  private engineers(slot: number) {
    return this.positions.filter(
      (p) =>
        p.unit === 'ENGINEER' &&
        distance(SLOTS[slot], SLOTS[p.slot]) <= this.range(p),
    );
  }
  buildCost(id: UnitId, slot: number) {
    const efficiency = this.engineers(slot).some((p) =>
      p.branches.includes('ENGINEER_B5'),
    )
      ? 0.15
      : 0;
    return Math.ceil(
      UNITS[id].cost *
        (this.save.doctrine === 'LOGISTICS' ? 0.92 : 1) *
        (1 - efficiency),
    );
  }
  upgradeCost(p: DefensiveUnitRuntime) {
    const support = this.engineers(p.slot).filter((e) => e.id !== p.id);
    const reduction = support.length
      ? (support.some((e) => e.branches.includes('ENGINEER_A3')) ? 0.2 : 0.1) +
        (this.mod('ENGINEERS') ? 0.08 : 0)
      : 0;
    return p.level >= 5
      ? 0
      : Math.ceil(
          UPGRADE_COSTS[p.level] *
            (1 - reduction) *
            (this.mod('ECONOMY') ? 0.88 : 1) *
            (this.save.doctrine === 'LOGISTICS' ? 0.92 : 1),
        );
  }
  deploy(slot: number, id: UnitId): Action {
    if (!Number.isInteger(slot) || !SLOTS[slot] || !this.loadout.includes(id))
      return no('無效的兵種或陣地。');
    if (this.terminal() || this.state === 'ORDERS' || this.paused)
      return no('目前不能部署。');
    if (this.positions.some((p) => p.slot === slot))
      return no('此陣地已有部隊。');
    const cost = this.buildCost(id, slot);
    if (this.resource < cost) return no(`需要 ${cost} 戰地資源。`);
    this.resource -= cost;
    this.spent += cost;
    this.positions.push({
      id: this.sequence++,
      unit: id,
      slot,
      level: 1,
      branches: [],
      invested: cost,
      reload: 0,
      skillCD: 0,
      boost: 0,
      shots: 0,
      damage: 0,
      repair: 0,
      priority: 'FIRST',
    });
    this.decision();
    this.notice = `${UNITS[id].name} 已就位。`;
    return ok;
  }
  upgrade(id: number, branch?: string): Action {
    const p = this.positions.find((p) => p.id === id);
    if (!p || p.level >= 5 || this.terminal() || this.state === 'ORDERS')
      return no('無法升級此陣地。');
    const level = p.level + 1;
    if (level !== 3 && level !== 5 && branch)
      return no('此等級尚未開放陣地專精。');
    if (
      (level === 3 || level === 5) &&
      !BRANCHES[p.unit][level].some((b) => b.id === branch)
    )
      return no('請選擇陣地專精。');
    const cost = this.upgradeCost(p);
    if (this.resource < cost) return no(`需要 ${cost} 戰地資源。`);
    this.resource -= cost;
    this.spent += cost;
    p.invested += cost;
    p.level = level;
    if (branch) p.branches.push(branch);
    if (branch === 'ENGINEER_B3')
      this.strength = Math.min(this.maxStrength, this.strength + 2);
    this.decision();
    this.notice = `${UNITS[p.unit].name} 已完成陣地升級 ${level}。`;
    return ok;
  }
  sell(id: number): Action {
    if (this.terminal() || this.state === 'ORDERS' || this.paused)
      return no('目前不能撤收。');
    const p = this.positions.find((p) => p.id === id);
    if (!p) return no('陣地已撤收。');
    this.resource += Math.floor((p.invested * 70) / 100);
    this.sold.push({ ...p });
    this.positions = this.positions.filter((p) => p.id !== id);
    this.effects = this.effects.filter((e) => e.source !== id);
    this.shells = this.shells.filter((shell) => shell.source !== id);
    this.decision();
    return ok;
  }
  setPriority(id: number) {
    const p = this.positions.find((p) => p.id === id);
    if (p) {
      p.priority = p.priority === 'FIRST' ? 'STRONG' : 'FIRST';
      this.decision();
    }
  }
  togglePause() {
    if (!this.terminal()) this.paused = !this.paused;
  }
  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
  }
  start(): Action {
    if (this.state !== 'SETUP') return no('戰鬥已開始。');
    if (!this.positions.some((p) => p.unit !== 'ENGINEER'))
      return no('先部署至少一處作戰陣地。');
    this.nextWave();
    return ok;
  }
  private nextWave() {
    this.wave++;
    this.state = 'ACTIVE';
    this.waveTime = 0;
    this.elapsedSpawn = 0;
    this.telegraph = '';
    this.suppressionNext = 16;
    this.suppressionDue = null;
    const act = Math.ceil(this.wave / 5),
      types: FormationId[] = [];
    for (let i = 0; i < 5 + act; i++) types.push('INFANTRY');
    if (this.wave >= 2)
      for (let i = 0; i < 2 + Math.floor(act / 2); i++) types.push('ASSAULT');
    if (this.wave >= 4)
      for (let i = 0; i < Math.min(3, act); i++) types.push('SUPPORTED');
    if (this.wave >= 8)
      for (let i = 0; i < Math.min(2, act - 1); i++) types.push('ELITE');
    this.queue = types.map((type, i) => ({ type, major: false, at: i * 1.65 }));
    if (this.wave % 5 === 0)
      this.queue.push({
        type: 'ELITE',
        major: true,
        at: 5 + types.length * 1.65,
      });
    this.notice = `第 ${this.wave} 輪攻勢 · ${this.wave % 5 === 0 ? '敵軍重大攻勢' : '堅守交通線'}`;
  }
  private spawn(type: FormationId, major: boolean) {
    const base = FORMATIONS[type],
      lane = Math.floor(this.random() * 2);
    const hp = major
      ? 650 + Math.ceil(this.wave / 5) * 320
      : base.hp * (1 + this.wave * 0.065);
    this.formations.push({
      id: this.sequence++,
      type,
      major,
      hp,
      maxHP: hp,
      progress: 0,
      lane,
      ...samplePath(0, lane),
      suppressed: 0,
      barrageSlow: 0,
      phase: 1,
      timer: major ? 7 : 0,
      stage: 'ADVANCE',
    });
  }
  chooseOrder(id: string): Action {
    if (this.state !== 'ORDERS' || !this.offers.some((o) => o.id === id))
      return no('請選擇司令部提供的命令。');
    this.orders.push(id);
    if (id === 'RESERVE') {
      this.resource += 100;
      this.earned += 100;
    }
    if (id === 'WORKS') {
      this.maxStrength += 2;
      this.strength = Math.min(this.maxStrength, this.strength + 4);
    }
    if (id === 'RISK') {
      this.maxStrength = Math.max(6, this.maxStrength - 4);
      this.strength = Math.min(this.maxStrength, this.strength);
    }
    this.offers = [];
    this.state = 'INTERMISSION';
    this.intermission = 5;
    this.decision();
    return ok;
  }
  private openOrders() {
    this.state = 'ORDERS';
    this.offers = [];
    const scenario = assertPlayableScenario(
      VERDUN_SCENARIO_ID,
      'ENTENTE',
      'FRANCE',
      1916,
    );
    const available = ORDERS.filter(
      (o) => !this.mod(o.id) && orderAvailable(o.availability, scenario),
    );
    for (const category of ['SUPPORT', 'GENERAL', 'TACTICAL']) {
      let pool = available.filter(
        (o) => o.category === category && !this.offers.includes(o),
      );
      if (category === 'SUPPORT') {
        const relevant = pool.filter((o) => this.loadout.includes(o.unit!));
        if (relevant.length) pool = relevant;
      }
      if (pool.length)
        this.offers.push(pool[Math.floor(this.random() * pool.length)]);
    }
  }
  activateSkill(id: number): Action {
    const p = this.positions.find((p) => p.id === id);
    if (
      !p ||
      this.state !== 'ACTIVE' ||
      this.paused ||
      p.skillCD > 0 ||
      this.disruption > 0
    )
      return no('技能尚未就緒，或通訊暫時受阻。');
    if (p.unit === 'ENGINEER') {
      this.strength = Math.min(this.maxStrength, this.strength + 2);
      this.fx('REPAIR', SLOTS[p.slot], SLOTS[p.slot], p.id, 1);
    } else if (p.unit === 'ARTILLERY') {
      const target = this.targets(p)[0];
      if (!target) return no('射程內沒有目標。');
      this.launchShell(p, target, UNITS.ARTILLERY.damage * 2, 12, 0.9);
    } else p.boost = 7;
    p.skillCD = this.mod('STAFF') ? 24 : 30;
    this.decision();
    return ok;
  }
  activateCommand(id: number): Action {
    const p = this.positions.find((p) => p.id === id);
    if (
      !p ||
      this.command < 100 ||
      this.state !== 'ACTIVE' ||
      this.paused ||
      this.disruption > 0
    )
      return no('指揮值未滿或通訊暫時受阻。');
    this.command = 0;
    this.commandUses++;
    this.decision();
    if (p.unit === 'ENGINEER') {
      this.strength = Math.min(this.maxStrength, this.strength + 5);
      this.resource += 35;
      this.earned += 35;
    } else {
      p.boost = 12;
      p.skillCD = 0;
    }
    this.notice =
      p.unit === 'ENGINEER'
        ? '戰場指揮：防線準備與緊急補給。'
        : '戰場指揮：12 秒快速補給與集中射擊。';
    return ok;
  }
  activateOfficer(): Action {
    if (
      this.state !== 'ACTIVE' ||
      this.paused ||
      this.officerCD > 0 ||
      this.disruption > 0
    )
      return no('指揮官命令尚未就緒。');
    const d = this.save.doctrine;
    if (d === 'DEFENSE')
      this.strength = Math.min(this.maxStrength, this.strength + 4);
    if (d === 'LOGISTICS') {
      this.resource += 70;
      this.earned += 70;
    }
    if (d === 'ASSAULT') this.slowing = 8;
    if (d === 'ARTILLERY') {
      const target = [...this.formations].sort(
        (a, b) => b.progress - a.progress,
      )[0];
      if (!target) return no('目前沒有目標。');
      for (const e of this.formations.filter((e) => distance(e, target) < 15)) {
        e.hp -= 200;
      }
      this.fx('IMPACT', target, target, 0, 1);
    }
    this.officerCD = 65;
    this.decision();
    return ok;
  }
  range(p: DefensiveUnitRuntime) {
    return (
      UNITS[p.unit].range *
      (p.unit === 'ENGINEER' ? 1 + permanentBonus(this.save, p.unit) : 1) *
      (p.branches.includes('ENGINEER_A5') ? 1.2 : 1) *
      (p.unit === 'ARTILLERY' && SLOTS[p.slot].terrain === '高地' ? 1.12 : 1) *
      (p.unit === 'ARTILLERY' && this.save.doctrine === 'ARTILLERY'
        ? 1.12
        : 1) *
      (p.unit === 'ARTILLERY' && this.mod('SPOTTERS') ? 1.18 : 1) *
      (p.unit === 'RIFLE' && this.mod('SIGHTS') ? 1.2 : 1) *
      (p.branches.includes('RIFLE_B5') ? 1.25 : 1)
    );
  }
  private targets(p: DefensiveUnitRuntime) {
    return this.formations
      .filter((e) => e.hp > 0 && distance(e, SLOTS[p.slot]) <= this.range(p))
      .sort((a, b) =>
        p.priority === 'STRONG' || p.branches.includes('RIFLE_A3')
          ? b.hp - a.hp
          : b.progress - a.progress,
      );
  }
  private fx(
    kind: Effect['kind'],
    from: Point,
    to: Point,
    source: number,
    duration: number,
  ) {
    this.effects.push({
      id: this.sequence++,
      kind,
      from: { ...from },
      to: { ...to },
      source,
      age: 0,
      duration,
    });
    if (this.effects.length > 80) this.effects.shift();
  }
  private hit(p: DefensiveUnitRuntime, e: EnemyFormation, damage: number) {
    const strength =
      (1 + (p.level - 1) * 0.22) * (1 + permanentBonus(this.save, p.unit));
    const different = this.positions.some(
      (other) =>
        other.id !== p.id &&
        other.unit !== p.unit &&
        other.unit !== 'ENGINEER' &&
        distance(SLOTS[p.slot], SLOTS[other.slot]) < 18,
    );
    let dealt =
      damage *
      strength *
      (this.mod('RISK') ? 1.25 : 1) *
      (this.mod('CROSSFIRE') && different ? 1.15 : 1);
    if (p.unit === 'ARTILLERY' && this.mod('FIRE')) dealt *= 1.2;
    if (p.unit === 'RIFLE' && this.mod('SIGHTS')) dealt *= 1.15;
    if (p.branches.includes('RIFLE_A3')) dealt *= 1.25;
    if (p.branches.includes('MG_B3')) dealt *= 1.15;
    if (
      p.branches.includes('ARTILLERY_B5') &&
      (e.major || e.type === 'SUPPORTED')
    )
      dealt *= 1.45;
    if (e.major) {
      dealt *=
        e.stage === 'EXPOSED' ? 1.5 * (this.mod('TIMING') ? 1.35 : 1) : 0.75;
    }
    dealt = Math.max(2, dealt - FORMATIONS[e.type].defense);
    p.damage += Math.min(Math.max(0, e.hp), dealt);
    e.hp -= dealt;
    if (p.branches.includes('MG_A5'))
      e.suppressed = Math.max(e.suppressed, 1.5);
    if (p.unit === 'ARTILLERY' && this.mod('BARRAGE'))
      e.barrageSlow = Math.max(e.barrageSlow, 2);
    this.command = Math.min(
      100,
      this.command + 0.32 * (this.mod('COUNTER') ? 1.3 : 1),
    );
  }
  private fire(p: DefensiveUnitRuntime) {
    const targets = this.targets(p),
      target = targets[0];
    if (!target) return;
    p.shots++;
    let interval = UNITS[p.unit].interval;
    if (p.boost > 0) interval *= 0.5;
    if (p.branches.includes('MG_A3') || p.branches.includes('RIFLE_B3'))
      interval /= 1.25;
    if (p.unit === 'MG' && this.mod('BELTS')) interval /= 1.18;
    if (['MG', 'RIFLE'].includes(p.unit) && this.save.doctrine === 'ASSAULT')
      interval /= 1.1;
    if (this.engineers(p.slot).length) interval /= 1.08;
    p.reload = interval;
    if (p.unit === 'ARTILLERY') {
      const radius =
          UNITS.ARTILLERY.radius *
          (p.branches.includes('ARTILLERY_A3') ? 1.3 : 1),
        shells =
          p.branches.includes('ARTILLERY_A5') && p.shots % 3 === 0 ? 3 : 1;
      for (let i = 0; i < shells; i++)
        this.launchShell(
          p,
          target,
          UNITS.ARTILLERY.damage * (i === 0 ? 1 : 0.45),
          radius,
          0.8 + i * 0.12,
        );
    } else {
      this.hit(p, target, UNITS[p.unit].damage);
      this.fx(
        p.unit as 'RIFLE' | 'MG',
        SLOTS[p.slot],
        target,
        p.id,
        p.unit === 'MG' ? 0.16 : 0.26,
      );
      if (p.branches.includes('RIFLE_A5') && p.shots % 4 === 0)
        this.hit(p, target, UNITS.RIFLE.damage);
      if (
        (p.branches.includes('MG_B5') || p.branches.includes('RIFLE_B5')) &&
        targets[1]
      ) {
        this.hit(p, targets[1], UNITS[p.unit].damage * 0.5);
        this.fx(
          p.unit as 'RIFLE' | 'MG',
          SLOTS[p.slot],
          targets[1],
          p.id,
          0.18,
        );
      }
    }
  }
  private launchShell(
    p: DefensiveUnitRuntime,
    target: EnemyFormation,
    damage: number,
    radius: number,
    duration: number,
  ) {
    const aim = { x: target.x, y: target.y };
    this.shells.push({
      source: p.id,
      target: aim,
      targetId: target.id,
      damage,
      radius,
      remaining: duration,
      precision: p.branches.includes('ARTILLERY_B3'),
    });
    this.fx('ARTILLERY', SLOTS[p.slot], aim, p.id, duration);
  }
  tick(seconds: number) {
    if (
      this.paused ||
      this.terminal() ||
      this.state === 'SETUP' ||
      this.state === 'ORDERS'
    )
      return;
    // Fixed small substeps preserve movement and firing at 1x / 2x and on slower devices.
    let left = Math.max(0, Math.min(seconds, 0.25)) * this.speed;
    while (left > 0) {
      const dt = Math.min(left, 0.05);
      this.step(dt);
      left -= dt;
      if (this.terminal() || this.awaitingOrder()) break;
    }
  }
  private step(dt: number) {
    this.time += dt;
    this.officerCD = Math.max(0, this.officerCD - dt);
    this.disruption = Math.max(0, this.disruption - dt);
    this.slowing = Math.max(0, this.slowing - dt);
    this.effects.forEach((e) => (e.age += dt));
    this.effects = this.effects.filter((e) => e.age < e.duration);
    for (const shell of this.shells) {
      shell.remaining -= dt;
      if (shell.remaining <= 0) {
        const p = this.positions.find((p) => p.id === shell.source);
        if (p) {
          for (const e of this.formations.filter(
            (e) => e.hp > 0 && distance(e, shell.target) <= shell.radius,
          ))
            this.hit(
              p,
              e,
              shell.damage *
                (shell.precision && e.id === shell.targetId ? 1.35 : 1),
            );
          this.fx('IMPACT', shell.target, shell.target, shell.source, 0.5);
        }
      }
    }
    this.shells = this.shells.filter((shell) => shell.remaining > 0);
    this.positions.forEach((p) => {
      p.skillCD = Math.max(0, p.skillCD - dt);
      p.boost = Math.max(0, p.boost - dt);
    });
    if (this.state === 'INTERMISSION') {
      this.intermission -= dt;
      if (this.intermission <= 0) this.nextWave();
      return;
    }
    this.waveTime += dt;
    this.elapsedSpawn += dt;
    while (this.queue.length && this.queue[0].at <= this.elapsedSpawn) {
      const next = this.queue.shift()!;
      this.spawn(next.type, next.major);
    }
    if (this.wave >= 6 && this.waveTime >= this.suppressionNext) {
      this.suppressionNext += 20;
      this.suppressionDue = this.waveTime + 3;
    }
    if (this.suppressionDue !== null && this.waveTime >= this.suppressionDue) {
      this.positions.forEach((p) => (p.reload += this.resilience(p) ? 1 : 3));
      this.suppressionDue = null;
      this.telegraph = '炮擊壓制結束 · 保持交叉掩護。';
    }
    for (const e of this.formations) {
      if (e.hp <= 0) continue;
      e.suppressed = Math.max(0, e.suppressed - dt);
      e.barrageSlow = Math.max(0, e.barrageSlow - dt);
      if (e.major) {
        e.phase = e.hp < e.maxHP * 0.35 ? 3 : e.hp < e.maxHP * 0.7 ? 2 : 1;
        e.timer -= dt;
        if (e.timer <= 0) {
          if (e.stage === 'ADVANCE') {
            e.stage = 'PREPARATION';
            e.timer = 4;
            this.telegraph = `重大攻勢第 ${e.phase} 階段：4 秒後通訊受阻，準備火力。`;
          } else if (e.stage === 'PREPARATION') {
            e.stage = 'EXPOSED';
            e.timer = 6;
            this.disruption = 2;
            this.telegraph = '敵軍重新整隊 · 6 秒火力時機（通訊受阻 2 秒）';
          } else {
            e.stage = 'ADVANCE';
            e.timer = 8;
            this.telegraph = '敵軍恢復推進。';
          }
        }
      }
      const mud = e.progress > 0.3 && e.progress < 0.55 ? 0.78 : 1;
      e.progress +=
        ((dt * (e.major ? 1.35 : FORMATIONS[e.type].speed)) / 100) *
        mud *
        (e.suppressed > 0 ? 0.75 : e.barrageSlow > 0 ? 0.8 : 1) *
        (this.slowing > 0 ? 0.55 : 1) *
        (e.stage === 'PREPARATION' ? 0.2 : 1);
      Object.assign(e, samplePath(e.progress, e.lane));
    }
    for (const p of this.positions) {
      p.reload = Math.max(0, p.reload - dt);
      if (p.unit === 'ENGINEER') {
        if (p.branches.includes('ENGINEER_A5')) {
          p.repair += dt;
          if (p.repair >= 18) {
            p.repair -= 18;
            this.strength = Math.min(this.maxStrength, this.strength + 1);
            this.fx('REPAIR', SLOTS[p.slot], SLOTS[p.slot], p.id, 1);
          }
        }
        continue;
      }
      if (p.reload <= 0) this.fire(p);
    }
    for (const e of this.formations) {
      if (e.hp <= 0) {
        const resources = e.major
          ? 90 + this.wave * 2
          : FORMATIONS[e.type].resource;
        this.resource += resources;
        this.earned += resources;
        this.repelled++;
        this.command = Math.min(
          100,
          this.command + 1.8 * (this.mod('COUNTER') ? 1.3 : 1),
        );
        this.fx('IMPACT', e, e, 0, 0.55);
      } else if (e.progress >= 1) {
        const loss = e.major
          ? this.wave === VERDUN_WAVE_COUNT
            ? this.strength
            : 5
          : e.type === 'SUPPORTED'
            ? 2
            : 1;
        this.strength = Math.max(0, this.strength - loss);
        this.notice = e.major
          ? '重大攻勢突破交通線；嘗試在敵軍整隊時集中火力。'
          : e.type === 'ASSAULT'
            ? '快速分隊突破；檢查兩條路線的火力覆蓋。'
            : '敵軍突破陣地；檢查射程與後方防線。';
      }
    }
    this.formations = this.formations.filter((e) => e.hp > 0 && e.progress < 1);
    if (this.strength <= 0) {
      this.finish('LOST');
      return;
    }
    if (!this.queue.length && !this.formations.length && this.waveTime >= 23) {
      this.clearedWaves = this.wave;
      this.suppressionDue = null;
      const bonus =
        12 +
        (this.mod('SUPPLY') ? 12 : 0) +
        this.positions.filter((p) => p.branches.includes('ENGINEER_B5'))
          .length *
          8;
      this.resource += bonus;
      this.earned += bonus;
      if (this.wave === VERDUN_WAVE_COUNT) {
        this.finish('HELD');
        return;
      }
      if (this.wave % 5 === 0) this.openOrders();
      else {
        this.state = 'INTERMISSION';
        this.intermission = 4;
      }
    }
  }
  private resilience(p: DefensiveUnitRuntime) {
    return (
      SLOTS[p.slot].terrain === '壕溝' ||
      p.branches.includes('MG_B3') ||
      this.engineers(p.slot).some((e) => e.branches.includes('ENGINEER_B3'))
    );
  }
  private finish(result: 'HELD' | 'LOST') {
    this.state = result;
    this.resource = 0;
    this.command = 0;
    this.effects = [];
    this.shells = [];
    this.formations = [];
    this.queue = [];
    this.disruption = 0;
    this.suppressionDue = null;
    this.telegraph = '';
    this.paused = false;
  }
  snapshot(): BattleSnapshot {
    return {
      state: this.state,
      wave: this.wave,
      clearedWaves: this.clearedWaves,
      strength: this.strength,
      maxStrength: this.maxStrength,
      resource: this.resource,
      command: this.command,
      paused: this.paused,
      speed: this.speed,
      time: this.time,
      intermission: this.intermission,
      positions: this.positions.map((p) => ({
        ...p,
        branches: [...p.branches],
      })),
      formations: this.formations.map((e) => ({ ...e })),
      effects: this.effects.map((e) => ({ ...e })),
      orders: [...this.orders],
      offers: [...this.offers],
      notice: this.notice,
      telegraph:
        this.suppressionDue === null
          ? this.telegraph
          : `炮兵準備射擊 · ${Math.max(0, Math.ceil(this.suppressionDue - this.waveTime))} 秒後壓制陣地。 ${this.telegraph}`,
      disruption: this.disruption,
      officerCD: this.officerCD,
      earned: this.earned,
      spent: this.spent,
      commandUses: this.commandUses,
      repelled: this.repelled,
      decisionInterval:
        this.decisions.length > 1
          ? (this.decisions.at(-1)! - this.decisions[0]) /
            (this.decisions.length - 1)
          : 0,
    };
  }
  record(id: string): RunRecord {
    if (!this.terminal()) throw new Error('戰局尚未結束。');
    return {
      scenarioId: VERDUN_SCENARIO_ID,
      id,
      at: new Date().toISOString(),
      result: this.state as 'HELD' | 'LOST',
      waves: this.clearedWaves,
      seconds: this.time,
      earned: this.earned,
      spent: this.spent,
      units: [...this.sold, ...this.positions].map(
        (p) =>
          `${UNITS[p.unit].name} · 陣地 ${p.level} · ${
            p.branches
              .map(
                (id) =>
                  Object.values(BRANCHES[p.unit])
                    .flat()
                    .find((b) => b.id === id)?.name,
              )
              .join(' / ') || '基本工事'
          }`,
      ),
      orders: [...this.orders],
      commands: this.commandUses,
      reason: this.state === 'LOST' ? this.notice : '防禦區已守住。',
    };
  }
}
