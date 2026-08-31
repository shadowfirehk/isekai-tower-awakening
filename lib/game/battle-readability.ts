import { MapTopology } from './battle-depth';
import { TowerId } from './types';

export interface BattlePoint {
  x: number;
  y: number;
}

export interface BattlePathSample extends BattlePoint {
  heading: number;
  targetWaypoint: number;
  segmentProgress: number;
}

export type HitFeedbackKind =
  | 'NORMAL_HIT'
  | 'RAPID_HIT'
  | 'PIERCE_HIT'
  | 'EXPLOSION_HIT'
  | 'LIGHTNING_HIT'
  | 'HOLY_HIT'
  | 'VOID_HIT'
  | 'HEAVY_HIT';

export interface TowerAttackProfile {
  towerID: TowerId;
  attackClass: string;
  displayName: string;
  projectileShape: string;
  trail: string;
  impact: HitFeedbackKind;
  travelDuration: number;
  chargeDuration: number;
  soundHook: string;
  cameraShake: number;
}

export const BATTLE_TYPOGRAPHY = {
  TEXT_XL: 'clamp(1.55rem, 2.25vw, 2.35rem)',
  TEXT_LARGE: 'clamp(1.05rem, 1.45vw, 1.4rem)',
  TEXT_MEDIUM: 'clamp(.82rem, 1vw, 1rem)',
  TEXT_SMALL: 'clamp(.7rem, .82vw, .82rem)',
} as const;

export const DAMAGE_AGGREGATION_WINDOW = 0.28;
export const MAX_WORLD_FEEDBACK_ITEMS = 72;

const PATHS: Record<MapTopology, [BattlePoint[], BattlePoint[]]> = {
  WINDING: [
    [
      { x: 5, y: 70 },
      { x: 35, y: 70 },
      { x: 35, y: 30 },
      { x: 70, y: 30 },
      { x: 93, y: 65 },
    ],
    [
      { x: 5, y: 72 },
      { x: 33, y: 72 },
      { x: 38, y: 32 },
      { x: 70, y: 32 },
      { x: 93, y: 65 },
    ],
  ],
  MERGE: [
    [
      { x: 4, y: 30 },
      { x: 25, y: 30 },
      { x: 42, y: 49 },
      { x: 66, y: 51 },
      { x: 94, y: 51 },
    ],
    [
      { x: 4, y: 72 },
      { x: 25, y: 72 },
      { x: 42, y: 53 },
      { x: 66, y: 51 },
      { x: 94, y: 51 },
    ],
  ],
  PARALLEL: [
    [
      { x: 5, y: 32 },
      { x: 36, y: 32 },
      { x: 70, y: 32 },
      { x: 82, y: 43 },
      { x: 94, y: 52 },
    ],
    [
      { x: 5, y: 68 },
      { x: 36, y: 68 },
      { x: 70, y: 68 },
      { x: 82, y: 58 },
      { x: 94, y: 52 },
    ],
  ],
  CORE_SIEGE: [
    [
      { x: 5, y: 50 },
      { x: 22, y: 29 },
      { x: 47, y: 22 },
      { x: 72, y: 37 },
      { x: 94, y: 50 },
    ],
    [
      { x: 5, y: 50 },
      { x: 22, y: 71 },
      { x: 47, y: 78 },
      { x: 72, y: 63 },
      { x: 94, y: 50 },
    ],
  ],
};

function distance(a: BattlePoint, b: BattlePoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizeAngle(value: number) {
  let angle = value;
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

export function interpolateHeading(
  current: number,
  target: number,
  response: number,
) {
  return normalizeAngle(
    current +
      normalizeAngle(target - current) * Math.max(0, Math.min(1, response)),
  );
}

export function getBattleWaypoints(
  topology: MapTopology,
  branch = 0,
): BattlePoint[] {
  return PATHS[topology][branch ? 1 : 0].map((point) => ({ ...point }));
}

export function sampleBattlePath(
  progress: number,
  topology: MapTopology,
  branch = 0,
): BattlePathSample {
  const points = PATHS[topology][branch ? 1 : 0];
  const lengths = points
    .slice(0, -1)
    .map((point, index) => distance(point, points[index + 1]));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let remaining = Math.max(0, Math.min(1, progress)) * total;
  for (let index = 0; index < lengths.length; index++) {
    const length = lengths[index];
    if (remaining <= length || index === lengths.length - 1) {
      const start = points[index];
      const end = points[index + 1];
      const segmentProgress = Math.max(0, Math.min(1, remaining / length));
      return {
        x: start.x + (end.x - start.x) * segmentProgress,
        y: start.y + (end.y - start.y) * segmentProgress,
        heading: (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI,
        targetWaypoint: index + 1,
        segmentProgress,
      };
    }
    remaining -= length;
  }
  const last = points[points.length - 1];
  return {
    ...last,
    heading: 0,
    targetWaypoint: points.length - 1,
    segmentProgress: 1,
  };
}

const PROFILE_ROWS: Array<
  [
    TowerId,
    string,
    string,
    string,
    string,
    HitFeedbackKind,
    number,
    number,
    string,
    number,
  ]
> = [
  [
    'EARTH_BASIC_AUTO_TURRET',
    'basic-bullet',
    '標準能量彈',
    'blue-white bullet',
    'thin blue trail',
    'NORMAL_HIT',
    0.18,
    0,
    'SFX_TOWER_BASIC_PULSE',
    0,
  ],
  [
    'EARTH_RAPID_FIRE_TURRET',
    'rapid-rounds',
    '高速連射',
    'narrow twin rounds',
    'short cyan streaks',
    'RAPID_HIT',
    0.1,
    0,
    'SFX_TOWER_RAPID_TICK',
    0,
  ],
  [
    'EARTH_ARMOR_PIERCING_TURRET',
    'rail-pierce',
    '高能軌道貫穿',
    'purple-white rail line',
    'penetration line',
    'PIERCE_HIT',
    0.16,
    0.2,
    'SFX_TOWER_RAIL_CHARGE',
    0,
  ],
  [
    'EARTH_BLAST_TURRET',
    'blast-shell',
    '爆裂能量彈',
    'magenta heavy shell',
    'dense magenta trail',
    'EXPLOSION_HIT',
    0.36,
    0,
    'SFX_TOWER_BLAST_LAUNCH',
    0.12,
  ],
  [
    'EARTH_THUNDER_TURRET',
    'chain-lightning',
    '雷霆連鎖',
    'jagged electric arc',
    'blue-gold branches',
    'LIGHTNING_HIT',
    0.12,
    0,
    'SFX_TOWER_THUNDER_ARC',
    0,
  ],
  [
    'EARTH_DIVINE_JUDGMENT_TURRET',
    'holy-beam',
    '神聖裁決',
    'white-gold sacred beam',
    'rotating halo trace',
    'HOLY_HIT',
    0.22,
    0.12,
    'SFX_TOWER_HOLY_JUDGMENT',
    0,
  ],
  [
    'EARTH_PHANTOM_TURRET',
    'void-slash',
    '虛影次元斬',
    'black-violet phase slash',
    'distortion echo',
    'VOID_HIT',
    0.2,
    0,
    'SFX_TOWER_VOID_SLASH',
    0,
  ],
  [
    'EARTH_KING_AUTHORITY_TURRET',
    'royal-cannon',
    '王權能量炮',
    'royal blue-gold cannon',
    'crown geometry trail',
    'HEAVY_HIT',
    0.24,
    0.08,
    'SFX_TOWER_ROYAL_DECREE',
    0.06,
  ],
  [
    'EARTH_EMPEROR_ANNIHILATION_TURRET',
    'emperor-beam',
    '帝皇殲滅炮',
    'crimson-gold annihilation line',
    'stabilizer flare',
    'HEAVY_HIT',
    0.24,
    0.24,
    'SFX_TOWER_EMPEROR_ANNIHILATE',
    0.12,
  ],
  [
    'EARTH_VENERABLE_TURRET',
    'venerable-salvo',
    '至尊浮游齊射',
    'sequential weapon bolts',
    'purple-white module trail',
    'HEAVY_HIT',
    0.2,
    0.06,
    'SFX_TOWER_VENERABLE_SALVO',
    0.06,
  ],
  [
    'EARTH_SAINT_DOMAIN_TURRET',
    'saint-spear',
    '聖域光槍',
    'cyan-white light spear',
    'wing halo trail',
    'HOLY_HIT',
    0.2,
    0.08,
    'SFX_TOWER_SAINT_SPEAR',
    0,
  ],
  [
    'EARTH_SOVEREIGN_END_TURRET',
    'sovereign-collapse',
    '帝境終焉收束',
    'black-white-gold collapse beam',
    'orbital space fold',
    'VOID_HIT',
    0.26,
    0.22,
    'SFX_TOWER_SOVEREIGN_COLLAPSE',
    0.14,
  ],
];

export const TOWER_ATTACK_PROFILES = Object.fromEntries(
  PROFILE_ROWS.map((row) => {
    const [
      towerID,
      attackClass,
      displayName,
      projectileShape,
      trail,
      impact,
      travelDuration,
      chargeDuration,
      soundHook,
      cameraShake,
    ] = row;
    const profile: TowerAttackProfile = {
      towerID,
      attackClass,
      displayName,
      projectileShape,
      trail,
      impact,
      travelDuration,
      chargeDuration,
      soundHook,
      cameraShake,
    };
    return [towerID, profile];
  }),
) as Record<TowerId, TowerAttackProfile>;
