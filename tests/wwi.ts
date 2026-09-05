import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { VerdunEngine } from '../lib/wwi/engine';
import {
  newSave,
  validateSave,
  settleRun,
  quickResolve,
  trainUnit,
  SAVE_KEY,
} from '../lib/wwi/save';
import {
  UNIT_IDS,
  BRANCHES,
  ORDERS,
  SLOTS,
  TECHNOLOGIES,
  VERDUN,
  PATHS,
  samplePath,
  type UnitId,
  type DoctrineId,
} from '../lib/wwi/data';
const checks: string[] = [];
function check(name: string, fn: () => void) {
  fn();
  checks.push(name);
  console.log('PASS', name);
}
check(
  'Independent v8 save, valid 3-type loadout, bounded permanent progression',
  () => {
    assert.equal(validateSave(newSave()).saveVersion, 8);
    assert.equal(SAVE_KEY, 'wwi-field-command-v8');
    assert.throws(() => validateSave({ saveVersion: 7 }));
    assert.throws(
      () =>
        new VerdunEngine({ ...newSave(), loadout: ['RIFLE', 'RIFLE', 'MG'] }),
    );
    assert.throws(() => trainUnit(newSave(), 'MG', 'level'));
    assert.throws(() => quickResolve(newSave()));
  },
);
check('Chronology, battle roster, field orders and routes', () => {
  assert.equal(VERDUN.year, 1916);
  assert.equal(VERDUN.faction, 'ENTENTE');
  assert.equal(UNIT_IDS.length, 4);
  assert.equal(ORDERS.length, 15);
  assert.equal(SLOTS.length, 7);
  assert(TECHNOLOGIES.every((t) => t.availableFromYear <= VERDUN.year));
  assert(!UNIT_IDS.some((id) => String(id).includes('TANK')));
  assert.notDeepEqual(PATHS[0][0], PATHS[1][0]);
  assert.deepEqual(samplePath(1, 0), samplePath(1, 1));
});
check(
  'Budget, sell once, occupied/fractional slot and engineer-only start',
  () => {
    const e = new VerdunEngine(newSave());
    assert(!e.deploy(0.5, 'MG').ok);
    assert(e.deploy(2, 'MG').ok);
    assert(!e.deploy(2, 'MG').ok);
    assert(e.deploy(0, 'ARTILLERY').ok);
    assert(!e.deploy(4, 'MG').ok);
    const p = e.snapshot().positions[0],
      before = e.snapshot().resource;
    assert(e.sell(p.id).ok);
    assert.equal(e.snapshot().resource - before, 84);
    assert(!e.sell(p.id).ok);
    const gun = e.snapshot().positions[0],
      prior = e.snapshot().resource;
    assert(e.sell(gun.id).ok);
    assert.equal(
      e.snapshot().resource - prior,
      126,
      '180 resource investment refunds exactly 126',
    );
    const engineers = new VerdunEngine(newSave());
    assert(engineers.deploy(3, 'ENGINEER').ok);
    assert(!engineers.start().ok);
    assert.equal(engineers.snapshot().positions[0].damage, 0);
  },
);
check(
  'Engineer adjacency affects costs and invalid branch does not spend resources',
  () => {
    const e = new VerdunEngine(newSave());
    e.deploy(2, 'MG');
    e.deploy(3, 'ENGINEER');
    const p = e.snapshot().positions[0];
    // Slot 3 is farther than 24 from slot 2; no global discount.
    assert.equal(e.upgradeCost(p), 100);
    e.sell(e.snapshot().positions[1].id);
    e.deploy(0, 'ENGINEER');
    assert.equal(e.upgradeCost(p), 90);
    e.start();
    for (let i = 0; i < 600 && e.snapshot().resource < 90; i++) e.tick(0.1);
    assert(e.upgrade(p.id).ok);
    const resource = e.snapshot().resource;
    assert(!e.upgrade(p.id, 'INVALID').ok);
    assert.equal(e.snapshot().resource, resource);
  },
);
check('Pause and 2x preserve continuous simulation', () => {
  const a = new VerdunEngine(newSave(), 41),
    b = new VerdunEngine(newSave(), 41);
  a.deploy(2, 'MG');
  b.deploy(2, 'MG');
  a.start();
  b.start();
  a.togglePause();
  a.tick(0.2);
  assert.equal(a.snapshot().time, 0);
  a.togglePause();
  b.toggleSpeed();
  for (let i = 0; i < 100; i++) {
    a.tick(0.1);
    a.tick(0.1);
    b.tick(0.1);
  }
  assert(Math.abs(a.snapshot().time - b.snapshot().time) < 0.001);
  assert.equal(a.snapshot().repelled, b.snapshot().repelled);
});
function simulate(
  loadout: UnitId[],
  strategy: 'wide' | 'tall' | 'hybrid',
  seed: number,
  doctrine: DoctrineId = 'DEFENSE',
) {
  const save = { ...newSave(), loadout, doctrine };
  const e = new VerdunEngine(save, seed);
  const slots = [2, 0, 1, 3, 4, 5, 6];
  const first = loadout.includes('MG')
    ? 'MG'
    : loadout.includes('RIFLE')
      ? 'RIFLE'
      : 'ARTILLERY';
  assert(e.deploy(2, first).ok);
  const second = loadout.includes('ARTILLERY') ? 'ARTILLERY' : first;
  const deployed = e.deploy(1, second);
  assert(deployed.ok);
  e.start();
  let last = 0,
    offers = 0,
    windows = 0,
    leakedBefore = 0;
  const purchasedAt: number[] = [];
  for (let i = 0; i < 18000; i++) {
    let s = e.snapshot();
    if (['HELD', 'LOST'].includes(s.state)) break;
    if (s.state === 'ORDERS') {
      assert.equal(s.offers.length, 3);
      assert.equal(new Set(s.offers.map((o) => o.category)).size, 3);
      const option = s.offers[seed % 3];
      assert(e.chooseOrder(option.id).ok);
      offers++;
    }
    if (s.time - last >= 18) {
      const target = strategy === 'wide' ? 7 : strategy === 'tall' ? 4 : 5;
      let changed = false;
      if (s.positions.length < target) {
        const hasEngineer = s.positions.some((p) => p.unit === 'ENGINEER');
        const type =
          loadout.includes('ENGINEER') &&
          !hasEngineer &&
          s.positions.length >= 2
            ? 'ENGINEER'
            : loadout.filter((id) => id !== 'ENGINEER')[
                (s.positions.length + seed) %
                  loadout.filter((id) => id !== 'ENGINEER').length
              ];
        const slot =
          type === 'ENGINEER'
            ? 3
            : slots.find((slot) => !s.positions.some((p) => p.slot === slot));
        if (slot !== undefined) changed = e.deploy(slot, type).ok;
      }
      if (!changed) {
        const cap = strategy === 'wide' ? 3 : 5;
        const p = [...s.positions]
          .filter((p) => p.level < cap)
          .sort((a, b) =>
            strategy === 'tall' ? b.level - a.level : a.level - b.level,
          )
          .find((p) => e.upgradeCost(p) <= s.resource);
        if (p) {
          const target = p.level + 1;
          changed = e.upgrade(
            p.id,
            target === 3 || target === 5
              ? BRANCHES[p.unit][target][seed % 2].id
              : undefined,
          ).ok;
        }
      }
      if (changed) {
        last = s.time;
        purchasedAt.push(s.time);
      }
    }
    s = e.snapshot();
    const window = s.formations.some((e) => e.major && e.stage === 'EXPOSED');
    if (window) windows++;
    if (s.state === 'ACTIVE') {
      for (const p of s.positions)
        if (
          (p.unit === 'ENGINEER'
            ? s.strength < s.maxStrength - 1
            : window || s.formations.length > 4) &&
          p.skillCD === 0
        )
          e.activateSkill(p.id);
      if (s.command >= 100 && (window || s.formations.length > 6)) {
        const p =
          s.positions.find((p) => p.unit === 'ARTILLERY') ?? s.positions[0];
        e.activateCommand(p.id);
      }
      if (
        (doctrine === 'DEFENSE' && s.strength < s.maxStrength - 3) ||
        doctrine === 'LOGISTICS' ||
        (doctrine === 'ASSAULT' &&
          s.formations.some((e) => e.progress > 0.6)) ||
        (doctrine === 'ARTILLERY' && (window || s.formations.length > 6))
      )
        e.activateOfficer();
    }
    leakedBefore = Math.max(leakedBefore, s.maxStrength - s.strength);
    e.tick(0.1);
  }
  const end = e.snapshot();
  assert(['HELD', 'LOST'].includes(end.state), 'run must terminate');
  assert.equal(end.resource, 0);
  assert.equal(end.command, 0);
  assert.equal(end.effects.length, 0);
  assert(end.positions.length <= 7);
  const record = e.record(
      `${loadout.join('-')}-${strategy}-${seed}-${doctrine}`,
    ),
    settled = settleRun(save, record);
  assert.equal(settleRun(settled, record).supplies, settled.supplies);
  if (record.result === 'HELD') {
    assert(settled.cleared.length);
    assert.equal(quickResolve(settled).supplies - settled.supplies, 100);
    assert.equal(offers, 4);
  } else assert.equal(settled.cleared.length, 0);
  const retry = new VerdunEngine(settled);
  assert.equal(retry.snapshot().resource, 300);
  assert.equal(retry.snapshot().positions.length, 0);
  assert.equal(retry.snapshot().orders.length, 0);
  return {
    loadout,
    strategy,
    seed,
    doctrine,
    ...record,
    offers,
    windows,
    leakedBefore,
    finalPositions: end.positions.map((p) => ({
      unit: p.unit,
      level: p.level,
      damage: p.damage,
      branches: p.branches,
    })),
    purchaseInterval:
      purchasedAt.length > 1
        ? (purchasedAt.at(-1)! - purchasedAt[0]) / (purchasedAt.length - 1)
        : 0,
  };
}
const runs: ReturnType<typeof simulate>[] = [];
for (const omitted of UNIT_IDS)
  for (const strategy of ['wide', 'tall', 'hybrid'] as const)
    for (const seed of [11, 24]) {
      const r = simulate(
        UNIT_IDS.filter((id) => id !== omitted),
        strategy,
        seed,
      );
      runs.push(r);
      console.log(
        'RUN',
        r.loadout.join('+'),
        strategy,
        seed,
        r.result,
        r.waves,
        Math.round(r.seconds),
      );
    }
for (const doctrine of ['ARTILLERY', 'LOGISTICS', 'ASSAULT'] as const)
  runs.push(simulate(newSave().loadout, 'hybrid', 18, doctrine));
check('No-cost idle defense fails and gives no first-clear reward', () => {
  const e = new VerdunEngine(newSave(), 15);
  e.deploy(6, 'MG');
  e.start();
  for (let i = 0; i < 9000; i++) {
    e.tick(0.1);
    if (e.snapshot().state === 'LOST') break;
    if (e.snapshot().state === 'ORDERS')
      e.chooseOrder(e.snapshot().offers[0].id);
  }
  assert.equal(e.snapshot().state, 'LOST');
  assert(!settleRun(newSave(), e.record('idle')).cleared.length);
});
const report = {
  date: new Date().toISOString(),
  checks,
  method:
    '27 deterministic engine runs with level 1 / Mk.I saves; automated tactical policy. No player data, cheats or injected resources.',
  runs,
  summary: {
    count: runs.length,
    wins: runs.filter((r) => r.result === 'HELD').length,
    averageMinutes: runs.reduce((a, r) => a + r.seconds, 0) / runs.length / 60,
    averagePurchaseInterval:
      runs.reduce((a, r) => a + r.purchaseInterval, 0) / runs.length,
  },
};
await mkdir('reports', { recursive: true });
await writeFile('reports/wwi-balance.json', JSON.stringify(report, null, 2));
console.log('SUMMARY', JSON.stringify(report.summary));
assert(
  runs.some((r) => r.result === 'HELD' && r.loadout.includes('ENGINEER')),
  'Golden roster needs a win',
);
for (const strategy of ['wide', 'tall', 'hybrid'])
  assert(
    runs.some((r) => r.result === 'HELD' && r.strategy === strategy),
    `${strategy} must be viable`,
  );
