import assert from 'node:assert/strict';
import {
  VerdunEngine,
  type EnemyFormation,
  type DefensiveUnitRuntime,
} from '../lib/wwi/engine';
import { FieldAudio } from '../lib/wwi/audio';
import { newSave } from '../lib/wwi/save';
import { samplePath } from '../lib/wwi/data';
import { VERDUN_WAVE_COUNT } from '../lib/wwi/campaign';

// Targeted white-box fixtures exercise rare overlaps; balance runs remain unmodified.
interface Fixture {
  wave: number;
  waveTime: number;
  state: string;
  strength: number;
  resource: number;
  suppressionNext: number;
  suppressionDue: number | null;
  telegraph: string;
  positions: DefensiveUnitRuntime[];
  formations: EnemyFormation[];
  orders: string[];
  hit(p: DefensiveUnitRuntime, e: EnemyFormation, damage: number): void;
}
const fixture = (e: VerdunEngine) => e as unknown as Fixture;
const formation = (patch: Partial<EnemyFormation> = {}): EnemyFormation => ({
  id: 999,
  type: 'INFANTRY',
  hp: 10000,
  maxHP: 10000,
  progress: 0,
  lane: 0,
  ...samplePath(0, 0),
  suppressed: 0,
  barrageSlow: 0,
  major: false,
  phase: 1,
  timer: 100,
  stage: 'ADVANCE',
  ...patch,
});

export async function runWWIRegressions() {
  const names: string[] = [];
  const check = (name: string, fn: () => void) => {
    fn();
    names.push(name);
    console.log('PASS', name);
  };
  check(
    'Artillery countdown survives simultaneous major-assault messaging and pause',
    () => {
      const e = new VerdunEngine(newSave(), 1),
        f = fixture(e);
      e.deploy(6, 'MG');
      e.start();
      f.wave = 10;
      f.waveTime = 16;
      f.formations = [formation({ major: true, timer: 0 })];
      f.positions[0].reload = 100;
      e.tick(0.05);
      assert(e.snapshot().telegraph.includes('炮兵準備'));
      assert(e.snapshot().telegraph.includes('重大攻勢'));
      const due = f.suppressionDue;
      e.togglePause();
      e.tick(0.2);
      assert.equal(f.suppressionDue, due);
      e.togglePause();
      f.telegraph = '任何其他訊息都不能取消炮擊';
      const before = f.positions[0].reload;
      for (let i = 0; i < 31; i++) e.tick(0.1);
      assert.equal(f.suppressionDue, null);
      assert(Math.abs(f.positions[0].reload - (before - 3.1 + 3)) < 1e-6);
      e.tick(0.1);
      assert(
        Math.abs(f.positions[0].reload - (before - 3.2 + 3)) < 1e-6,
        'Pressure applies once',
      );
    },
  );
  check('TIMING adds exactly 35% in exposed phase only', () => {
    const e = new VerdunEngine(newSave(), 1),
      f = fixture(e);
    e.deploy(0, 'MG');
    const p = f.positions[0];
    const damage = (stage: EnemyFormation['stage'], orders: string[]) => {
      f.orders = orders;
      const target = formation({ major: true, stage });
      f.hit(p, target, 100);
      return 10000 - target.hp;
    };
    assert.equal(damage('EXPOSED', []), 150);
    assert.equal(damage('EXPOSED', ['TIMING']), 202.5);
    assert.equal(damage('ADVANCE', ['TIMING']), 75);
  });
  check(
    'BARRAGE slows 20%; MG suppression 25% takes precedence then expires independently',
    () => {
      const e = new VerdunEngine(newSave(), 1),
        f = fixture(e);
      e.deploy(6, 'ARTILLERY');
      const p = f.positions[0];
      f.orders = ['BARRAGE'];
      const enemy = formation();
      f.hit(p, enemy, 1);
      assert.equal(enemy.barrageSlow, 2);
      assert.equal(enemy.suppressed, 0);
      e.start();
      f.formations = [enemy];
      e.tick(0.1);
      assert(Math.abs(enemy.progress - ((0.1 * 2.8) / 100) * 0.8) < 1e-9);
      enemy.suppressed = 0.15;
      const before = enemy.progress;
      e.tick(0.05);
      assert(
        Math.abs(enemy.progress - before - ((0.05 * 2.8) / 100) * 0.75) < 1e-9,
      );
      for (let i = 0; i < 21; i++) e.tick(0.1);
      assert.equal(enemy.suppressed, 0);
      assert.equal(enemy.barrageSlow, 0);
    },
  );
  check(
    'Engineer radius is exclusive to repair-network branch; early branches rejected without spending',
    () => {
      const e = new VerdunEngine(newSave(), 1),
        f = fixture(e);
      e.deploy(3, 'ENGINEER');
      const p = f.positions[0],
        before = e.snapshot().resource;
      assert(!e.upgrade(p.id, 'ENGINEER_A5').ok);
      assert.equal(e.snapshot().resource, before);
      assert.equal(p.level, 1);
      p.level = 5;
      p.branches = ['ENGINEER_A3', 'ENGINEER_B5'];
      assert.equal(e.range(p), 24);
      p.branches = ['ENGINEER_A3', 'ENGINEER_A5'];
      assert.equal(e.range(p), 24 * 1.2);
    },
  );
  check(
    'Simultaneous leaks clamp strength to zero and clear pending pressure',
    () => {
      const e = new VerdunEngine(newSave(), 1),
        f = fixture(e);
      e.deploy(0, 'MG');
      e.start();
      f.strength = 1;
      f.formations = [
        formation({ progress: 1 }),
        formation({ id: 1000, progress: 1 }),
      ];
      f.suppressionDue = 10;
      e.tick(0.1);
      assert.equal(e.snapshot().state, 'LOST');
      assert.equal(e.snapshot().strength, 0);
      assert.equal(f.suppressionDue, null);
    },
  );

  check('Wave 20 is the final assault and a major breach is decisive', () => {
    const e = new VerdunEngine(newSave(), 1),
      f = fixture(e);
    e.deploy(0, 'MG');
    e.start();
    f.wave = VERDUN_WAVE_COUNT;
    f.strength = 20;
    f.formations = [formation({ major: true, progress: 1 })];
    e.tick(0.1);
    assert.equal(e.snapshot().state, 'LOST');
    assert.equal(e.snapshot().strength, 0);
  });

  check(
    'Permanent engineer training improves actual support adjacency, not nonexistent damage',
    () => {
      const save = newSave();
      save.units.ENGINEER = { level: 5, mark: 3 };
      const e = new VerdunEngine(save, 1),
        f = fixture(e);
      e.deploy(3, 'ENGINEER');
      e.deploy(2, 'MG');
      assert.equal(e.range(f.positions[0]), 24 * 1.3);
      // Slots 3 and 2 are 31.05 apart: beyond base radius, inside trained radius.
      assert.equal(e.upgradeCost(f.positions[1]), 90);
      assert.equal(f.positions[0].damage, 0);
    },
  );
  // Fake only Web Audio primitives; exercise the real lifecycle and scheduling code.
  let created = 0,
    starts = 0,
    stops = 0,
    resumes = 0,
    closes = 0;
  const parameter = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const node = () => ({
    frequency: parameter(),
    gain: parameter(),
    type: '',
    buffer: null,
    onended: null as null | (() => void),
    connect() {},
    disconnect() {},
    start() {
      starts++;
    },
    stop(at?: number) {
      if (at === undefined) {
        stops++;
        this.onended?.();
      }
    },
  });
  const context = {
    state: 'suspended',
    currentTime: 0,
    sampleRate: 8000,
    destination: node(),
    createOscillator: node,
    createGain: node,
    createBiquadFilter: node,
    createBufferSource: node,
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    async resume() {
      resumes++;
      this.state = 'running';
    },
    async suspend() {
      this.state = 'suspended';
    },
    async close() {
      closes++;
      this.state = 'closed';
    },
  };
  const player = new FieldAudio(() => {
    created++;
    return context as unknown as AudioContext;
  });
  try {
    player.configure(false, true, true);
    await player.unlock();
    assert.equal(created, 0);
    player.configure(true, true, true);
    assert.equal(created, 0, 'Loading enabled preference must not autoplay');
    await player.unlock();
    assert.equal(created, 1);
    assert(starts >= 5, 'Menu melody and accompaniment scheduled');
    const initial = starts;
    await player.unlock();
    assert.equal(
      starts,
      initial,
      'Repeated gestures must not layer score loops',
    );
    player.configure(true, false, true);
    assert(stops >= 5, 'Entering battle stops score voices');
    const battleScore = starts;
    assert(
      battleScore > initial,
      'Battle score starts after the menu score stops',
    );
    player.shot('MG');
    assert.equal(starts, battleScore + 2);
    const afterShot = starts;
    player.cue('DEPLOY');
    assert.equal(
      starts,
      afterShot + 2,
      'Deployment has a distinct placement cue',
    );
    player.cue('UPGRADE');
    player.cue('COMMAND');
    player.cue('ORDER_OFFER');
    player.cue('VICTORY');
    assert(
      starts >= afterShot + 15,
      'Battle actions and outcome schedule distinct cues',
    );
    player.configure(false, false, true);
    const muted = starts;
    player.shot('RIFLE');
    player.cue('DEFEAT');
    assert.equal(starts, muted);
    player.configure(true, false, true);
    await player.unlock();
    assert.equal(created, 1);
    assert(resumes >= 2, 'Re-enabling resumes the existing context');
    const resumedBattleScore = starts;
    assert(
      resumedBattleScore > muted,
      'Battle score resumes without a second context',
    );
    context.currentTime += 1;
    player.shot('ARTILLERY');
    assert.equal(starts, resumedBattleScore + 2);
    player.configure(true, true, false);
    const hidden = starts;
    await player.unlock();
    assert.equal(starts, hidden);
    player.configure(true, true, true);
    await player.unlock();
    assert(starts > hidden);
  } finally {
    player.dispose();
  }
  assert.equal(closes, 1);
  names.push(
    'Audio opt-in, music/battle transition, mute/resume, hidden tab, single context and cleanup',
  );
  console.log('PASS', names.at(-1));
  const unsupported = new FieldAudio(() => {
    throw new Error('Audio unavailable');
  });
  unsupported.configure(true, false, true);
  await unsupported.unlock();
  unsupported.shot('MG');
  unsupported.dispose();
  names.push('Audio unavailable does not throw into gameplay');
  console.log('PASS', names.at(-1));
  return names;
}
