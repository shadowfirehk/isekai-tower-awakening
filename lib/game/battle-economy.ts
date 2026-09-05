import { TowerId } from './types';

export type BattleBranchTier = 3 | 5;
export type BattleBranchEffect =
  | 'FOCUS_RAMP'
  | 'SPEED_RAMP'
  | 'IGNORE_DEFENSE'
  | 'SECOND_TARGET'
  | 'DOUBLE_SHOT_5'
  | 'PIERCE_PRESERVE'
  | 'CHAIN_EXPLOSION'
  | 'BURN_FIELD'
  | 'STORM_STRIKE'
  | 'CHAIN_PRESERVE'
  | 'EXECUTE'
  | 'WEAK_POINT'
  | 'AURA'
  | 'SANCTUARY'
  | 'ORBITAL'
  | 'NONE';

export interface BattleUpgradeModifiers {
  attackPercent?: number;
  attackSpeedPercent?: number;
  rangePercent?: number;
  defensePercent?: number;
  penetration?: number;
  critChance?: number;
  critDamagePercent?: number;
  maxTargets?: number;
  aoeDamagePercent?: number;
  radiusPercent?: number;
  bossDamagePercent?: number;
  executeDamagePercent?: number;
  cooldownReduction?: number;
}

export interface TowerBattleBranchData {
  branchID: string;
  towerID: TowerId;
  level: BattleBranchTier;
  displayName: string;
  description: string;
  modifiers: BattleUpgradeModifiers;
  effect: BattleBranchEffect;
  visualID: string;
}

export interface TowerBattleUpgradeData {
  towerID: TowerId;
  levelMultipliers: readonly [1, 1.15, 1.3, 1.5, 1.75];
  upgradeCosts: readonly [number, number, number, number];
  level3: readonly [TowerBattleBranchData, TowerBattleBranchData];
  level5: readonly [TowerBattleBranchData, TowerBattleBranchData];
}

export const BATTLE_LEVEL_MULTIPLIERS = [1, 1.15, 1.3, 1.5, 1.75] as const;
const BASE_UPGRADE_COSTS = [100, 150, 225, 325] as const;

const branch = (
  towerID: TowerId,
  level: BattleBranchTier,
  suffix: string,
  displayName: string,
  description: string,
  modifiers: BattleUpgradeModifiers,
  effect: BattleBranchEffect = 'NONE',
): TowerBattleBranchData => ({
  branchID: `${towerID}_BL${level}_${suffix}`,
  towerID,
  level,
  displayName,
  description,
  modifiers,
  effect,
  visualID: `VIS_${suffix}`,
});

type BranchSeed = [string, string, BattleUpgradeModifiers, BattleBranchEffect?];

const DATA: Record<
  TowerId,
  {
    level3: readonly [BranchSeed, BranchSeed];
    level5: readonly [BranchSeed, BranchSeed];
  }
> = {
  EARTH_BASIC_AUTO_TURRET: {
    level3: [
      ['精準模組', '攻擊 +20%。', { attackPercent: 0.2 }],
      ['快速供彈', '攻速 +20%。', { attackSpeedPercent: 0.2 }],
    ],
    level5: [
      [
        '集中火力',
        '持續鎖定時提升傷害。',
        {},
        'FOCUS_RAMP',
      ],
      ['自動掃射', '每第 4 發掃射附近第二目標。', {}, 'SECOND_TARGET'],
    ],
  },
  EARTH_RAPID_FIRE_TURRET: {
    level3: [
      ['過載彈匣', '攻速 +25%。', { attackSpeedPercent: 0.25 }],
      [
        '雙重射擊',
        '每第 5 發追加一次攻擊。',
        { attackPercent: 0.08 },
        'DOUBLE_SHOT_5',
      ],
    ],
    level5: [
      [
        '極速領域',
        '連續攻擊同一目標，每秒攻速 +8%，最多 +48%；換目標重置。',
        {},
        'SPEED_RAMP',
      ],
      ['彈幕壓制', '每發有 30% 機率命中附近第二目標。', {}, 'SECOND_TARGET'],
    ],
  },
  EARTH_ARMOR_PIERCING_TURRET: {
    level3: [
      ['高密度彈芯', '大幅增加貫穿。', { penetration: 95 }],
      [
        '超長炮管',
        '射程 +20%，攻擊 +10%。',
        { rangePercent: 0.2, attackPercent: 0.1 },
      ],
    ],
    level5: [
      [
        '完全貫穿',
        '貫穿後再無視 45% 剩餘防禦。',
        {},
        'IGNORE_DEFENSE',
      ],
      [
        '貫穿連殺',
        '貫穿後的傷害衰減降低。',
        { maxTargets: 2, attackPercent: 0.12 },
        'PIERCE_PRESERVE',
      ],
    ],
  },
  EARTH_BLAST_TURRET: {
    level3: [
      ['高爆核心', '爆炸傷害 +25%。', { aoeDamagePercent: 0.25 }],
      ['廣域彈頭', '爆炸半徑 +30%，目標數 +2。', { maxTargets: 2, radiusPercent: 0.3 }],
    ],
    level5: [
      [
        '連鎖爆破',
        '擊破後觸發二次爆炸。',
        { aoeDamagePercent: 0.18 },
        'CHAIN_EXPLOSION',
      ],
      [
        '燃燒區域',
        '爆炸留下短暫傷害區域。',
        { attackPercent: 0.22 },
        'BURN_FIELD',
      ],
    ],
  },
  EARTH_THUNDER_TURRET: {
    level3: [
      ['高壓電流', '雷擊傷害提高。', { attackPercent: 0.22 }],
      ['擴散回路', '連鎖 +1 目標。', { maxTargets: 1 }],
    ],
    level5: [
      ['雷暴核心', '週期性降下雷擊。', { critChance: 0.12 }, 'STORM_STRIKE'],
      [
        '無限導流',
        '連鎖衰減降低。',
        { attackPercent: 0.18, maxTargets: 1 },
        'CHAIN_PRESERVE',
      ],
    ],
  },
  EARTH_DIVINE_JUDGMENT_TURRET: {
    level3: [
      ['裁決透鏡', '頭目傷害 +22%。', { bossDamagePercent: 0.22 }],
      [
        '聖光增幅',
        '攻擊與射程提升。',
        { attackPercent: 0.14, rangePercent: 0.12 },
      ],
    ],
    level5: [
      [
        '神罰迴響',
        '處決低生命敵人。',
        { executeDamagePercent: 0.35 },
        'EXECUTE',
      ],
      [
        '弱點聖印',
        '更容易擊穿頭目防禦。',
        { penetration: 160, bossDamagePercent: 0.18 },
        'WEAK_POINT',
      ],
    ],
  },
  EARTH_PHANTOM_TURRET: {
    level3: [
      ['虛界鏡片', '暴擊率提高。', { critChance: 0.16 }],
      ['相位驅動', '攻速提高。', { attackSpeedPercent: 0.2 }],
    ],
    level5: [
      [
        '無形處決',
        '暴擊與處決傷害提高。',
        { critDamagePercent: 0.38, executeDamagePercent: 0.2 },
        'EXECUTE',
      ],
      ['裂影分身', '取得額外目標。', { maxTargets: 1 }, 'SECOND_TARGET'],
    ],
  },
  EARTH_KING_AUTHORITY_TURRET: {
    level3: [
      [
        '王權光環',
        '強化攻擊與防禦。',
        { attackPercent: 0.12, defensePercent: 0.18 },
        'AURA',
      ],
      ['王城砲擊', '範圍傷害提高。', { aoeDamagePercent: 0.22 }],
    ],
    level5: [
      ['御令齊射', '增加命中目標。', { maxTargets: 2 }],
      [
        '不落王城',
        '大幅提高防禦與頭目傷害。',
        { defensePercent: 0.3, bossDamagePercent: 0.16 },
        'SANCTUARY',
      ],
    ],
  },
  EARTH_EMPEROR_ANNIHILATION_TURRET: {
    level3: [
      ['赤皇反應爐', '攻擊 +20%。', { attackPercent: 0.2 }],
      [
        '帝式長炮管',
        '射程與貫穿提高。',
        { rangePercent: 0.15, penetration: 170 },
      ],
    ],
    level5: [
      ['殲界直線', '增加貫穿目標。', { maxTargets: 2 }, 'PIERCE_PRESERVE'],
      [
        '皇威破綻',
        '對頭目與弱點傷害提高。',
        { bossDamagePercent: 0.28 },
        'WEAK_POINT',
      ],
    ],
  },
  EARTH_VENERABLE_TURRET: {
    level3: [
      ['至尊浮游臂', '增加範圍目標。', { maxTargets: 1 }],
      [
        '共鳴晶核',
        '技能冷卻與攻擊提高。',
        { cooldownReduction: 0.1, attackPercent: 0.12 },
      ],
    ],
    level5: [
      [
        '萬象陣列',
        '範圍與暴擊強化。',
        { aoeDamagePercent: 0.22, critChance: 0.1 },
        'ORBITAL',
      ],
      [
        '超越共鳴',
        '全面強化攻擊與攻速。',
        { attackPercent: 0.16, attackSpeedPercent: 0.16 },
      ],
    ],
  },
  EARTH_SAINT_DOMAIN_TURRET: {
    level3: [
      [
        '聖域擴張',
        '射程與防禦提高。',
        { rangePercent: 0.16, defensePercent: 0.2 },
        'SANCTUARY',
      ],
      ['聖光聚焦', '頭目傷害提高。', { bossDamagePercent: 0.24 }],
    ],
    level5: [
      [
        '救贖光翼',
        '攻速與多目標能力提高。',
        { attackSpeedPercent: 0.15, maxTargets: 1 },
        'AURA',
      ],
      [
        '末日聖裁',
        '處決與暴擊傷害提高。',
        { executeDamagePercent: 0.28, critDamagePercent: 0.3 },
        'EXECUTE',
      ],
    ],
  },
  EARTH_SOVEREIGN_END_TURRET: {
    level3: [
      ['帝境軌道環', '增加全域攻擊目標。', { maxTargets: 2 }, 'ORBITAL'],
      [
        '終焉核心',
        '攻擊與暴擊提高。',
        { attackPercent: 0.18, critChance: 0.1 },
      ],
    ],
    level5: [
      [
        '萬界終止',
        '頭目與處決傷害提高。',
        { bossDamagePercent: 0.25, executeDamagePercent: 0.25 },
        'EXECUTE',
      ],
      [
        '蝕界同步',
        '攻速、範圍與多目標提升。',
        { attackSpeedPercent: 0.18, rangePercent: 0.12, maxTargets: 1 },
        'ORBITAL',
      ],
    ],
  },
};

const BUILD_COSTS: Record<TowerId, number> = {
  EARTH_BASIC_AUTO_TURRET: 100,
  EARTH_RAPID_FIRE_TURRET: 120,
  EARTH_ARMOR_PIERCING_TURRET: 160,
  EARTH_BLAST_TURRET: 180,
  EARTH_THUNDER_TURRET: 220,
  EARTH_DIVINE_JUDGMENT_TURRET: 250,
  EARTH_PHANTOM_TURRET: 280,
  EARTH_KING_AUTHORITY_TURRET: 320,
  EARTH_EMPEROR_ANNIHILATION_TURRET: 360,
  EARTH_VENERABLE_TURRET: 400,
  EARTH_SAINT_DOMAIN_TURRET: 450,
  EARTH_SOVEREIGN_END_TURRET: 500,
};

export const TOWER_BATTLE_UPGRADES = Object.fromEntries(
  (Object.keys(DATA) as TowerId[]).map((towerID) => {
    const source = DATA[towerID];
    const create = (level: BattleBranchTier, seed: BranchSeed, index: number) =>
      branch(
        towerID,
        level,
        `${level}_${index === 0 ? 'A' : 'B'}`,
        seed[0],
        seed[1],
        seed[2],
        seed[3],
      );
    return [
      towerID,
      {
        towerID,
        levelMultipliers: BATTLE_LEVEL_MULTIPLIERS,
        upgradeCosts: BASE_UPGRADE_COSTS,
        level3: [
          create(3, source.level3[0], 0),
          create(3, source.level3[1], 1),
        ],
        level5: [
          create(5, source.level5[0], 0),
          create(5, source.level5[1], 1),
        ],
      },
    ];
  }),
) as unknown as Record<TowerId, TowerBattleUpgradeData>;

export function battleBuildCost(towerID: TowerId, reduction = 0) {
  return Math.max(
    25,
    Math.round((BUILD_COSTS[towerID] * (1 - reduction)) / 5) * 5,
  );
}

export function battleUpgradeCost(
  towerID: TowerId,
  currentLevel: number,
  reduction = 0,
) {
  if (currentLevel >= 5) return 0;
  const rarityFactor = 0.82 + BUILD_COSTS[towerID] / 1000;
  const base = BASE_UPGRADE_COSTS[Math.max(0, currentLevel - 1)] * rarityFactor;
  return Math.max(50, Math.round((base * (1 - reduction)) / 5) * 5);
}

export function getBattleBranch(towerID: TowerId, branchID: string | null) {
  if (!branchID) return null;
  const data = TOWER_BATTLE_UPGRADES[towerID];
  return (
    [...data.level3, ...data.level5].find(
      (item) => item.branchID === branchID,
    ) ?? null
  );
}

export function getBattleBranches(towerID: TowerId, level: BattleBranchTier) {
  return TOWER_BATTLE_UPGRADES[towerID][level === 3 ? 'level3' : 'level5'];
}
