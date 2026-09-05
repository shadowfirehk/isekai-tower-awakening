import { EarthTierId, TowerId } from './types';

export type BuildTag =
  | 'GENERAL'
  | 'RAPID_FIRE'
  | 'CHAIN'
  | 'ARMOR_BREAK'
  | 'AOE'
  | 'CRIT'
  | 'DEFENSE'
  | 'BOSS'
  | 'OVERDRIVE';
export type SkillEffect =
  | 'HASTE'
  | 'OVERHEAT'
  | 'PIERCE'
  | 'METEOR'
  | 'CHAIN_STORM'
  | 'JUDGMENT'
  | 'PHANTOM'
  | 'ROYAL_AURA'
  | 'ANNIHILATION'
  | 'RESONANCE'
  | 'SANCTUARY'
  | 'SOVEREIGN_END';
export interface TowerSkillData {
  skillID: string;
  towerID: TowerId;
  displayName: string;
  description: string;
  cooldown: number;
  duration: number;
  effect: SkillEffect;
  icon: string;
  tags: BuildTag[];
  vfxID: string;
  sfxID: string;
}

const SKILL_SEEDS: Array<
  [TowerId, string, string, number, number, SkillEffect, BuildTag[]]
> = [
  [
    'EARTH_BASIC_AUTO_TURRET',
    '超載射擊',
    '6 秒內攻速提升 50%。',
    30,
    6,
    'HASTE',
    ['GENERAL', 'RAPID_FIRE'],
  ],
  [
    'EARTH_RAPID_FIRE_TURRET',
    '極限超頻',
    '8 秒內攻速翻倍，但單發威力降低 20%。',
    34,
    8,
    'OVERHEAT',
    ['RAPID_FIRE', 'OVERDRIVE'],
  ],
  [
    'EARTH_ARMOR_PIERCING_TURRET',
    '貫星射線',
    '下一擊貫穿整條路徑並大幅無視防禦。',
    28,
    0,
    'PIERCE',
    ['ARMOR_BREAK', 'BOSS'],
  ],
  [
    'EARTH_BLAST_TURRET',
    '隕爆轟擊',
    '鎖定敵群，引爆大範圍隕星衝擊。',
    36,
    0,
    'METEOR',
    ['AOE'],
  ],
  [
    'EARTH_THUNDER_TURRET',
    '雷域解放',
    '8 秒內連鎖目標增加並施加 SHOCKED。',
    38,
    8,
    'CHAIN_STORM',
    ['CHAIN', 'RAPID_FIRE'],
  ],
  [
    'EARTH_DIVINE_JUDGMENT_TURRET',
    '神罰',
    '對最高生命敵人降下高額裁決，對頭目加成。',
    42,
    0,
    'JUDGMENT',
    ['BOSS'],
  ],
  [
    'EARTH_PHANTOM_TURRET',
    '虛界穿行',
    '6 秒內暴擊率大幅提升並優先鎖定強敵。',
    38,
    6,
    'PHANTOM',
    ['CRIT', 'AOE'],
  ],
  [
    'EARTH_KING_AUTHORITY_TURRET',
    '王域展開',
    '10 秒內強化全隊攻擊與防禦。',
    48,
    10,
    'ROYAL_AURA',
    ['DEFENSE', 'BOSS'],
  ],
  [
    'EARTH_EMPEROR_ANNIHILATION_TURRET',
    '帝皇殲滅炮',
    '蓄積重炮，造成高穿透直線殲滅傷害。',
    50,
    0,
    'ANNIHILATION',
    ['ARMOR_BREAK', 'BOSS'],
  ],
  [
    'EARTH_VENERABLE_TURRET',
    '至尊共鳴',
    '8 秒內將所有已啟動協同效果放大 50%。',
    46,
    8,
    'RESONANCE',
    ['GENERAL'],
  ],
  [
    'EARTH_SAINT_DOMAIN_TURRET',
    '聖域降臨',
    '10 秒聖域：攻速、頭目傷害與陣線保護提升。',
    52,
    10,
    'SANCTUARY',
    ['DEFENSE', 'BOSS'],
  ],
  [
    'EARTH_SOVEREIGN_END_TURRET',
    '終焉裁決',
    '依協同數量增幅的全戰場終焉攻擊。',
    60,
    0,
    'SOVEREIGN_END',
    ['AOE', 'BOSS', 'OVERDRIVE'],
  ],
];
export const TOWER_SKILLS = Object.fromEntries(
  SKILL_SEEDS.map(
    ([towerID, displayName, description, cooldown, duration, effect, tags]) => [
      towerID,
      {
        skillID: `SKILL_${towerID}`,
        towerID,
        displayName,
        description,
        cooldown,
        duration,
        effect,
        tags,
        icon: effect,
        vfxID: `VFX_${effect}`,
        sfxID: `SFX_${effect}`,
      },
    ],
  ),
) as Record<TowerId, TowerSkillData>;

export const TOWER_AFFINITIES: Record<TowerId, BuildTag[]> = {
  EARTH_BASIC_AUTO_TURRET: ['GENERAL', 'RAPID_FIRE'],
  EARTH_RAPID_FIRE_TURRET: ['RAPID_FIRE', 'OVERDRIVE'],
  EARTH_ARMOR_PIERCING_TURRET: ['ARMOR_BREAK', 'BOSS'],
  EARTH_BLAST_TURRET: ['AOE'],
  EARTH_THUNDER_TURRET: ['CHAIN', 'RAPID_FIRE'],
  EARTH_DIVINE_JUDGMENT_TURRET: ['BOSS'],
  EARTH_PHANTOM_TURRET: ['CRIT', 'AOE'],
  EARTH_KING_AUTHORITY_TURRET: ['DEFENSE'],
  EARTH_EMPEROR_ANNIHILATION_TURRET: ['ARMOR_BREAK', 'BOSS'],
  EARTH_VENERABLE_TURRET: ['GENERAL'],
  EARTH_SAINT_DOMAIN_TURRET: ['DEFENSE', 'BOSS'],
  EARTH_SOVEREIGN_END_TURRET: ['AOE', 'BOSS', 'OVERDRIVE'],
};
export const GOLDEN_TUTORIAL_LOADOUT: TowerId[] = [
  'EARTH_RAPID_FIRE_TURRET',
  'EARTH_ARMOR_PIERCING_TURRET',
  'EARTH_BLAST_TURRET',
];
export const BUILD_PRESETS: {name:string;hint:string;towers:TowerId[]}[] = [
  {name:'混合防線',hint:'連射清漏怪、穿甲抓弱點、爆裂守交會點',towers:GOLDEN_TUTORIAL_LOADOUT},
  {name:'疾雷流',hint:'追擊感電目標，快速回收技能與超載能量',towers:['EARTH_RAPID_FIRE_TURRET','EARTH_THUNDER_TURRET','EARTH_BASIC_AUTO_TURRET']},
  {name:'破甲殲滅流',hint:'沿長直線設防，保留爆發給六秒弱點窗',towers:['EARTH_ARMOR_PIERCING_TURRET','EARTH_EMPEROR_ANNIHILATION_TURRET','EARTH_BASIC_AUTO_TURRET']},
  {name:'爆裂暴擊流',hint:'在敵群匯合處引發暴擊與二次爆炸',towers:['EARTH_BLAST_TURRET','EARTH_PHANTOM_TURRET','EARTH_BASIC_AUTO_TURRET']},
  {name:'聖域壁壘流',hint:'王權與聖域鄰近部署，建立保護基地的陣形',towers:['EARTH_KING_AUTHORITY_TURRET','EARTH_SAINT_DOMAIN_TURRET','EARTH_BASIC_AUTO_TURRET']},
];
export const GOLDEN_BLESSING_IDS = [
  'B_POWER_MATRIX','B_PRECISION','B_BOSS_HUNTER','B_RAPID_SUPPLY',
  'B_OVERHEAT','B_CHAIN_SPREAD','B_ARMOR_CORE','B_OPEN_PLATES',
  'B_HEAVY_CALIBER','B_BLAST_AMP','B_CHAIN_REACTION','B_FORTRESS',
  'B_BOUNTY_HUNTER','B_EFFICIENT_BUILD','B_TACTICAL_INVESTMENT',
];

export type BlessingRarity = 'COMMON' | 'RARE' | 'EPIC';
export type BlessingClass = 'BUILD_SUPPORT' | 'GENERAL_POWER' | 'TRANSFORMER';
export interface BlessingModifiers {
  attackPercent?: number;
  attackSpeedPercent?: number;
  attackPenalty?: number;
  critChance?: number;
  critDamagePercent?: number;
  penetration?: number;
  bossDamagePercent?: number;
  armoredDamagePercent?: number;
  aoeDamagePercent?: number;
  chainTargets?: number;
  cooldownReduction?: number;
  overdriveGainPercent?: number;
  executeDamagePercent?: number;
  baseDamageReduction?: number;
  goldGainPercent?: number;
  buildCostReduction?: number;
  upgradeCostReduction?: number;
}
export interface BattleBlessingData {
  blessingID: string;
  displayName: string;
  description: string;
  rarity: BlessingRarity;
  classification: BlessingClass;
  tags: BuildTag[];
  stackable: boolean;
  maxStacks: number;
  modifiers: BlessingModifiers;
  evolutionNames?: string[];
  risk?: string;
}
const blessing = (
  blessingID: string,
  displayName: string,
  description: string,
  rarity: BlessingRarity,
  classification: BlessingClass,
  tags: BuildTag[],
  maxStacks: number,
  modifiers: BlessingModifiers,
  evolutionNames?: string[],
  risk?: string,
): BattleBlessingData => ({
  blessingID,
  displayName,
  description,
  rarity,
  classification,
  tags,
  stackable: maxStacks > 1,
  maxStacks,
  modifiers,
  evolutionNames,
  risk,
});
export const BATTLE_BLESSINGS: BattleBlessingData[] = [
  blessing(
    'B_POWER_MATRIX',
    '戰鬥演算',
    '全炮塔攻擊 +12%，技能冷卻 -8%。',
    'COMMON',
    'GENERAL_POWER',
    ['GENERAL'],
    2,
    { attackPercent: 0.12, cooldownReduction: 0.08 },
    ['戰鬥演算 I', '戰鬥演算 II'],
  ),
  blessing(
    'B_PRECISION',
    '精密校準',
    '暴擊率 +10%，暴擊傷害 +18%。',
    'COMMON',
    'GENERAL_POWER',
    ['GENERAL', 'CRIT'],
    2,
    { critChance: 0.1, critDamagePercent: 0.18 },
    ['精密校準 I', '精密校準 II'],
  ),
  blessing(
    'B_BOSS_HUNTER',
    'Boss Hunter',
    '頭目傷害 +28%。',
    'RARE',
    'BUILD_SUPPORT',
    ['BOSS'],
    2,
    { bossDamagePercent: 0.28 },
    ['Boss Hunter I', 'Boss Hunter II'],
  ),
  blessing(
    'B_EXECUTION',
    '終結演算',
    '生命低於 18% 的敵人受到額外傷害。',
    'RARE',
    'GENERAL_POWER',
    ['GENERAL'],
    1,
    { executeDamagePercent: 0.24 },
  ),
  blessing(
    'B_PERFECT_LINE',
    '完美防線',
    '基地滿血時，全炮塔攻擊 +22%。',
    'RARE',
    'BUILD_SUPPORT',
    ['DEFENSE'],
    1,
    { attackPercent: 0.22 },
  ),
  blessing(
    'B_LAST_STAND',
    '逆境爆發',
    '基地低於一半時，攻速 +32%。',
    'RARE',
    'TRANSFORMER',
    ['DEFENSE', 'RAPID_FIRE'],
    1,
    { attackSpeedPercent: 0.32 },
    undefined,
    '僅在基地低於 50% 生效',
  ),
  blessing(
    'B_RAPID_SUPPLY',
    '超速供能',
    '連射系攻速 +20%，每十發獲得額外動能。',
    'COMMON',
    'BUILD_SUPPORT',
    ['RAPID_FIRE'],
    3,
    { attackSpeedPercent: 0.2, overdriveGainPercent: 0.1 },
    ['超速供能 I', '超速供能 II', '無限供能'],
  ),
  blessing(
    'B_OVERHEAT',
    '過熱協議',
    '攻速 +35%、單發 -15%；暴擊額外產生 Overdrive。',
    'EPIC',
    'TRANSFORMER',
    ['RAPID_FIRE', 'CRIT', 'OVERDRIVE'],
    1,
    {
      attackSpeedPercent: 0.35,
      attackPenalty: 0.15,
      overdriveGainPercent: 0.35,
    },
    undefined,
    '單發攻擊 -15%',
  ),
  blessing(
    'B_MOMENTUM',
    '動能回收',
    'Overdrive 獲取 +35%，技能冷卻 -6%。',
    'COMMON',
    'BUILD_SUPPORT',
    ['OVERDRIVE'],
    2,
    { overdriveGainPercent: 0.35, cooldownReduction: 0.06 },
    ['動能回收 I', '動能回收 II'],
  ),
  blessing(
    'B_CHAIN_SPREAD',
    '雷能擴散',
    '連鎖目標 +1；升級後提高 Shock 傷害。',
    'RARE',
    'BUILD_SUPPORT',
    ['CHAIN'],
    3,
    { chainTargets: 1, aoeDamagePercent: 0.08 },
    ['雷能擴散 I', '雷能擴散 II', '天雷領域'],
  ),
  blessing(
    'B_STORM_HEART',
    '風暴核心',
    '連鎖與高速炮塔攻速 +18%，頭目傷害 +10%。',
    'EPIC',
    'BUILD_SUPPORT',
    ['CHAIN', 'RAPID_FIRE'],
    1,
    { attackSpeedPercent: 0.18, bossDamagePercent: 0.1 },
  ),
  blessing(
    'B_ARMOR_CORE',
    '貫穿核心',
    '穿透 +40，對重甲敵人傷害 +18%。',
    'COMMON',
    'BUILD_SUPPORT',
    ['ARMOR_BREAK'],
    3,
    { penetration: 40, armoredDamagePercent: 0.18 },
    ['貫穿核心 I', '貫穿核心 II', '零界貫通'],
  ),
  blessing(
    'B_OPEN_PLATES',
    '弱點解析',
    'Boss Vulnerable 期間傷害進一步 +35%。',
    'RARE',
    'BUILD_SUPPORT',
    ['ARMOR_BREAK', 'BOSS'],
    1,
    { armoredDamagePercent: 0.35 },
  ),
  blessing(
    'B_HEAVY_CALIBER',
    '重裝協定',
    '攻速 -12%，攻擊 +38%，穿透 +60。',
    'EPIC',
    'TRANSFORMER',
    ['ARMOR_BREAK', 'BOSS'],
    1,
    { attackPercent: 0.38, attackSpeedPercent: -0.12, penetration: 60 },
    undefined,
    '攻速 -12%',
  ),
  blessing(
    'B_BLAST_AMP',
    '爆裂增幅',
    '範圍傷害 +22%，暴擊率 +6%。',
    'COMMON',
    'BUILD_SUPPORT',
    ['AOE', 'CRIT'],
    3,
    { aoeDamagePercent: 0.22, critChance: 0.06 },
    ['爆裂增幅 I', '爆裂增幅 II', '星隕反應'],
  ),
  blessing(
    'B_CHAIN_REACTION',
    '臨界連爆',
    '暴擊爆炸會對鄰近敵人造成二次衝擊。',
    'EPIC',
    'TRANSFORMER',
    ['AOE', 'CRIT'],
    1,
    { aoeDamagePercent: 0.35, critDamagePercent: 0.25 },
  ),
  blessing(
    'B_PHANTOM_EDGE',
    '虛界鋒芒',
    '暴擊率 +16%，穿透 +25。',
    'RARE',
    'BUILD_SUPPORT',
    ['CRIT'],
    2,
    { critChance: 0.16, penetration: 25 },
    ['虛界鋒芒 I', '虛界鋒芒 II'],
  ),
  blessing(
    'B_FORTRESS',
    '堅守陣線',
    '基地傷害減免 15%，全炮塔攻擊 +8%。',
    'COMMON',
    'BUILD_SUPPORT',
    ['DEFENSE'],
    3,
    { baseDamageReduction: 0.15, attackPercent: 0.08 },
    ['堅守陣線 I', '堅守陣線 II', '絕對壁壘'],
  ),
  blessing(
    'B_SANCTUARY',
    '聖域共振',
    '防禦流技能冷卻 -18%，Boss 傷害 +15%。',
    'RARE',
    'BUILD_SUPPORT',
    ['DEFENSE', 'BOSS'],
    1,
    { cooldownReduction: 0.18, bossDamagePercent: 0.15 },
  ),
  blessing(
    'B_GLASS_CANNON',
    '破界玻璃炮',
    '攻擊 +45%、攻速 +15%，基地承傷增加。',
    'EPIC',
    'TRANSFORMER',
    ['GENERAL'],
    1,
    {
      attackPercent: 0.45,
      attackSpeedPercent: 0.15,
      baseDamageReduction: -0.2,
    },
    undefined,
    '基地承傷 +20%',
  ),
  blessing(
    'B_QUICK_CYCLE',
    '極速冷卻',
    '技能冷卻 -16%。',
    'COMMON',
    'GENERAL_POWER',
    ['GENERAL'],
    2,
    { cooldownReduction: 0.16 },
    ['極速冷卻 I', '極速冷卻 II'],
  ),
  blessing(
    'B_OVERCLOCK_FIELD',
    '超載領域',
    'Overdrive 期間攻速再提升 35%。',
    'RARE',
    'BUILD_SUPPORT',
    ['OVERDRIVE', 'RAPID_FIRE'],
    1,
    { attackSpeedPercent: 0.35 },
  ),
  blessing(
    'B_TACTICAL_FOCUS',
    '戰術鎖定',
    '攻擊 +16%，穿透 +18。',
    'COMMON',
    'GENERAL_POWER',
    ['GENERAL'],
    2,
    { attackPercent: 0.16, penetration: 18 },
  ),
  blessing(
    'B_DIMENSIONAL_GAMBIT',
    '裂界賭局',
    '暴擊傷害 +70%、Overdrive +25%，攻擊 -10%。',
    'EPIC',
    'TRANSFORMER',
    ['CRIT', 'OVERDRIVE'],
    1,
    { critDamagePercent: 0.7, overdriveGainPercent: 0.25, attackPenalty: 0.1 },
    undefined,
    '基礎攻擊 -10%',
  ),
  blessing(
    'B_BOUNTY_HUNTER',
    '賞金獵人',
    '敵人擊破金幣 +15%。',
    'COMMON',
    'GENERAL_POWER',
    ['GENERAL'],
    2,
    { goldGainPercent: 0.15 },
    ['賞金獵人 I', '賞金獵人 II'],
  ),
  blessing(
    'B_EFFICIENT_BUILD',
    '高效建造',
    '本場炮塔建造成本 -10%。',
    'RARE',
    'TRANSFORMER',
    ['GENERAL'],
    1,
    { buildCostReduction: 0.1 },
  ),
  blessing(
    'B_TACTICAL_INVESTMENT',
    '戰術投資',
    '本場炮塔戰鬥升級成本 -12%。',
    'RARE',
    'TRANSFORMER',
    ['GENERAL'],
    1,
    { upgradeCostReduction: 0.12 },
  ),
];

export interface ActiveBattleBlessing {
  blessingID: string;
  stacks: number;
}
export interface TowerSynergyData {
  synergyID: string;
  displayName: string;
  description: string;
  requiredTowerIDs: TowerId[];
  tags: BuildTag[];
  modifiers: BlessingModifiers;
  specialEffect: string;
}
export const TOWER_SYNERGIES: TowerSynergyData[] = [
  {
    synergyID: 'S_RAPID_THUNDER',
    displayName: '疾雷連鎖',
    description: '高速射擊追擊 SHOCKED 目標，連鎖範圍提升。',
    requiredTowerIDs: ['EARTH_RAPID_FIRE_TURRET', 'EARTH_THUNDER_TURRET'],
    tags: ['RAPID_FIRE', 'CHAIN'],
    modifiers: {
      attackSpeedPercent: 0.12,
      chainTargets: 1,
      aoeDamagePercent: 0.15,
    },
    specialEffect: 'SHOCK_PURSUIT',
  },
  {
    synergyID: 'S_SIEGE_LINE',
    displayName: '破城陣線',
    description: '穿透提升，對重甲與 Boss 弱點造成更多傷害。',
    requiredTowerIDs: [
      'EARTH_ARMOR_PIERCING_TURRET',
      'EARTH_EMPEROR_ANNIHILATION_TURRET',
    ],
    tags: ['ARMOR_BREAK', 'BOSS'],
    modifiers: { penetration: 70, armoredDamagePercent: 0.15 },
    specialEffect: 'ARMOR_BREAK',
  },
  {
    synergyID: 'S_BLAST_END',
    displayName: '爆裂終結',
    description: '暴擊命中聚集敵群時觸發二次爆炸。',
    requiredTowerIDs: ['EARTH_BLAST_TURRET', 'EARTH_PHANTOM_TURRET'],
    tags: ['AOE', 'CRIT'],
    modifiers: { critChance: 0.08, aoeDamagePercent: 0.25 },
    specialEffect: 'CRIT_EXPLOSION',
  },
  {
    synergyID: 'S_HOLY_KING',
    displayName: '聖域王權',
    description: '強化全隊光環、陣線攻擊與頭目傷害。',
    requiredTowerIDs: [
      'EARTH_KING_AUTHORITY_TURRET',
      'EARTH_SAINT_DOMAIN_TURRET',
    ],
    tags: ['DEFENSE', 'BOSS'],
    modifiers: {
      attackPercent: 0.1,
      bossDamagePercent: 0.1,
      baseDamageReduction: 0.1,
    },
    specialEffect: 'ROYAL_SANCTUARY',
  },
];

export type BossMechanic =
  | 'FOCUS'
  | 'SPEED_UP'
  | 'ARMOR'
  | 'SHIELD'
  | 'REGEN'
  | 'ENRAGE'
  | 'SUMMON'
  | 'AURA'
  | 'CHARGE'
  | 'VULNERABLE'
  | 'PHASE_SHIFT'
  | 'PHASE_CHANGE'
  | 'BARRIER';
export interface BossMechanicConfig {
  tier: EarthTierId;
  primary: BossMechanic;
  thresholds: number[];
  timer: number;
  counterplay: string;
  telegraph: string;
}
const MECHANICS: Array<[BossMechanic, number[], number, string, string]> = [
  ['FOCUS', [], 0, '集中火力', '核心鎖定'],
  ['SPEED_UP', [0.5], 0, '高速射擊', '疾行脈衝'],
  ['ARMOR', [0.6], 8, '穿甲爆發', '紫晶裝甲閉合'],
  ['SHIELD', [0.7, 0.35], 0, '持續輸出破盾', '界障生成'],
  ['REGEN', [], 7, '保持連續傷害', '再生脈動'],
  ['ENRAGE', [0.5], 0, '留存技能與 Overdrive', '神環崩裂'],
  ['SUMMON', [], 8, '優先擊殺支援者', '裂隙召集'],
  ['AURA', [], 0, '清理增援或集火頭目', '王權光環'],
  ['CHARGE', [], 9, '在裝甲展開時爆發', '殲滅充能'],
  ['PHASE_SHIFT', [], 7, '依狀態調整鎖定', '尊相切換'],
  ['BARRIER', [0.7, 0.4], 0, '使用 Boss 特攻', '聖障降臨'],
  ['SHIELD', [0.7, 0.4], 6, '三階段綜合應對', '帝境軌道環啟動'],
];
const TIERS: EarthTierId[] = [
  'NORMAL',
  'RARE',
  'SCARCE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
  'SECRET',
  'KING',
  'EMPEROR',
  'VENERABLE',
  'SAINT',
  'SOVEREIGN',
];
export const BOSS_MECHANICS = Object.fromEntries(
  TIERS.map((tier, index) => {
    const [primary, thresholds, timer, counterplay, telegraph] =
      MECHANICS[index];
    return [tier, { tier, primary, thresholds, timer, counterplay, telegraph }];
  }),
) as Record<EarthTierId, BossMechanicConfig>;

export type MapTopology = 'WINDING' | 'MERGE' | 'PARALLEL' | 'CORE_SIEGE';
export const MAP_TOPOLOGY_BY_TIER = Object.fromEntries(
  TIERS.map((tier, index) => [
    tier,
    (['WINDING', 'MERGE', 'PARALLEL', 'CORE_SIEGE'] as MapTopology[])[
      index % 4
    ],
  ]),
) as Record<EarthTierId, MapTopology>;
