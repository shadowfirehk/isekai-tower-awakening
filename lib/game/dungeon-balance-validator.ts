import { battleBuildCost, battleUpgradeCost } from './battle-economy';
import {
  DungeonConfig,
  EARTH_TUTORIAL_DUNGEON,
  ENEMY_CATALOG,
  getEarthDungeon,
} from './dungeon-data';
import { EARTH_TIER_IDS } from './types';

export interface GoldCurveCheckpoint {
  wave: 5 | 10 | 15 | 20 | 25;
  expectedGoldEarned: number;
  expectedTotalBudget: number;
  expectedTowerCount: number;
  expectedBattleLevel: number;
  affordableProgression: boolean;
}

export interface DungeonBalanceReport {
  dungeonID: string;
  startingGold: number;
  slotCount: number;
  goldCurve: GoldCurveCheckpoint[];
  averageGoldPerWave: number;
  averageEnemyHP: number;
  averageEnemyDefense: number;
  averageEnemySpeed: number;
  bossEffectiveHP: number;
  estimatedPathDuration: number;
  expectedPlayerDPSRange: [number, number];
  flags: string[];
}

const CHECKPOINTS = new Set([5, 10, 15, 20, 25]);

function expectedReward(
  dungeon: DungeonConfig,
  enemyID: keyof typeof ENEMY_CATALOG,
  wave: number,
) {
  const enemy = ENEMY_CATALOG[enemyID];
  return Math.round(
    enemy.battleGoldReward *
      (enemy.boss
        ? 1 +
          Math.floor((wave - 1) / 5) * 0.45 +
          Math.max(0, dungeon.tierOrder) * 0.08
        : dungeon.goldRewardMultiplier),
  );
}

/** Development-only deterministic economy audit. It does not mutate a run. */
export class DungeonBalanceValidator {
  static validate(dungeon: DungeonConfig): DungeonBalanceReport {
    let earned = 0;
    const curve: GoldCurveCheckpoint[] = [];
    const enemySamples: Array<{ hp: number; defense: number; speed: number }> =
      [];
    for (const wave of dungeon.waves) {
      for (const group of wave.groups) {
        const enemy = ENEMY_CATALOG[group.enemyId];
        earned +=
          expectedReward(dungeon, group.enemyId, wave.wave) * group.count;
        enemySamples.push({
          hp: enemy.maxHP * dungeon.hpMultiplier * wave.bossMultiplier,
          defense: enemy.defense * dungeon.defenseMultiplier,
          speed: enemy.speed * dungeon.speedMultiplier,
        });
      }
      if (CHECKPOINTS.has(wave.wave)) {
        const totalBudget = dungeon.startingGold + earned;
        const expectedTowerCount = Math.min(
          dungeon.slotCount,
          Math.max(2, Math.floor(totalBudget / 270)),
        );
        const buildInvestment =
          expectedTowerCount * battleBuildCost('EARTH_BLAST_TURRET');
        const upgradeBudget = Math.max(0, totalBudget - buildInvestment);
        const oneLevelCost = battleUpgradeCost('EARTH_BLAST_TURRET', 1);
        const expectedBattleLevel = Math.min(
          5,
          1 +
            upgradeBudget /
              Math.max(oneLevelCost, expectedTowerCount * oneLevelCost),
        );
        curve.push({
          wave: wave.wave as GoldCurveCheckpoint['wave'],
          expectedGoldEarned: earned,
          expectedTotalBudget: totalBudget,
          expectedTowerCount,
          expectedBattleLevel: Math.round(expectedBattleLevel * 10) / 10,
          affordableProgression: totalBudget >= buildInvestment + oneLevelCost,
        });
      }
    }
    const sum = enemySamples.reduce(
      (totals, sample) => ({
        hp: totals.hp + sample.hp,
        defense: totals.defense + sample.defense,
        speed: totals.speed + sample.speed,
      }),
      { hp: 0, defense: 0, speed: 0 },
    );
    const lastBoss = dungeon.waves[24];
    const boss = ENEMY_CATALOG.EARTH_BOSS;
    const bossEffectiveHP =
      boss.maxHP *
      dungeon.hpMultiplier *
      lastBoss.bossMultiplier *
      (1 + (boss.defense * dungeon.defenseMultiplier) / 180);
    const flags: string[] = [];
    if (dungeon.slotCount < 7) flags.push('PHYSICAL_SLOT_CAPACITY_BELOW_7');
    for (const point of curve)
      if (!point.affordableProgression)
        flags.push(`ECONOMY_TOO_TIGHT_WAVE_${point.wave}`);
    if ((curve.at(-1)?.expectedTowerCount ?? 0) < 5)
      flags.push('WAVE_25_WIDE_BUILD_UNAFFORDABLE');
    return {
      dungeonID: dungeon.id,
      startingGold: dungeon.startingGold,
      slotCount: dungeon.slotCount,
      goldCurve: curve,
      averageGoldPerWave: Math.round(earned / dungeon.totalWaves),
      averageEnemyHP: Math.round(sum.hp / enemySamples.length),
      averageEnemyDefense: Math.round(sum.defense / enemySamples.length),
      averageEnemySpeed:
        Math.round((sum.speed / enemySamples.length) * 1000) / 1000,
      bossEffectiveHP: Math.round(bossEffectiveHP),
      estimatedPathDuration: Math.round(
        1 / (boss.speed * dungeon.speedMultiplier),
      ),
      expectedPlayerDPSRange: [
        Math.round(bossEffectiveHP / 28),
        Math.round(bossEffectiveHP / 18),
      ],
      flags,
    };
  }

  static validateAll() {
    return [
      this.validate(EARTH_TUTORIAL_DUNGEON),
      ...EARTH_TIER_IDS.map((tier) => this.validate(getEarthDungeon(tier))),
    ];
  }
}
