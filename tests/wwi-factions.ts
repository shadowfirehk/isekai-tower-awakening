import assert from 'node:assert/strict';
import {
  FACTIONS,
  NATIONS,
  YEARS,
  SCENARIOS,
  VERDUN_SCENARIO,
  VERDUN_SCENARIO_ID,
  VERDUN_WAVE_COUNT,
  UNIT_VARIANTS,
  scenarioErrors,
  isNationActiveOnDate,
  nationStatusOnDate,
  activeNations,
  normalizeNavigation,
  unitVariantForScenario,
  orderAvailable,
  assertPlayableScenario,
  type FactionId,
} from '../lib/wwi/campaign';
import { UNIT_ARCHETYPES, ORDERS, DOCTRINES } from '../lib/wwi/data';
import {
  newSave,
  validateSave,
  selectCampaign,
  settleRun,
  quickResolve,
  type RunRecord,
} from '../lib/wwi/save';
import { VerdunEngine } from '../lib/wwi/engine';

export function runFactionTests() {
  const checks: string[] = [];
  const check = (name: string, fn: () => void) => {
    fn();
    checks.push(`Faction: ${name}`);
    console.log('PASS', name);
  };
  const factions = Object.keys(FACTIONS) as FactionId[];
  const locked = SCENARIOS.find((s) => s.playableFaction === 'CENTRAL_POWERS')!;
  const run: RunRecord = {
    id: 'migration-test',
    at: '2026-09-06',
    result: 'HELD',
    waves: VERDUN_WAVE_COUNT,
    seconds: 1000,
    earned: 600,
    spent: 500,
    units: [],
    orders: [],
    commands: 1,
    reason: 'test',
  };
  check('two factions, eleven nations, explicit associated status', () => {
    assert.deepEqual(factions, ['ENTENTE', 'CENTRAL_POWERS']);
    assert.equal(NATIONS.length, 11);
    assert.equal(new Set(NATIONS.map((n) => n.id)).size, 11);
    assert.equal(
      nationStatusOnDate('UNITED_STATES', '1917-04-06'),
      'ASSOCIATED_POWER',
    );
  });
  check(
    '22 valid perspectives, shared history, only French Verdun executable',
    () => {
      assert.equal(SCENARIOS.length, 22);
      assert.equal(
        SCENARIOS.filter((s) => s.playableFaction === 'ENTENTE').length,
        12,
      );
      for (const s of SCENARIOS)
        assert.deepEqual(scenarioErrors(s), [], s.scenarioId);
      assert.deepEqual(
        SCENARIOS.filter((s) => s.implemented).map((s) => s.scenarioId),
        [VERDUN_SCENARIO_ID],
      );
      assert.equal(VERDUN_SCENARIO.waveConfiguration?.count, VERDUN_WAVE_COUNT);
      assert.equal(
        SCENARIOS.filter((s) => s.battleId === 'VERDUN_1916').length,
        2,
      );
      for (const s of SCENARIOS.filter((s) => !s.implemented)) {
        assert.equal(s.rewardConfig, null);
        assert.equal(s.waveConfiguration, null);
      }
    },
  );
  check(
    'all ten faction/year combinations browsable without invented playability',
    () => {
      for (const faction of factions)
        for (const year of YEARS) {
          assert(
            SCENARIOS.some(
              (s) =>
                s.playableFaction === faction &&
                s.date.startsWith(String(year)),
            ),
          );
          assert(activeNations(faction, year).length > 0);
          assert.equal(
            normalizeNavigation({
              selectedFaction: faction,
              selectedYear: year,
            }).selectedYear,
            year,
          );
        }
    },
  );
  check(
    'entry, political transition, withdrawal and invalid date boundaries',
    () => {
      for (const [id, before, after] of [
        ['ITALY', '1915-05-22', '1915-05-23'],
        ['UNITED_STATES', '1917-04-05', '1917-04-06'],
      ] as const) {
        assert(!isNationActiveOnDate(id, before));
        assert(isNationActiveOnDate(id, after));
      }
      assert(!isNationActiveOnDate('UNITED_STATES', '1916-07-01'));
      assert(isNationActiveOnDate('RUSSIAN_EMPIRE', '1917-03-14'));
      assert(!isNationActiveOnDate('RUSSIAN_EMPIRE', '1917-03-15'));
      assert(
        !activeNations('ENTENTE', 1918).some((n) => n.id === 'RUSSIAN_EMPIRE'),
      );
      assert(!isNationActiveOnDate('FRANCE', '1916-02-30'));
      assert(!isNationActiveOnDate('BULGARIA', '1918-09-30'));
    },
  );
  check(
    'invalid mission identity and nation/date combinations rejected',
    () => {
      for (const patch of [
        { battleId: 'unknown' },
        { date: '1914-01-01' },
        { playableNation: 'UNITED_STATES' as const },
        { opposingFaction: 'ENTENTE' as const },
      ])
        assert(scenarioErrors({ ...VERDUN_SCENARIO, ...patch }).length);
      assert.throws(() =>
        assertPlayableScenario(
          VERDUN_SCENARIO_ID,
          'CENTRAL_POWERS',
          'FRANCE',
          1916,
        ),
      );
      assert.throws(
        () =>
          new VerdunEngine(
            selectCampaign(newSave(), { selectedNation: 'UNITED_KINGDOM' }),
          ),
      );
      assert.throws(
        () =>
          new VerdunEngine(selectCampaign(newSave(), { selectedYear: 1914 })),
      );
    },
  );
  check('locked missions cannot launch, settle or quick-resolve', () => {
    const save = selectCampaign(newSave(), {
      selectedFaction: 'CENTRAL_POWERS',
    });
    const before = JSON.stringify(save);
    assert.throws(() => new VerdunEngine(save));
    assert.throws(() => new VerdunEngine(save, undefined, locked.scenarioId));
    assert.throws(() =>
      settleRun(save, { ...run, scenarioId: locked.scenarioId }),
    );
    assert.throws(() => quickResolve(save, locked.scenarioId));
    assert.equal(JSON.stringify(save), before);
  });
  check(
    'repeated navigation stays isolated, normalizes countries and creates no progress',
    () => {
      let save = newSave();
      for (let i = 0; i < 100; i++) {
        const faction = factions[i % 2],
          year = YEARS[i % 5];
        save = validateSave(
          selectCampaign(save, {
            selectedFaction: faction,
            selectedYear: year,
            selectedNation: 'FRANCE',
            selectedScenario: VERDUN_SCENARIO_ID,
          }),
        );
        assert.equal(save.navigation.selectedFaction, faction);
        assert.equal(save.navigation.selectedYear, year);
        if (faction === 'CENTRAL_POWERS') {
          assert.equal(save.navigation.selectedNation, null);
          assert.equal(save.navigation.selectedScenario, null);
        }
        assert.deepEqual(save.campaignProgressByFaction, {
          ENTENTE: {},
          CENTRAL_POWERS: {},
        });
      }
    },
  );
  check(
    'original v8 migration preserves resources, receipts, training, sound and history',
    () => {
      const {
        navigation: _n,
        campaignProgressByFaction: _p,
        ...legacy
      } = newSave();
      const migrated = validateSave({
        ...legacy,
        faction: 'CENTRAL',
        supplies: 123,
        parts: 45,
        technology: 6,
        bestWave: 25,
        cleared: ['VERDUN_1916_FR'],
        receipts: [run.id],
        history: [run],
        settings: { sound: true },
        units: { ...legacy.units, MG: { level: 3, mark: 2 } },
      });
      assert.equal(migrated.supplies, 123);
      assert.equal(migrated.parts, 45);
      assert.equal(migrated.technology, 6);
      assert.equal(migrated.bestWave, VERDUN_WAVE_COUNT);
      assert.equal(migrated.units.MG.level, 3);
      assert.equal(migrated.settings.sound, true);
      assert.deepEqual(migrated.receipts, [run.id]);
      assert.equal(migrated.history[0].scenarioId, VERDUN_SCENARIO_ID);
      assert.equal(migrated.navigation.selectedFaction, 'CENTRAL_POWERS');
      assert(
        migrated.campaignProgressByFaction.ENTENTE[VERDUN_SCENARIO_ID].cleared,
      );
      assert.deepEqual(migrated.campaignProgressByFaction.CENTRAL_POWERS, {});
      assert.deepEqual(
        validateSave(JSON.parse(JSON.stringify(migrated))),
        migrated,
      );
    },
  );
  check(
    'settlement identity, first-clear and replay remain idempotent and faction scoped',
    () => {
      const save = validateSave(settleRun(newSave(), run));
      assert.equal(save.supplies, 180);
      assert.equal(save.technology, 10);
      assert.equal(settleRun(save, run), save);
      assert.equal(quickResolve(save).supplies, 280);
      const central = selectCampaign(save, {
        selectedFaction: 'CENTRAL_POWERS',
      });
      assert.throws(() => quickResolve(central));
      assert.deepEqual(central.campaignProgressByFaction.CENTRAL_POWERS, {});
    },
  );
  check(
    'four shared archetypes/doctrines, national variants and order ownership',
    () => {
      assert.equal(Object.keys(UNIT_ARCHETYPES).length, 4);
      assert.equal(Object.keys(DOCTRINES).length, 4);
      assert.equal(UNIT_VARIANTS.length, 44);
      assert.equal(new Set(UNIT_VARIANTS.map((v) => v.id)).size, 44);
      assert(
        UNIT_VARIANTS.filter((v) => v.nationId !== 'FRANCE').every(
          (v) => !v.implemented && v.artAsset === null,
        ),
      );
      assert(unitVariantForScenario('MG', VERDUN_SCENARIO));
      assert.equal(unitVariantForScenario('MG', locked), undefined);
      assert.equal(ORDERS.length, 15);
      assert(
        ORDERS.every((o) => orderAvailable(o.availability, VERDUN_SCENARIO)),
      );
      assert(
        !orderAvailable(
          { scope: 'NATION', nationId: 'GERMAN_EMPIRE' },
          VERDUN_SCENARIO,
        ),
      );
      assert(
        !orderAvailable(
          { scope: 'FACTION', factionId: 'CENTRAL_POWERS' },
          VERDUN_SCENARIO,
        ),
      );
    },
  );
  return checks;
}
